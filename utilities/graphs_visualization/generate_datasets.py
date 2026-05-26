import argparse
import os
import sys
import logging
import json
import random
import numpy as np
import torch
import networkx as nx
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE, SpectralEmbedding
from torch_geometric.utils import to_networkx, subgraph, from_networkx, homophily
from torch_geometric.datasets import WikipediaNetwork, Planetoid, WebKB, Actor, HeterophilousGraphDataset
from torch_geometric.data import Data
from sklearn.metrics import f1_score
from tqdm import tqdm



def generate_sbm(num_nodes, num_classes, num_features, homophily_coef, avg_degree=10, seed=42):
    """
    Generates a Stochastic Block Model (SBM) using advanced feature generation.
    
    Adapted from GRIOT/griot_utils/sbm_generation.py.

    Args:
        homophily_coef (float): 0.0 (Heterophilic) to 1.0 (Homophilic).
        avg_degree (int): Average degree of nodes.
    """
    if seed is not None:
        np.random.seed(seed)
        torch.manual_seed(seed)
        rng = np.random.RandomState(seed=seed)
    else:
        rng = np.random.RandomState()

    # --- 1. Calculate Probabilities (p_in, p_out) ---
    c = num_classes
    n = num_nodes
    total_prob_mass = (c * avg_degree) / n
    p_in = homophily_coef * total_prob_mass
    p_out = (total_prob_mass - p_in) / (c - 1)
    
    # Clip
    p_in = np.clip(p_in, 0, 1)
    p_out = np.clip(p_out, 0, 1)
    
    # --- 2. Generate Graph Structure (NetworkX SBM) ---
    block_sizes = [num_nodes // num_classes] * num_classes
    remainder = num_nodes % num_classes
    for i in range(remainder):
        block_sizes[i] += 1
        
    probs = np.ones((num_classes, num_classes)) * p_out
    np.fill_diagonal(probs, p_in)
    
    # Generate graph
    g = nx.stochastic_block_model(block_sizes, probs, seed=seed)
    g = g.to_undirected()
    
    # --- 3. Generate Features (GRIOT Logic) ---
    num_dep = int(num_features * 0.7) # 70% dependent features
    num_indep = num_features - num_dep # 30% independent features
    
    feat_dep = (0, 0, num_dep)
    feat_indep = (0, 0, num_indep)
    
    sizes = block_sizes 
    num_groups = len(sizes)
    
    # -- Dependent Features --
    # We generate features block by block, then assign them to the correct nodes
    # based on the graph partition.
    
    X_dep_list = []
    
    # Continuous dependent features
    for i in range(feat_dep[2]): # Continuous
        col_list = []
        for j in range(num_groups): # For each block
            size = sizes[j]
            mean = rng.random() * 2 - 1 
            vals = rng.normal(mean, 0.5, size) 
            col_list.append(vals)
        col = np.concatenate(col_list)
        X_dep_list.append(col)
        
    if X_dep_list:
        X_dep = np.stack(X_dep_list, axis=1) # (N, num_dep) - ordered by blocks
    else:
        X_dep = np.empty((n, 0))

    # -- Independent Features --
    X_indep_list = []
    for i in range(feat_indep[2]): # Continuous
        vals = rng.normal(0, 1, n)
        X_indep_list.append(vals)
        
    if X_indep_list:
        X_indep = np.stack(X_indep_list, axis=1) # (N, num_indep)
    else:
        X_indep = np.empty((n, 0))
        
    # Combine features (still ordered by blocks)
    X_block_ordered = np.hstack([X_dep, X_indep])
    
    # --- 4. Align with Graph Nodes ---
    # The graph nodes might not be 0..N sorted by block.
    # We use g.graph['partition'] to map correctly.
    
    part_idx = g.graph['partition'] # List of lists of nodes in each block
    
    x = torch.zeros((n, num_features), dtype=torch.float)
    y = torch.zeros(n, dtype=torch.long)
    
    # Provide features and labels to nodes
    current_idx = 0
    for block_id, nodes in enumerate(part_idx):
        block_len = len(nodes)
        
        # Get the slice of features for this block
        # X_block_ordered has features: [Block 0 features | Block 1 features | ... ]
        features_for_block = X_block_ordered[current_idx : current_idx + block_len]
        current_idx += block_len
        
        for i, node_id in enumerate(nodes):
            x[node_id] = torch.tensor(features_for_block[i], dtype=torch.float)
            y[node_id] = block_id
            
    # Convert to PyG Data
    edge_index = from_networkx(g).edge_index
    
    return Data(x=x, edge_index=edge_index, y=y, num_nodes=num_nodes)

def normalize_features(data):
    """Normalize features to [0, 1]."""
    if not hasattr(data, 'x'):
        return data
        
    x = data.x
    x_min = x.min(dim=0).values
    x_max = x.max(dim=0).values
    
    # Handle constant features (avoid division by zero)
    constant_mask = (x_min == x_max)
    x_min[constant_mask] = 0
    x_max[constant_mask] = 1
    
    x_norm = (x - x_min) / (x_max - x_min)
    data.x = x_norm
    return data

def drop_missing_classes(data, min_samples=10):
    """
    Drop nodes belonging to underrepresented classes.
    Ensures that StratifiedKFold has enough samples for splits.
    """
    unique_labels, counts = torch.unique(data.y, return_counts=True)
    # Filter labels with enough samples
    valid_labels = unique_labels[counts >= min_samples]
    
    if len(valid_labels) < len(unique_labels):
         logging.info(f"Dropping classes with < {min_samples} samples. Original classes: {len(unique_labels)}, Keeping: {len(valid_labels)}")
         mask = torch.isin(data.y, valid_labels)
         valid_idx = mask.nonzero(as_tuple=False).view(-1)
         
         # Subgraph
         new_edge_index, _ = subgraph(valid_idx, data.edge_index, relabel_nodes=True, num_nodes=data.num_nodes)
         data.x = data.x[valid_idx]
         data.y = data.y[valid_idx]
         data.edge_index = new_edge_index
         data.num_nodes = data.x.size(0)
         
         # Re-map labels to 0..K-1 to avoid gaps
         # This is crucial for models that expect 0..C-1
         unique_new, inverse = torch.unique(data.y, return_inverse=True)
         data.y = inverse
         
    return data

def keep_main_component(data):
    """Keep only the largest connected component."""
    G = to_networkx(data, to_undirected=True)
    largest_cc = max(nx.connected_components(G), key=len)
    main_nodes = torch.tensor(list(largest_cc), dtype=torch.long)
    
    new_edge_index, _ = subgraph(main_nodes, data.edge_index, relabel_nodes=True, num_nodes=data.num_nodes)
    data.x = data.x[main_nodes]
    data.y = data.y[main_nodes]
    data.edge_index = new_edge_index
    data.num_nodes = data.x.size(0)
    return data

def get_dataset(name, homophily_level=None, normalize=True):
    """
    Factory function to get datasets.
    """
    if name == "SBM":
        if homophily_level is None:
            raise ValueError("Must provide homophily_level for SBM.")
        data = generate_sbm(num_nodes=2000, num_classes=4, num_features=10, homophily_coef=homophily_level)
        return data # SBM features generated approx standard normal, no need to normalize to [0,1] strictly unless requested? 
                    # But keeping consistency: let's not normalize synthetic data by default unless explicitly asked?
                    # Actually, let's follow the standard: if normalize=True, we normalize.

    script_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(script_dir, "temp_data", name)
    name_lower = name.lower()
    
    data = None

    # Planetoid
    if name_lower in ["cora", "citeseer", "pubmed"]:
        # Map back to proper casing for PyG
        name_map = {"cora": "Cora", "citeseer": "CiteSeer", "pubmed": "PubMed"}
        dataset = Planetoid(root=path, name=name_map[name_lower])
        data = dataset[0]

    # WebKB
    elif name_lower in ["cornell", "texas", "wisconsin"]:
        name_map = {"cornell": "Cornell", "texas": "Texas", "wisconsin": "Wisconsin"}
        dataset = WebKB(root=path, name=name_map[name_lower])
        data = dataset[0]

    # WikipediaNetwork
    elif name_lower in ["squirrel", "chameleon"]:
        # Capitalize first letter
        dataset = WikipediaNetwork(root=path, name=name_lower.capitalize())
        data = dataset[0]
        
    # Actor 
    elif name_lower == "actor":
        dataset = Actor(root=os.path.join(script_dir, "temp_data", "Actor")) # Actor usually doesn't take 'name' argument
        data = dataset[0]

    # Heterophilous
    elif name_lower in ["roman-empire", "amazon-ratings", "minesweeper", "tolokers", "questions"]:
        # PyG expects specific names
        # "Roman-empire", "Amazon-ratings", "Minesweeper", "Tolokers", "Questions"
        # We need to match the casing exactly or pass it correct
        name_map = {
            "roman-empire": "Roman-empire",
            "amazon-ratings": "Amazon-ratings",
            "minesweeper": "Minesweeper",
            "tolokers": "Tolokers",
            "questions": "Questions"
        }
        dataset = HeterophilousGraphDataset(root=path, name=name_map[name_lower])
        data = dataset[0]

    if data is None:
        raise NotImplementedError(f"Dataset {name} not implemented yet.")
    
    # Preprocessing Pipeline
    # 1. Drop small classes (Robustness) - Disabled for graph visualization to keep all nodes & classes
    # data = drop_missing_classes(data, min_samples=10)
    
    # 2. Normalize
    if normalize:
        data = normalize_features(data)
        
    return data




def setup_logging(level=logging.INFO, log_file=None):
    """Configures project-wide logging."""
    handlers = [logging.StreamHandler()]
    if log_file:
        handlers.append(logging.FileHandler(log_file))

    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%H:%M:%S',
        handlers=handlers,
        force=True # Ensures it overrides any previous config
    )


def set_seed(seed):
    """Sets the seed for reproducibility across all libraries."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    # Ensure deterministic behavior in PyTorch
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

def get_device():
    """
    Returns the appropriate device (CUDA or CPU).
    Checks if CUDA is actually usable (compatible capability) before returning it.
    """
    if torch.cuda.is_available():
        try:
            # Test run to catch architecture mismatch (sm_61 vs sm_70+)
            # We perform a tiny sensitive operation
            t = torch.tensor([1.0, 2.0]).cuda()
            _ = t * 2
            return torch.device('cuda')
        except Exception as e:
            logging.warning(f"CUDA is available but dysfunctional (likely architecture mismatch): {e}")
            logging.warning("Falling back to CPU.")
            return torch.device('cpu')
            
    return torch.device('cpu')

def compute_metrics(out, y, mask):
    """
    Computes accuracy and F1 score on the masked nodes.

    Args:
        out: Logits from the model (N, NumClasses).
        y: Ground truth labels (N,).
        mask: Boolean mask indicating which nodes to evaluate.
    """
    pred = out.argmax(dim=1)

    # Filter by mask
    y_true = y[mask].cpu().numpy()
    y_pred = pred[mask].cpu().numpy()

    # Basic Accuracy
    acc = (y_pred == y_true).sum() / len(y_true)

    from sklearn.metrics import f1_score, balanced_accuracy_score, roc_auc_score, precision_score, recall_score
    
    # 1. Balanced Accuracy
    bal_acc = balanced_accuracy_score(y_true, y_pred)
    
    # 2. F1 Scores
    f1_macro = f1_score(y_true, y_pred, average='macro')
    f1_micro = f1_score(y_true, y_pred, average='micro')
    
    # 3. Precision & Recall
    precision_macro = precision_score(y_true, y_pred, average='macro', zero_division=0)
    recall_macro = recall_score(y_true, y_pred, average='macro', zero_division=0)
    precision_micro = precision_score(y_true, y_pred, average='micro', zero_division=0)
    recall_micro = recall_score(y_true, y_pred, average='micro', zero_division=0)

    # 4. ROC-AUC (Requires probabilities)
    # We select the rows corresponding to the mask
    probs = out[mask].softmax(dim=1).cpu().numpy()
    
    try:
        # Multi-class OvR
        if probs.shape[1] > 2:
            roc_auc_ovr = roc_auc_score(y_true, probs, multi_class='ovr', average='macro')
            roc_auc_ovo = roc_auc_score(y_true, probs, multi_class='ovo', average='macro')
        else:
            # Binary case (needs 1D array for positive class usually, but sklearn handles 2-column probas too)
            # Safe way: pass proba of positive class
            roc_auc_ovr = roc_auc_score(y_true, probs[:, 1])
            roc_auc_ovo = roc_auc_ovr # Equivalent in binary
            
    except Exception as e:
        # Fallback for edge cases (e.g. only 1 class in test set)
        logging.debug(f"ROC-AUC calculation skipped: {e}")
        roc_auc_ovr = np.nan
        roc_auc_ovo = np.nan

    return {
        "accuracy": acc,
        "balanced_accuracy": bal_acc,
        "f1_macro": f1_macro,
        "f1_micro": f1_micro,
        "precision_macro": precision_macro,
        "recall_macro": recall_macro, 
        "precision_micro": precision_micro,
        "recall_micro": recall_micro,
        "roc_auc_ovr": roc_auc_ovr,
        "roc_auc_ovo": roc_auc_ovo
    }

def check_homophily(edge_index, y, method='edge'):
    """
    Wrapper for PyG homophily metric.
    Tracks 'node' or 'edge' homophily.
    """
    return homophily(edge_index, y, method=method)

# -------------------



def get_sbm_graphs(homophily_steps=11, save_dir="data/generated", filter_list=None):
    """
    Generates SBM graphs with varying homophily levels.
    """
    graphs = []
    homophily_levels = np.linspace(0.0, 1.0, homophily_steps)
    
    os.makedirs(save_dir, exist_ok=True)
    
    for h in tqdm(homophily_levels, desc="Generating SBM graphs"):
        name = f"SBM_h{h:.2f}"
        
        # Optimization: Only generate if requested
        if filter_list is not None:
             if not any(req in name or req == "SBMall" for req in filter_list):
                  continue

        logging.info(f"Generating SBM with homophily={h:.2f}")
        # Parameters matching run_SLURM_generated.sh and main.py defaults
        data = generate_sbm(num_nodes=300, num_classes=4, num_features=10, homophily_coef=h, seed=42)
        
        # Save for re-use
        save_path = os.path.join(save_dir, f"sbm_h{h:.2f}.pt")
        torch.save(data, save_path)
        
        graphs.append((name, data))
        
    return graphs

def get_benchmark_graphs(filter_list=None):
    """
    Loads selected benchmark graphs.
    """
    dataset_names = [
        "Cora", "CiteSeer", "PubMed", 
        "Cornell", "Texas", "Wisconsin", 
        "Squirrel", "Chameleon", "Actor",
        "Roman-empire", "Amazon-ratings", "Minesweeper", "Tolokers", "Questions"
    ] 
    graphs = []
    
    for name in tqdm(dataset_names, desc="Loading benchmark graphs"):
        if filter_list is not None and name not in filter_list:
            continue
            
        logging.info(f"Loading Benchmark: {name}")
        try:
            data = get_dataset(name)
            graphs.append((name, data))
        except Exception as e:
            logging.error(f"Failed to load {name}: {e}")
            
    return graphs

def get_pos(G, method="sfdp"):
    """
    Computes graph layout positions.
    """
    try:
        if method == "sfdp":
            try:
                # PyGraphviz SFDP (Scalable Force Directed Placement) - Great for large graphs
                return nx.nx_agraph.graphviz_layout(G, prog="sfdp")
            except ImportError:
                logging.warning("PyGraphviz not found/working. Falling back to Spring.")
                return nx.spring_layout(G, seed=42, k=0.15, iterations=100)
        elif method == "spring":
             return nx.spring_layout(G, seed=42, k=0.15, iterations=50)
        else:
            return nx.spring_layout(G, seed=42)
    except Exception as e:
        logging.warning(f"Layout computation failed: {e}. Fallback to random.")
        return nx.random_layout(G)

def get_layout_specific(G, method="spring"):
    """
    Wrapper for specific layout methods.
    """
    try:
        if method == "sfdp":
            return nx.nx_agraph.graphviz_layout(G, prog="sfdp")
        elif method == "kamada_kawai":
            return nx.kamada_kawai_layout(G)
        elif method == "spectral":
            return nx.spectral_layout(G)
        elif method == "circular":
            return nx.circular_layout(G)
        else: # spring/default
             return nx.spring_layout(G, seed=42, k=0.15, iterations=50)
    except:
        return nx.spring_layout(G, seed=42)

def plot_custom(data, base_name, save_dir, layout_name, style, size_method, edge_mode, show_numbers=True):
    """
    Flexible plotter for gallery mode.
    """
    try:
        G = to_networkx(data, to_undirected=True)
        pos = get_layout_specific(G, layout_name)
        
        # Node Sizes
        if size_method == "degree":
            d = dict(G.degree)
            degrees = np.array([d[n] for n in G.nodes])
            node_sizes = np.clip(degrees * 1.5 + 10, 10, 200)
        elif size_method == "constant":
            node_sizes = 50
        elif size_method == "page_rank":
            try:
                pr = nx.pagerank(G, alpha=0.85)
                pr_values = np.array([list(pr.values())])
                pr_values = pr_values / pr_values.max()
                node_sizes = 10 + pr_values * 190
            except:
                node_sizes = 50
        
        # Colors
        cmap = plt.get_cmap("tab10")
        node_colors = [cmap(int(data.y[n].item()) % 10) for n in G.nodes]
        
        # Style Params
        bg_color = 'white'
        edge_color = '#B0B0B0'
        edge_width = 1.0
        edge_alpha = 0.5
        font_color = 'black'
        title_color = 'black'
        
        if style == "darktheme":
            plt.style.use('dark_background')
            bg_color = '#121212'
            edge_color = '#888888'
            font_color = 'white'
            title_color = 'white'
        elif style == "publication":
            plt.style.use('default')
            bg_color = 'white'
            edge_color = '#666666'
        elif style == "high_contrast":
            plt.style.use('default')
            bg_color = 'white'
            edge_color = 'black'
            edge_alpha = 1.0
            
        fig, ax = plt.subplots(figsize=(12, 12))
        fig.patch.set_facecolor(bg_color)
        ax.set_facecolor(bg_color)
        
        # Edge Mods
        if edge_mode == "thick":
            edge_width *= 2.5
            edge_alpha = min(1.0, edge_alpha * 1.5)
        
        # Plot
        nx.draw_networkx_edges(G, pos, edge_color=edge_color, alpha=edge_alpha, width=edge_width, ax=ax)
        
        if style == "darktheme":
             # Glow
             nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, alpha=0.9, ax=ax, linewidths=0)
             nx.draw_networkx_nodes(G, pos, node_size=node_sizes*2.5, node_color=node_colors, alpha=0.15, ax=ax, linewidths=0)
        elif style == "high_contrast":
             # Solid, black borders
             nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, alpha=1.0, ax=ax, edgecolors='black', linewidths=1.5)
        else:
             # Publication
             nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, alpha=0.85, ax=ax, edgecolors='white', linewidths=0.5)
             
        if show_numbers:
            # Reconstruct labels
            labels = {}
            if hasattr(data, 'orig_ids'):
                  for i, n in enumerate(G.nodes):
                       labels[n] = str(data.orig_ids[n].item())
            else:
                  for n in G.nodes:
                       labels[n] = str(n)
            nx.draw_networkx_labels(G, pos, labels, font_size=8, font_color=font_color, ax=ax)

        # Explicit Title
        title_str = f"{base_name}\nLayout: {layout_name} | Style: {style}\nSize: {size_method} | Edge: {edge_mode}"
        plt.title(title_str, color=title_color, fontsize=14)
        plt.axis('off')
        
        # Filename
        fname = f"gallery_{base_name}_{layout_name}_{style}_{size_method}_{edge_mode}.png"
        plt.savefig(os.path.join(save_dir, fname), dpi=300, bbox_inches='tight', facecolor=bg_color)
        plt.close()
        plt.style.use('default') # reset
        
    except Exception as e:
        logging.error(f"Gallery plot failed: {e}")
        plt.close()

def generate_gallery(data, name, save_dir):
    """
    Combinatorial generation of plots.
    """
    logging.info(f"Generating Gallery for {name}...")
    
    layouts = ["sfdp", "spring", "kamada_kawai", "circular"] # spectral sometimes fails on disconnected
    styles = ["darktheme", "publication", "high_contrast"]
    sizes = ["degree", "constant"]
    edges = ["normal", "thick"]
    
    # To save time/space, let's not do full Cartesian product if it's huge, 
    # but user asked for "lot of different visualizations".
    # 4 * 3 * 2 * 2 = 48 plots per graph. Accepted.
    
    gallery_dir = os.path.join(save_dir, "gallery")
    os.makedirs(gallery_dir, exist_ok=True)
    
    for l in layouts:
        for s in styles:
            for sz in sizes:
                for e in edges:
                    plot_custom(data, name, gallery_dir, l, s, sz, e, show_numbers=True)

def plot_structure_styled(data, name, save_dir, force_render=False, styles=["publication"], show_numbers=False, node_size_method="degree", layout="kamada_kawai"):
    """
    Plots the graph structure with specific aesthetic styles.
    """
    try:
        if data.num_nodes > 10000 and not force_render:
            logging.warning(f"Skipping structure plot for {name} (N={data.num_nodes})...")
            return

        logging.info(f"Computing layout for {name} (N={data.num_nodes})...")
        G = to_networkx(data, to_undirected=True)
        
        # 1. Compute Layout (Shared)
        pos = get_layout_specific(G, method=layout)
        
        # 2. Compute Node Sizes
        if node_size_method == "degree":
            d = dict(G.degree)
            degrees = np.array([d[n] for n in G.nodes])
            # Much more aggressive scaling for visibility on 12x12 figures
            node_sizes = degrees * 12 + 80 
        elif node_size_method == "constant":
            node_sizes = 150
        elif node_size_method == "page_rank":
            try:
                pr = nx.pagerank(G, alpha=0.85)
                pr_values = np.array([pr[n] for n in G.nodes])
                # Normalize and scale
                pr_values = pr_values / pr_values.max()
                node_sizes = 10 + pr_values * 190 # min 10 max 200
            except:
                logging.warning("PageRank failed, falling back to constant size.")
                node_sizes = 50
        else:
            logging.warning(f"Unknown node size method '{node_size_method}', using constant.")
            node_sizes = 50

        # 3. Colors
        cmap = plt.get_cmap("tab10")
        # Ensure node colors follow G.nodes() order and are indexed correctly
        node_colors = [cmap(int(data.y[n].item()) % 10) for n in G.nodes]

        # 4. Labels (if requested)
        labels = {}
        if show_numbers:
             # Check if we have original IDs preserved
             if hasattr(data, 'orig_ids'):
                  for i, n in enumerate(G.nodes):
                       # n is the index in current graph 0..N-1
                       # data.orig_ids[n] is the original ID
                       labels[n] = str(data.orig_ids[n].item())
             else:
                  for n in G.nodes:
                       labels[n] = str(n)
        
        for style in styles:
            logging.info(f"Rendering {style} style for {name}...")
            
            if style == "darktheme":
                # Dark Mode
                plt.style.use('dark_background')
                fig, ax = plt.subplots(figsize=(12, 12))
                fig.patch.set_facecolor('#121212')
                ax.set_facecolor('#121212')
                
                # Edges: Much brighter grey for visibility on dark background
                # Reduced width for dense components
                e_width = 0.8 if data.num_nodes > 50 else 1.5
                nx.draw_networkx_edges(G, pos, edge_color='#888888', alpha=0.25, width=e_width, ax=ax)
                
                # Nodes: Glow effect (layered scatter)
                # Base node
                nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, alpha=0.9, ax=ax, linewidths=0)
                # Glow halo
                nx.draw_networkx_nodes(G, pos, node_size=node_sizes*2.5, node_color=node_colors, alpha=0.15, ax=ax, linewidths=0)
                
                if show_numbers:
                     nx.draw_networkx_labels(G, pos, labels, font_size=8, font_color='white', ax=ax)

                save_suffix = "_darktheme"
                
            elif style == "publication":
                # Publication / Clean
                plt.style.use('default')
                fig, ax = plt.subplots(figsize=(12, 12))
                
                # Edges: Darker grey for visibility on white
                e_width = 0.8 if data.num_nodes > 50 else 1.5
                nx.draw_networkx_edges(G, pos, edge_color='#666666', alpha=0.25, width=e_width, ax=ax)
                
                # Nodes: With border
                nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, 
                                     alpha=0.85, ax=ax, edgecolors='white', linewidths=0.5)
                
                if show_numbers:
                     nx.draw_networkx_labels(G, pos, labels, font_size=8, font_color='black', ax=ax)

                save_suffix = "_publication"
            
            if show_numbers:
                 save_suffix += "_w_number"

            # Add size suffix
            if node_size_method != "degree": # Only add if not default or always? User said "When user this parameter". 
                 # Let's add it if it's explicitly passed or maybe always to be clear? 
                 # "the saved figure gets a name reflecting the parameter"
                 save_suffix += f"_size_{node_size_method}"
            else:
                 # If default is degree, maybe we still add it if user explicitly asked?
                 # Implied: if user used the param. But main() will pass it always.
                 # Let's add it always for clarity or check if it matches default?
                 # Let's add it to be explicit as requested.
                 save_suffix += "_size_degree"

            # Title Formatting
            # Remove style from title
            # Expand _lcc
            display_name = name.replace("_lcc", " - LCC")
            display_name = display_name.replace("_full", "")
            
            plt.title(display_name, color='white' if style=='darktheme' else 'black', fontsize=16)
            plt.axis('off')
            
            save_path = os.path.join(save_dir, f"structure_{name}{save_suffix}.png")
            plt.savefig(save_path, dpi=300, bbox_inches='tight', facecolor=fig.get_facecolor())
            plt.close()
            
            # Reset style
            plt.style.use('default')
        
    except Exception as e:
        logging.error(f"Failed to plot structure for {name}: {e}")
        plt.close()

def plot_features(data, name, save_dir, show_numbers=False, methods=["tsne", "pca"]):
    """
    Plots PCA and t-SNE of node features.
    Computes and displays Silhouette Score to assess cluster separation.
    """
    try:
        from sklearn.metrics import silhouette_score
        logging.info(f"Plotting features for {name}...")
        
        if not hasattr(data, 'x') or data.x is None:
             logging.warning(f"No features found for {name}. Skipping feature plots.")
             return

        x = data.x.numpy()
        y = data.y.numpy()
        
        # Prepare labels
        labels = None
        suffix = "_w_number" if show_numbers else ""
        if show_numbers:
             if hasattr(data, 'orig_ids'):
                  labels = data.orig_ids.numpy()
             else:
                  labels = np.arange(data.num_nodes)

        # Common Plotting Helper
        def _plot_scatter(embedding, method_name, ax=None):
            if ax is None:
                fig, ax = plt.subplots(figsize=(10, 8))
            
            # Scatter with discrete colors
            scatter = ax.scatter(embedding[:, 0], embedding[:, 1], c=y, cmap="tab10", alpha=0.7, s=40, edgecolors='w', linewidth=0.5)
            
            # Legend
            legend1 = ax.legend(*scatter.legend_elements(), title="Classes", loc="lower left", bbox_to_anchor=(1.01, 0))
            ax.add_artist(legend1)
            
            if show_numbers and labels is not None:
                 for i, txt in enumerate(labels):
                      ax.text(embedding[i, 0], embedding[i, 1], str(txt), fontsize=6, alpha=0.8)
            
            # Silhouette Score
            try:
                if len(np.unique(y)) > 1:
                     # Calculate silhouette score on the EMBEDDING or ORIGINAL FEATURES?
                     # Usually original features tell about intrinsic separability, 
                     # but visual separation is about embedding.
                     # Let's compute on Original Features for "Ground Truth Separability"
                     # and on Embedding for "Visual Separability".
                     # Given high dim of original, let's use Original for the metric displayed
                     # as "Feature Cluster Quality".
                     sil_orig = silhouette_score(x, y)
                     sil_emb = silhouette_score(embedding, y)
                     score_str = f"Silhouette (Feat): {sil_orig:.2f} | (Emb): {sil_emb:.2f}"
                else:
                     score_str = "Silhouette: N/A (1 Class)"
            except:
                score_str = "Silhouette: Error"

            ax.set_title(f"{method_name.upper()} Features: {name}\n{score_str}", fontsize=14)
            ax.axis('off')
            return score_str

        if "pca" in methods:
            # PCA
            pca = PCA(n_components=2)
            x_pca = pca.fit_transform(x)
            
            plt.figure(figsize=(10, 8))
            _plot_scatter(x_pca, "PCA", plt.gca())
            plt.tight_layout()
            plt.savefig(os.path.join(save_dir, f"features_pca_{name}{suffix}.png"), dpi=300, bbox_inches='tight')
            plt.close()
        
        if "tsne" in methods:
            # t-SNE
            perp = min(30, max(5, data.num_nodes // 10))
            tsne = TSNE(n_components=2, perplexity=perp, random_state=42)
            x_tsne = tsne.fit_transform(x)
            
            plt.figure(figsize=(10, 8))
            _plot_scatter(x_tsne, "t-SNE", plt.gca())
            plt.tight_layout()
            plt.savefig(os.path.join(save_dir, f"features_tsne_{name}{suffix}.png"), dpi=300, bbox_inches='tight')
            plt.close()

    except Exception as e:
        logging.error(f"Failed to plot features for {name}: {e}")
        plt.close()

def plot_topology_embedding(data, name, save_dir):
    """
    Plots the Spectral Embedding of the graph structure.
    """
    try:
        logging.info(f"Plotting topology embedding for {name}...")
        
        G = to_networkx(data, to_undirected=True)
        adj = nx.to_scipy_sparse_array(G)
        
        # Sklearn requires int32 indices for sparse matrices
        adj.indices = adj.indices.astype(np.int32)
        adj.indptr = adj.indptr.astype(np.int32)
        
        emb = SpectralEmbedding(n_components=2, affinity='precomputed', random_state=42)
        x_emb = emb.fit_transform(adj)
        
        y = data.y.numpy()
        
        plt.figure(figsize=(8, 8))
        plt.scatter(x_emb[:, 0], x_emb[:, 1], c=y, cmap="tab10", alpha=0.7, s=30)
        plt.title(f"Topology Embedding (Spectral): {name}")
        plt.axis('off')
        plt.savefig(os.path.join(save_dir, f"topology_embedding_{name}.png"), dpi=300, bbox_inches='tight')
        plt.close()
        
    except Exception as e:
        logging.error(f"Failed to plot topology embedding for {name}: {e}")
        plt.close()

def extract_lcc(data):
    """
    Extracts the Largest Connected Component from PyG Data.
    """
    G = to_networkx(data, to_undirected=True)
    largest_cc = max(nx.connected_components(G), key=len)
    
    # Create subset as long tensor
    subset = torch.tensor(list(largest_cc), dtype=torch.long)
    
    # Relabel edges using torch_geometric.utils.subgraph
    new_edge_index, _ = subgraph(subset, data.edge_index, relabel_nodes=True, num_nodes=data.num_nodes)
    
    # Create new Data object and slice attributes
    sub_data = Data()
    # Explicitly iterate over stored attributes
    for key, item in data.items():
        if key == 'edge_index':
            continue
        if key == 'num_nodes':
            continue
            
        if torch.is_tensor(item) and item.size(0) == data.num_nodes:
            sub_data[key] = item[subset]
        else:
            sub_data[key] = item
            
    sub_data.edge_index = new_edge_index
    sub_data.num_nodes = len(subset)
    
    return sub_data

def export_to_chartjs(data, name, save_dir, force_rendering=False):
    """
    Exports the graph to an interactive HTML using D3.js force-directed graph.
    """
    try:
        G = to_networkx(data, to_undirected=True)
        
        # Limit nodes for web performance unless forced
        actual_name = name
        if G.number_of_nodes() > 2500 and not force_rendering:
             logging.warning(f"Graph too large for web view ({G.number_of_nodes()}). Subsampling to 2500 nodes.")
             actual_name = f"{name}_sample_2500"
             nodes = list(G.nodes())[:2500]
             G = G.subgraph(nodes)
        
        logging.info(f"Exporting D3.js HTML for {actual_name}...")

        nodes_data = []
        edges_data = []
        
        # Colors - tab10 palette
        tab10_colors = [
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
            "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
        ]
        
        # Get degrees for sizing
        degrees = dict(G.degree())
        
        # Features handling
        has_features = hasattr(data, 'x') and data.x is not None
        feature_mode = "none"
        feature_names = []
        
        if has_features:
            num_features = data.x.shape[1]
            feature_names = [f"Feature {i}" for i in range(num_features)]
            
            # Feature Export Strategy
            if num_features <= 50:
                feature_mode = "full"
            else:
                # Check sparsity
                zero_count = (data.x == 0).sum().item()
                total_count = data.x.numel()
                sparsity = zero_count / total_count
                
                if sparsity > 0.9:
                    feature_mode = "sparse"
                else:
                    feature_mode = "pca"
                    logging.info(f"Features too large ({num_features}) and dense. Using PCA for visualization.")
        
        # Precompute PCA if needed
        if feature_mode == "pca":
            try:
                from sklearn.decomposition import PCA
                pca = PCA(n_components=min(10, data.x.shape[1]))
                x_pca = pca.fit_transform(data.x.numpy())
                feature_names = [f"PCA_{i}" for i in range(x_pca.shape[1])]
            except:
                feature_mode = "none"

        # Position init (optional, reusing layout if available logic could go here)
        # For now we rely on D3 force, but we could pass init positions.
        
        for n in G.nodes():
            lbl = int(data.y[n].item()) if hasattr(data, 'y') and data.y is not None and n < len(data.y) else 0
            hex_color = tab10_colors[lbl % 10]
            deg = degrees.get(n, 0)
            
            node_obj = {
                "id": str(n),
                "label": f"Node {n}",
                "color": hex_color,
                "group": lbl,
                "degree": deg,
                "features": {} # filled below
            }
            
            # Label override
            if hasattr(data, 'orig_ids') and n < len(data.orig_ids):
                 node_obj["label"] = f"Node {data.orig_ids[n].item()} (Class {lbl})"
            else:
                 node_obj["label"] = f"Node {n} (Class {lbl})"

            # Features - Handle sparse vs full
            if has_features and n < data.x.shape[0]:
                if feature_mode == "full":
                    feat_vals = data.x[n].numpy()
                    node_obj["features"] = {f"Feat {i}": float(v) for i, v in enumerate(feat_vals)}

                elif feature_mode == "sparse":
                    # Only write non-zero features
                    feat_vals = data.x[n].numpy()
                    # Use a threshold for float comparison or just check != 0
                    node_obj["features"] = {f"Feat {i}": float(v) for i, v in enumerate(feat_vals) if abs(v) > 1e-9}
                elif feature_mode == "pca":
                    feat_vals = x_pca[n]
                    node_obj["features"] = {f"PCA {i}": float(v) for i, v in enumerate(feat_vals)}

            nodes_data.append(node_obj)
            
        # Separate self-loops from regular edges
        self_loops = []
        for u, v in G.edges():
            if u == v:
                self_loops.append(str(u))
            else:
                edges_data.append({
                    "source": str(u),
                    "target": str(v)
                })
        
        # Advanced Stats
        num_features = data.x.shape[1] if has_features else 0
        
        # Build structured class labels list for the legend
        # tab10 color palette matches node colors
        tab10_colors = [
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
            "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
        ]
        unique_labels_info = []
        if hasattr(data, 'y') and data.y is not None:
            import torch
            unique_lbls = torch.unique(data.y).tolist()
            meta_info = METADATA.get(actual_name, {}) if not is_sbm else {}
            class_labels_str = meta_info.get("Class Labels", "") if not is_sbm else ""
            is_confirmed = class_labels_str.startswith('{')  # dict = confirmed
            for lbl in sorted(unique_lbls):
                lbl_int = int(lbl)
                hex_color = tab10_colors[lbl_int % 10]
                if is_confirmed:
                    # Try to parse the label name from the dict string
                    # format: {0: "Name", 1: "Other", ...}
                    import re as _re
                    m = _re.search(rf'{lbl_int}:\s*"([^"]+)"', class_labels_str)
                    label_name = m.group(1) if m else f"Class {lbl_int}"
                else:
                    label_name = f"Class {lbl_int}"
                unique_labels_info.append({"class": lbl_int, "name": label_name, "color": hex_color, "confirmed": is_confirmed})
        
        graph_info = {
            "num_nodes": G.number_of_nodes(),
            "num_edges": G.number_of_edges(),
            "num_features": num_features,
            "avg_degree": f"{2 * G.number_of_edges() / G.number_of_nodes():.2f}" if G.number_of_nodes() > 0 else "0",
            "density": f"{nx.density(G):.4f}",
            "classLabels": unique_labels_info,
        }
        
        # Clustering coefficient
        try:
            clustering = nx.average_clustering(G)
            graph_info["clustering"] = f"{clustering:.4f}"
        except:
            graph_info["clustering"] = "N/A"
        
        # Adjusted homophily (edge homophily)
        try:
            if hasattr(data, 'y') and data.y is not None:
                same_label_edges = 0
                total_edges = 0
                for u, v in G.edges():
                    if u != v and u < len(data.y) and v < len(data.y):
                        total_edges += 1
                        if data.y[u].item() == data.y[v].item():
                            same_label_edges += 1
                if total_edges > 0:
                    graph_info["adj_homophily"] = f"{same_label_edges / total_edges:.4f}"
                else:
                    graph_info["adj_homophily"] = "N/A"
            else:
                graph_info["adj_homophily"] = "N/A"
        except:
            graph_info["adj_homophily"] = "N/A"
        
        # Inertia (feature-based: average within-class feature compactness)
        try:
            if hasattr(data, 'x') and hasattr(data, 'y') and data.x is not None and data.y is not None:
                from sklearn.metrics import davies_bouldin_score
                # Use all nodes in G (which might be subsampled)
                node_list = list(G.nodes())
                features = data.x[node_list].numpy()
                labels = data.y[node_list].numpy()
                
                # Davies-Bouldin Index (lower is better clustering)
                if len(np.unique(labels)) > 1:
                    db_score = davies_bouldin_score(features, labels)
                    graph_info["inertia"] = f"{db_score:.4f}"
                else:
                    graph_info["inertia"] = "N/A"
            else:
                graph_info["inertia"] = "N/A"
        except:
            graph_info["inertia"] = "N/A"

        # --- OUTPUT FILES ---
        # 1. JSON data file
        graph_data = {
            "nodes": nodes_data,
            "links": edges_data,
            "selfLoops": self_loops,
            "graphInfo": graph_info,
            "featureMode": feature_mode,
            "numFeatures": data.x.shape[1] if has_features else 0
        }
        
        json_path = os.path.join(save_dir, f"{actual_name}.json")
        with open(json_path, "w") as f:
            json.dump(graph_data, f)
        
        # 2. Calculate relative path to shared folder
        # save_dir is like plots/visualizations/Cora, shared is at plots/visualizations/shared
        shared_rel_path = "../shared"
        
        # 3. Lightweight HTML file that loads shared assets
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Interactive Graph: {actual_name}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="{shared_rel_path}/graph_viewer.css">
</head>
<body>
    <div id="top-bar">
        <h2 id="graph-name">{actual_name}</h2>
        <div style="display: flex; gap: 10px;">
            <button class="toggle-btn active" id="toggleControls" title="Toggle Controls">⚙️ Params</button>
            <button class="toggle-btn active" id="toggleInfo" title="Toggle Graph Info">ℹ️ Info</button>
            <button class="toggle-btn" id="toggleFeatures" title="Toggle Features Panel">📊 Features</button>
            <div style="width: 1px; background: #ccc; margin: 0 5px;"></div>
            <button class="btn btn-secondary" id="resetBtn">Reset View</button>
            <button class="btn btn-dark" id="darkBtn">Dark Mode</button>
            <button class="btn btn-primary" id="savePng">Save PNG</button>
            <button class="btn btn-primary" id="saveSvg">Save SVG</button>
        </div>
    </div>

    <div id="main-area">
        <div id="controls">
            <h4 style="margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Rendering Params</h4>
            <div class="control-group">
                <label title="Controls the repulsion force between nodes.">Repulsion (Charge)</label>
                <div class="control-row">
                    <input type="range" id="charge" min="-3000" max="-10" value="-300">
                    <input type="number" id="charge-val" class="val-input" value="-300">
                </div>
            </div>
            <div class="control-group">
                <label title="Preferred distance between connected nodes.">Link Distance</label>
                <div class="control-row">
                    <input type="range" id="linkDist" min="10" max="300" value="50">
                    <input type="number" id="linkDist-val" class="val-input" value="50">
                </div>
            </div>
            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 10px 0;">
            <div class="control-group">
                <label title="Base size for all nodes.">Node Size</label>
                <div class="control-row">
                    <input type="range" id="nodeSize" min="1" max="50" value="6">
                    <input type="number" id="nodeSize-val" class="val-input" value="6">
                </div>
            </div>
            <div class="control-group" style="flex-direction: row; align-items: center;">
                <input type="checkbox" id="degreeSize" style="margin-right: 5px;">
                <label for="degreeSize" style="margin: 0; font-size: 11px;">Size proportional to Degree</label>
            </div>
            <div class="control-group" style="flex-direction: row; align-items: center;">
                <input type="checkbox" id="showLabels" style="margin-right: 5px;">
                <label for="showLabels" style="margin: 0; font-size: 11px;">Show Node Numbers</label>
            </div>
            <div class="control-group">
                <label title="Thickness of edges.">Edge Width</label>
                <div class="control-row">
                    <input type="range" id="linkWidth" min="0.0" max="10" step="0.1" value="1">
                    <input type="number" id="linkWidth-val" class="val-input" value="1" step="0.1">
                </div>
            </div>
            <div class="control-group">
                <label title="Manual zoom control.">Zoom Strength</label>
                <div class="control-row">
                    <input type="range" id="zoomSlider" min="0.1" max="10" step="0.1" value="1">
                    <input type="number" id="zoom-val" class="val-input" value="1" step="0.1">
                </div>
            </div>
        </div>

        <div id="graph-container">
            <div id="info-overlay"><b>Loading...</b></div>
        </div>
        
        <div id="side-panel" class="hidden">
            <div class="panel-header">
                <h3>Feature Inspector</h3>
                <span class="close-btn" onclick="toggleFeatures()">×</span>
            </div>
            <div class="panel-content">
                <div id="panel-placeholder" style="color: #888; text-align: center; margin-top: 20px;">
                    Click a node to view details.<br><br>
                    Running Feature Mode: <b id="feature-mode">{feature_mode.upper()}</b>
                </div>
                <div id="node-details" style="display: none;">
                    <h4 id="node-title">Node X</h4>
                    <p><b>Group/Class:</b> <span id="node-group">-</span></p>
                    <p><b>Degree:</b> <span id="node-degree">-</span></p>
                    <h5 style="margin-bottom: 5px;">Feature Distribution</h5>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px; font-size: 11px;">
                        <label for="histogramBins">Bins:</label>
                        <input type="range" id="histogramBins" min="3" max="30" value="10" style="width: 80px;">
                        <span id="histogramBins-val">10</span>
                    </div>
                    <div style="height: 150px; width: 100%;"><canvas id="featureChart"></canvas></div>
                    <h5 style="margin-bottom: 5px; margin-top: 15px;">Feature Values</h5>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color);">
                        <table id="feature-table"><thead><tr><th>Feature</th><th>Value</th></tr></thead><tbody></tbody></table>
                    </div>
                    <p id="sparse-note" style="display: none; font-size: 10px; color: #888; margin-top: 5px; font-style: italic;">Sparse representation: zero values are not displayed.</p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="tooltip" id="tooltip" style="display: none;"></div>
    
    <script src="{shared_rel_path}/graph_viewer.js"></script>
    <script>
        // Embed data directly to avoid CORS issues with file:// protocol
        const GRAPH_DATA = {json.dumps(graph_data)};
        const GRAPH_NAME = "{actual_name}";
        
        initGraphViewer({{ data: GRAPH_DATA, name: GRAPH_NAME }});
    </script>
</body>
</html>
"""
        
        save_path = os.path.join(save_dir, f"{actual_name}_interactive.html")
        with open(save_path, "w") as f:
            f.write(html_content)
            
    except Exception as e:
        logging.error(f"Failed to export D3.js for {name}: {e}")


def export_sbm_merged_viewer(sbm_graphs, save_dir):
    """
    Exports a single merged SBM viewer with a homophily slider.
    sbm_graphs: List of (name, data) tuples for SBM graphs
    """
    try:
        logging.info("Exporting merged SBM viewer...")
        
        # Collect homophily levels and build embedded data
        homophily_levels = []
        all_sbm_data = {}  # Will be embedded in HTML
        
        # Colors - tab10 palette
        tab10_colors = [
            "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
            "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
        ]
        
        for name, data in sbm_graphs:
            # Extract homophily from name (e.g., "SBM_h0.50")
            h_str = name.split("_h")[1]
            h = float(h_str)
            homophily_levels.append(h)
            
            # Build graph data for this homophily level
            G = to_networkx(data, to_undirected=True)
            degrees = dict(G.degree())
            
            nodes_data = []
            edges_data = []
            self_loops = []
            
            for n in G.nodes():
                lbl = int(data.y[n].item()) if hasattr(data, 'y') and data.y is not None and n < len(data.y) else 0
                deg = degrees.get(n, 0)
                node_obj = {
                    "id": str(n),
                    "label": f"Node {n} (Class {lbl})",
                    "color": tab10_colors[lbl % 10],
                    "group": lbl,
                    "degree": deg,
                    "features": {}
                }
                # Add features
                if hasattr(data, 'x') and data.x is not None and n < data.x.shape[0]:
                    feat_vals = data.x[n].numpy()
                    node_obj["features"] = {f"Feat {i}": float(v) for i, v in enumerate(feat_vals)}
                nodes_data.append(node_obj)
            
            for u, v in G.edges():
                if u == v:
                    self_loops.append(str(u))
                else:
                    edges_data.append({"source": str(u), "target": str(v)})
            
            # Graph info
            num_features = data.x.shape[1] if hasattr(data, 'x') and data.x is not None else 0
            graph_info = {
                "num_nodes": G.number_of_nodes(),
                "num_edges": G.number_of_edges(),
                "num_features": num_features,
                "avg_degree": f"{2 * G.number_of_edges() / G.number_of_nodes():.2f}" if G.number_of_nodes() > 0 else "0",
                "density": f"{nx.density(G):.4f}",
                "adj_homophily": f"{h:.2f}",
                "classLabels": [
                    {"class": 0, "name": "Community 0", "color": tab10_colors[0], "confirmed": True},
                    {"class": 1, "name": "Community 1", "color": tab10_colors[1], "confirmed": True},
                    {"class": 2, "name": "Community 2", "color": tab10_colors[2], "confirmed": True},
                    {"class": 3, "name": "Community 3", "color": tab10_colors[3], "confirmed": True},
                ]
            }
            
            all_sbm_data[f"h{h:.2f}"] = {
                "nodes": nodes_data,
                "links": edges_data,
                "selfLoops": self_loops,
                "graphInfo": graph_info,
                "featureMode": "full"
            }
        
        if not homophily_levels:
            logging.warning("No SBM graphs to create merged viewer")
            return
            
        homophily_levels.sort()
        
        # Serialize all data for embedding
        sbm_data_json = json.dumps(all_sbm_data)
        
        # Create merged viewer HTML
        shared_rel_path = "../shared"
        default_h = homophily_levels[len(homophily_levels) // 2]  # Middle value
        
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>SBM Homophily Explorer</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="{shared_rel_path}/graph_viewer.css">
    <style>
        #sbm-slider-container {{
            padding: 15px 20px;
            background: var(--control-bg);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 15px;
        }}
        #sbm-slider-container label {{ font-weight: 600; }}
        #sbm-slider {{ width: 400px; }}
        #sbm-val {{ font-weight: bold; min-width: 50px; }}
        .level-btn {{
            padding: 4px 8px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--bg-color);
            cursor: pointer;
            font-size: 11px;
        }}
        .level-btn.active {{ background: #4CAF50; color: white; border-color: #4CAF50; }}
    </style>
</head>
<body>
    <div id="top-bar">
        <h2 id="graph-name">SBM Homophily Explorer</h2>
        <div style="display: flex; gap: 10px;">
            <button class="toggle-btn active" id="toggleControls" title="Toggle Controls">⚙️ Params</button>
            <button class="toggle-btn active" id="toggleInfo" title="Toggle Graph Info">ℹ️ Info</button>
            <button class="toggle-btn" id="toggleFeatures" title="Toggle Features Panel">📊 Features</button>
            <div style="width: 1px; background: #ccc; margin: 0 5px;"></div>
            <button class="btn btn-secondary" id="resetBtn">Reset View</button>
            <button class="btn btn-dark" id="darkBtn">Dark Mode</button>
            <button class="btn btn-primary" id="savePng">Save PNG</button>
            <button class="btn btn-primary" id="saveSvg">Save SVG</button>
        </div>
    </div>
    
    <div id="sbm-slider-container">
        <label>Homophily Level:</label>
        <input type="range" id="sbm-slider" min="0" max="1" step="0.1" value="{default_h}">
        <span id="sbm-val">{default_h:.2f}</span>
        <div style="margin-left: 20px; display: flex; gap: 5px;">
            {"".join([f'<button class="level-btn{" active" if h == default_h else ""}" data-h="{h:.2f}">{h:.2f}</button>' for h in homophily_levels])}
        </div>
    </div>

    <div id="main-area">
        <div id="controls">
            <h4 style="margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 5px;">Rendering Params</h4>
            <div class="control-group">
                <label>Repulsion (Charge)</label>
                <div class="control-row">
                    <input type="range" id="charge" min="-3000" max="-10" value="-300">
                    <input type="number" id="charge-val" class="val-input" value="-300">
                </div>
            </div>
            <div class="control-group">
                <label>Link Distance</label>
                <div class="control-row">
                    <input type="range" id="linkDist" min="10" max="300" value="50">
                    <input type="number" id="linkDist-val" class="val-input" value="50">
                </div>
            </div>
            <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 10px 0;">
            <div class="control-group">
                <label>Node Size</label>
                <div class="control-row">
                    <input type="range" id="nodeSize" min="1" max="50" value="6">
                    <input type="number" id="nodeSize-val" class="val-input" value="6">
                </div>
            </div>
            <div class="control-group" style="flex-direction: row; align-items: center;">
                <input type="checkbox" id="degreeSize" style="margin-right: 5px;">
                <label for="degreeSize" style="margin: 0; font-size: 11px;">Size proportional to Degree</label>
            </div>
            <div class="control-group">
                <label>Edge Width</label>
                <div class="control-row">
                    <input type="range" id="linkWidth" min="0.1" max="10" step="0.1" value="1">
                    <input type="number" id="linkWidth-val" class="val-input" value="1" step="0.1">
                </div>
            </div>
        </div>

        <div id="graph-container">
            <div id="info-overlay"><b>Loading...</b></div>
        </div>
        
        <div id="side-panel" class="hidden">
            <div class="panel-header">
                <h3>Feature Inspector</h3>
                <span class="close-btn" onclick="toggleFeatures()">×</span>
            </div>
            <div class="panel-content">
                <div id="panel-placeholder" style="color: #888; text-align: center; margin-top: 20px;">
                    Click a node to view details.<br><br>
                    Running Feature Mode: <b id="feature-mode">FULL</b>
                </div>
                <div id="node-details" style="display: none;">
                    <h4 id="node-title">Node X</h4>
                    <p><b>Group/Class:</b> <span id="node-group">-</span></p>
                    <p><b>Degree:</b> <span id="node-degree">-</span></p>
                    <h5 style="margin-bottom: 5px;">Feature Distribution</h5>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px; font-size: 11px;">
                        <label for="histogramBins">Bins:</label>
                        <input type="range" id="histogramBins" min="2" max="30" value="10" style="width: 80px;">
                        <span id="histogramBins-val">10</span>
                    </div>
                    <div style="height: 150px; width: 100%;"><canvas id="featureChart"></canvas></div>
                    <h5 style="margin-bottom: 5px; margin-top: 15px;">Feature Values</h5>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color);">
                        <table id="feature-table"><thead><tr><th>Feature</th><th>Value</th></tr></thead><tbody></tbody></table>
                    </div>
                    <p id="sparse-note" style="display: none; font-size: 10px; color: #888; margin-top: 5px; font-style: italic;">Sparse representation: zero values are not displayed.</p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="tooltip" id="tooltip" style="display: none;"></div>
    
    <script src="{shared_rel_path}/graph_viewer.js"></script>
    <script>
        // Embedded SBM data (avoids CORS issues with file:// protocol)
        const sbmDataMap = {sbm_data_json};
        const homophilyLevels = {json.dumps(homophily_levels)};
        let currentViewer = null;
        
        function loadGraph(h) {{
            const key = `h${{h.toFixed(2)}}`;
            if (!sbmDataMap[key]) {{
                console.error(`No data for homophily ${{h}}`);
                return;
            }}
            
            document.getElementById('graph-name').textContent = `SBM (h=${{h.toFixed(2)}})`;
            document.getElementById('sbm-val').textContent = h.toFixed(2);
            document.getElementById('sbm-slider').value = h;
            
            // Update active button
            document.querySelectorAll('.level-btn').forEach(btn => {{
                btn.classList.toggle('active', parseFloat(btn.dataset.h) === h);
            }});
            
            currentViewer = initGraphViewer({{
                data: sbmDataMap[key],
                name: `SBM_h${{h.toFixed(2)}}`,
                isSBM: true
            }});
        }}
        
        // Slider event
        document.getElementById('sbm-slider').addEventListener('input', (e) => {{
            const h = parseFloat(e.target.value);
            // Snap to nearest available level
            const nearest = homophilyLevels.reduce((prev, curr) => 
                Math.abs(curr - h) < Math.abs(prev - h) ? curr : prev);
            loadGraph(nearest);
        }});
        
        // Level button events
        document.querySelectorAll('.level-btn').forEach(btn => {{
            btn.addEventListener('click', () => {{
                loadGraph(parseFloat(btn.dataset.h));
            }});
        }});
        
        // Initialize with default homophily
        loadGraph({default_h});
    </script>
</body>
</html>
"""
        
        save_path = os.path.join(save_dir, "SBM_explorer.html")
        with open(save_path, "w") as f:
            f.write(html_content)
        
        logging.info(f"Created SBM explorer at {save_path}")
        
    except Exception as e:
        logging.error(f"Failed to create SBM merged viewer: {e}")


# --- HELPER FUNCTIONS FOR STATS & REPORT AUTOMATION ---

def subsample_graph(data, max_nodes=2500):
    """Subsamples a PyG Data object to contain only the first max_nodes nodes."""
    if data.num_nodes <= max_nodes:
        return data
        
    subset = torch.arange(max_nodes, dtype=torch.long)
    from torch_geometric.utils import subgraph
    new_edge_index, _ = subgraph(subset, data.edge_index, relabel_nodes=True, num_nodes=data.num_nodes)
    
    from torch_geometric.data import Data
    sub_data = Data()
    for key, item in data.items():
        if key == 'edge_index':
            continue
        if key == 'num_nodes':
            continue
            
        if torch.is_tensor(item) and item.size(0) == data.num_nodes:
            sub_data[key] = item[subset]
        else:
            sub_data[key] = item
            
    sub_data.edge_index = new_edge_index
    sub_data.num_nodes = max_nodes
    return sub_data


def compute_inertia_ratios(x, y):
    """Compute within-class and between-class inertia ratios."""
    x = x.double()
    global_mean = x.mean(dim=0)
    total_inertia = torch.sum((x - global_mean) ** 2).item()
    
    if total_inertia == 0:
        return 1.0, 0.0
        
    within_inertia = 0.0
    unique_classes = torch.unique(y)
    for c in unique_classes:
        mask = (y == c)
        class_x = x[mask]
        if class_x.shape[0] > 0:
            class_mean = class_x.mean(dim=0)
            within_inertia += torch.sum((class_x - class_mean) ** 2).item()
            
    inertia_within = within_inertia / total_inertia
    inertia_between = 1.0 - inertia_within
    return inertia_within, inertia_between


def compute_modularity(G, y):
    """Compute modularity of the graph structure with respect to ground-truth classes."""
    communities = []
    unique_classes = torch.unique(y)
    for c in unique_classes:
        nodes_in_class = set((y == c).nonzero(as_tuple=False).view(-1).tolist())
        if nodes_in_class:
            communities.append(nodes_in_class)
    try:
        return nx.community.modularity(G, communities)
    except Exception as e:
        return 0.0


def compute_diameter(G):
    """Compute network diameter (inf if graph is disconnected)."""
    if nx.is_connected(G):
        try:
            if G.number_of_nodes() > 3000:
                from networkx.algorithms import approximation
                return str(approximation.diameter(G))
            else:
                return str(nx.diameter(G))
        except:
            return "inf"
    else:
        return "inf"


def format_stat(val, precision=3):
    """Formats numeric values to strings, stripping unnecessary trailing zeros."""
    if isinstance(val, (int, float)):
        s = f"{val:.{precision}f}"
        if '.' in s:
            s = s.rstrip('0').rstrip('.')
            if s == "":
                s = "0"
        return s
    return str(val)


METADATA = {
    "Cora": {
        "Article": "Revisiting semi-supervised learning with graph embeddings",
        "Authors": "Yang, Z. et al. (2016)",
        "Link": "https://arxiv.org/abs/1603.08861",
        "Description": "Academic paper citation network of machine learning publications",
        "Edge Meaning": "Citation from one academic paper to another",
        # Confirmed: Planetoid uses sorted label order matching raw cora.content file
        "Class Labels": '{0: "Case Based", 1: "Genetic Algorithms", 2: "Neural Networks", 3: "Probabilistic Methods", 4: "Reinforcement Learning", 5: "Rule Learning", 6: "Theory"}',
    },
    "CiteSeer": {
        "Article": "Revisiting semi-supervised learning with graph embeddings",
        "Authors": "Yang, Z. et al. (2016)",
        "Link": "https://arxiv.org/abs/1603.08861",
        "Description": "Academic paper citation network of computer science publications",
        "Edge Meaning": "Citation from one academic paper to another",
        # Unsure: integer order depends on preprocessing; classes are known but assignment uncertain
        "Class Labels": '["Agents", "AI", "DB", "IR", "ML", "HCI"] /unsure of class mapping/',
    },
    "PubMed": {
        "Article": "Revisiting semi-supervised learning with graph embeddings",
        "Authors": "Yang, Z. et al. (2016)",
        "Link": "https://arxiv.org/abs/1603.08861",
        "Description": "Academic paper citation network of publications related to diabetes",
        "Edge Meaning": "Citation from one academic paper to another",
        # Confirmed: Planetoid PubMed uses 0=Experimental, 1=Type 1, 2=Type 2
        "Class Labels": '{0: "Diabetes Mellitus (Experimental)", 1: "Diabetes Mellitus Type 1", 2: "Diabetes Mellitus Type 2"}',
    },
    "Cornell": {
        "Article": "Learning to extract symbolic knowledge from the World Wide Web",
        "Authors": "Craven, M. et al. (1998)",
        "Link": "http://www.cs.cmu.edu/~webkb/",
        "Description": "CS department web pages from Cornell University",
        "Edge Meaning": "Hyperlink from one web page to another",
        # Unsure: WebKB class order varies across PyG versions
        "Class Labels": '["student", "project", "course", "staff", "faculty"] /unsure of class mapping/',
    },
    "Texas": {
        "Article": "Learning to extract symbolic knowledge from the World Wide Web",
        "Authors": "Craven, M. et al. (1998)",
        "Link": "http://www.cs.cmu.edu/~webkb/",
        "Description": "CS department web pages from University of Texas",
        "Edge Meaning": "Hyperlink from one web page to another",
        # Unsure: WebKB class order varies across PyG versions
        "Class Labels": '["student", "project", "course", "staff", "faculty"] /unsure of class mapping/',
    },
    "Wisconsin": {
        "Article": "Learning to extract symbolic knowledge from the World Wide Web",
        "Authors": "Craven, M. et al. (1998)",
        "Link": "http://www.cs.cmu.edu/~webkb/",
        "Description": "CS department web pages from University of Wisconsin",
        "Edge Meaning": "Hyperlink from one web page to another",
        # Unsure: WebKB class order varies across PyG versions
        "Class Labels": '["student", "project", "course", "staff", "faculty"] /unsure of class mapping/',
    },
    "Chameleon": {
        "Article": "Multi-scale attributed node embedding",
        "Authors": "Rozemberczki, B. et al. (2021)",
        "Link": "https://arxiv.org/abs/1909.13021",
        "Description": "Wikipedia pages related to Chameleons",
        "Edge Meaning": "Hyperlink from one Wikipedia article to another",
        # Unsure: bins are ordinal traffic quintiles but exact cut-points per class not documented
        "Class Labels": '["Traffic quintile 0 (lowest)", "Quintile 1", "Quintile 2", "Quintile 3", "Quintile 4 (highest)"] /unsure of class mapping/',
    },
    "Squirrel": {
        "Article": "Multi-scale attributed node embedding",
        "Authors": "Rozemberczki, B. et al. (2021)",
        "Link": "https://arxiv.org/abs/1909.13021",
        "Description": "Wikipedia pages related to Squirrels",
        "Edge Meaning": "Hyperlink from one Wikipedia article to another",
        # Unsure: bins are ordinal traffic quintiles but exact cut-points per class not documented
        "Class Labels": '["Traffic quintile 0 (lowest)", "Quintile 1", "Quintile 2", "Quintile 3", "Quintile 4 (highest)"] /unsure of class mapping/',
    },
    "Actor": {
        "Article": "Social influence analysis in large-scale networks",
        "Authors": "Tang, J. et al. (2009)",
        "Link": "https://dl.acm.org/doi/10.1145/1557019.1557108",
        "Description": "Actor co-occurrence network from film/genre Wikipedia articles",
        "Edge Meaning": "Co-occurrence on the same Wikipedia article page",
        # Unsure: 5 keyword-topic clusters, no canonical label names documented
        "Class Labels": '["Topic 0", "Topic 1", "Topic 2", "Topic 3", "Topic 4"] /unsure of class mapping/',
    },
    "Minesweeper": {
        "Article": "A critical look at the evaluation of GNNs under heterophily",
        "Authors": "Platonov, O. et al. (2023)",
        "Link": "https://arxiv.org/abs/2302.11640",
        "Description": "Synthetic grid dataset inspired by the Minesweeper game",
        "Edge Meaning": "Grid-based adjacency (connected to 8 neighboring cells)",
        # Confirmed: 0=safe cell, 1=mine (from original paper and DGL docs)
        "Class Labels": '{0: "No mine (safe)", 1: "Mine"}',
    },
    "Tolokers": {
        "Article": "A critical look at the evaluation of GNNs under heterophily",
        "Authors": "Platonov, O. et al. (2023)",
        "Link": "https://arxiv.org/abs/2302.11640",
        "Description": "Crowdsourcing worker interaction network from Toloka platform",
        "Edge Meaning": "Workers who worked on the same crowdsourcing task",
        # Confirmed: 0=not banned, 1=banned (from original paper and DGL docs)
        "Class Labels": '{0: "Not banned", 1: "Banned"}',
    },
    "Roman-empire": {
        "Article": "A critical look at the evaluation of GNNs under heterophily",
        "Authors": "Platonov, O. et al. (2023)",
        "Link": "https://arxiv.org/abs/2302.11640",
        "Description": "Linguistic word dependency graph of the Roman Empire Wikipedia page",
        "Edge Meaning": "Syntactic dependency or word adjacency in text",
        # Unsure: 18 syntactic roles, integer mapping to role names not documented without code inspection
        "Class Labels": '["Role 0", "Role 1", ..., "Role 16", "Other roles"] /unsure of class mapping/',
    },
    "Amazon-ratings": {
        "Article": "A critical look at the evaluation of GNNs under heterophily",
        "Authors": "Platonov, O. et al. (2023)",
        "Link": "https://arxiv.org/abs/2302.11640",
        "Description": "Product co-purchasing network based on Amazon ratings",
        "Edge Meaning": "Products frequently co-purchased together",
        # Unsure: 5 rating bins, ordinal but exact cut-off thresholds not documented
        "Class Labels": '["Rating bin 0 (lowest)", "Bin 1", "Bin 2", "Bin 3", "Bin 4 (highest)"] /unsure of class mapping/',
    },
    "Questions": {
        "Article": "A critical look at the evaluation of GNNs under heterophily",
        "Authors": "Platonov, O. et al. (2023)",
        "Link": "https://arxiv.org/abs/2302.11640",
        "Description": "User interaction network from Yandex Q question-answering platform",
        "Edge Meaning": "One user answered another user's question",
        # Unsure: binary but exact 0/1 assignment not confirmed without code inspection
        "Class Labels": '["Deleted/Blocked", "Active user"] /unsure of class mapping/',
    }
}


def compute_all_stats(name, data, is_sbm=False, homophily_level=None):
    """Computes all required dataset statistics programmatically."""
    logging.info(f"Computing statistics for {name}...")
    G = to_networkx(data, to_undirected=True)
    
    nodes = G.number_of_nodes()
    edges = G.number_of_edges()
    feats = data.x.shape[1] if hasattr(data, 'x') and data.x is not None else 0
    
    unique_labels, counts = torch.unique(data.y, return_counts=True)
    classes = len(unique_labels)
    class_sizes_str = str(counts.tolist())
    
    comp = nx.number_connected_components(G)
    avg_deg = 2 * edges / nodes if nodes > 0 else 0
    dens = nx.density(G) if nodes > 1 else 0
    
    # Homophily
    same_label_edges = 0
    total_edges = 0
    for u, v in G.edges():
        if u != v and u < len(data.y) and v < len(data.y):
            total_edges += 1
            if data.y[u].item() == data.y[v].item():
                same_label_edges += 1
    h_obs = same_label_edges / total_edges if total_edges > 0 else 0.0
    
    probs = counts.float() / nodes
    h_exp = torch.sum(probs ** 2).item()
    
    if abs(1.0 - h_exp) > 1e-9:
        h_adj = (h_obs - h_exp) / (1.0 - h_exp)
    else:
        h_adj = 0.0
        
    # Feature-Topology Inertia ratios
    if feats > 0:
        inertia_within, inertia_between = compute_inertia_ratios(data.x, data.y)
    else:
        inertia_within, inertia_between = 1.0, 0.0
        
    mod = compute_modularity(G, data.y)
    clust = nx.average_clustering(G)
    diam = compute_diameter(G)
    
    dataset_display_name = f"SBM (h={homophily_level:.1f})" if is_sbm else name
    if is_sbm:
        meta = {
            "Article": "Stochastic Block Model Generation Script",
            "Authors": "RichardSrn",
            "Link": "generate_datasets.py",
            "Description": "Stochastic Block Model synthetic community graph",
            "Edge Meaning": "Probabilistic connection based on community membership",
            "Class Labels": '{0: "Community 0", 1: "Community 1", 2: "Community 2", 3: "Community 3"}'
        }
    else:
        meta = METADATA.get(name, {
            "Article": "-", "Authors": "-", "Link": "-",
            "Description": "-", "Edge Meaning": "-", "Class Labels": "-"
        })
    
    stats = {
        "Dataset": dataset_display_name,
        "Article": meta["Article"],
        "Authors": meta["Authors"],
        "Link": meta["Link"],
        "Description": meta.get("Description", "-"),
        "Edge Meaning": meta.get("Edge Meaning", "-"),
        "Nodes": str(nodes),
        "Edges": str(edges),
        "Feats": str(feats),
        "Classes": str(classes),
        "Class Sizes": class_sizes_str,
        "Class Labels": meta.get("Class Labels", "-"),
        "Comp": str(comp),
        "Avg Deg": format_stat(avg_deg, precision=2),
        "Dens": format_stat(dens, precision=7),
        "H_obs": format_stat(h_obs),
        "H_exp": format_stat(h_exp),
        "H_adj": format_stat(h_adj),
        "Inertia ratio within": format_stat(inertia_within),
        "Inertia ratio between": format_stat(inertia_between),
        "Mod": format_stat(mod),
        "Clust": format_stat(clust),
        "Diam": str(diam)
    }
    return stats


def build_graphs_config(resources_dir):
    """Scans the resources directory and builds the 'graphs' section of config.json."""
    graphs = {}
    
    # SBM Merged Viewer path
    sbm_explorer_path = os.path.join(resources_dir, "SBM", "SBM_explorer.html")
    if os.path.exists(sbm_explorer_path):
        size_mb = round(os.path.getsize(sbm_explorer_path) / (1024 * 1024), 2)
        graphs["SBM"] = {}
        for h in np.linspace(0.0, 1.0, 11):
            h_key = f"h={h:.2f}"
            graphs["SBM"][h_key] = [
                {
                    "type": "full",
                    "path": "resources/SBM/SBM_explorer.html",
                    "size_mb": size_mb
                }
            ]
            
    # Scan other directories
    for dataset_name in sorted(os.listdir(resources_dir)):
        if dataset_name in ["shared", "SBM"] or not os.path.isdir(os.path.join(resources_dir, dataset_name)):
            continue
            
        dataset_dir = os.path.join(resources_dir, dataset_name)
        standard_list = []
        
        for file in sorted(os.listdir(dataset_dir)):
            if file.endswith("_interactive.html"):
                file_path = os.path.join(dataset_dir, file)
                size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)
                
                name_part = file.replace("_interactive.html", "")
                if name_part.endswith("_full"):
                    t_type = "full"
                elif name_part.endswith("_full_sample_2500"):
                    t_type = "full_sample_2500"
                elif name_part.endswith("_lcc"):
                    t_type = "lcc"
                else:
                    t_type = "full"
                    
                standard_list.append({
                    "type": t_type,
                    "path": f"resources/{dataset_name}/{file}",
                    "size_mb": size_mb
                })
                
        if standard_list:
            graphs[dataset_name] = {"Standard": standard_list}
            
    return graphs


def update_config_json(resources_dir, all_stats):
    """Regenerates config.json with updated graph paths/sizes and calculated stats."""
    config_path = os.path.join(os.path.dirname(resources_dir), "config.json")
    graphs = build_graphs_config(resources_dir)
    
    stats_config = {}
    sbm_stats = {}
    
    for name, stats in all_stats.items():
        if name.startswith("SBM_h"):
            h_val = name.split("_h")[1]
            sbm_stats[f"h={h_val}"] = stats
        else:
            stats_config[name] = stats
            
    if sbm_stats:
        stats_config["SBM"] = sbm_stats
        
    config_data = {
        "graphs": graphs,
        "stats": stats_config
    }
    
    with open(config_path, "w") as f:
        json.dump(config_data, f, indent=4)
        
    logging.info(f"Updated config.json at {config_path}")


def generate_report_md(resources_dir, all_stats):
    """Generates the datasets_report.md markdown file inside the resources folder."""
    report_path = os.path.join(resources_dir, "datasets_report.md")
    
    headers = [
        "Dataset", "Description", "Edge Meaning", "Nodes", "Edges", "Feats", "Classes", 
        "Class Sizes", "Class Labels", "Comp", "Avg Deg", "Dens", "H_obs", "H_exp", "H_adj", 
        "Inertia ratio within", "Inertia ratio between", "Mod", "Clust", "Diam",
        "Authors", "Article", "Link"
    ]
    
    def make_table(rows):
        lines = []
        lines.append("| " + " | ".join(headers) + " |")
        lines.append("|" + "|".join(["-" * (len(h) + 2) for h in headers]) + "|")
        for row in rows:
            row_vals = []
            for h in headers:
                val = row.get(h, "-")
                if h == "Link" and val != "-":
                    row_vals.append(f"[Link]({val})")
                else:
                    row_vals.append(str(val))
            lines.append("| " + " | ".join(row_vals) + " |")
        return "\n".join(lines)
        
    real_rows = []
    sbm_rows = []
    
    benchmarks_order = [
        "Cora", "CiteSeer", "PubMed", 
        "Cornell", "Texas", "Wisconsin", 
        "Chameleon", "Squirrel", "Actor",
        "Minesweeper", "Tolokers", "Roman-empire", "Amazon-ratings", "Questions"
    ]
    
    for name in benchmarks_order:
        if name in all_stats:
            real_rows.append(all_stats[name])
            
    sbm_keys = sorted([k for k in all_stats.keys() if k.startswith("SBM_h")])
    for key in sbm_keys:
        sbm_rows.append(all_stats[key])
        
    markdown_content = """# Dataset Report

## Real Datasets Statistics
REAL_TABLE_PLACEHOLDER

## Generated Datasets (SBM) Statistics
*Parameters: 2000 nodes, 4 classes, 10 features*

SBM_TABLE_PLACEHOLDER

## Glossary & Formulas
This section explains each metric and the mathematical formula used for its calculation.

- **Nodes ($|V|$)**: Number of vertices in the graph.
- **Edges ($|E|$)**: Number of undirected edges.
- **Feats ($d$)**: Dimensionality of per-node feature vectors.
- **Classes ($C$)**: Number of distinct categories in the labels.
- **Class Sizes**: List containing the number of nodes in each class.
- **Comp**: Number of connected groups of nodes (Connected Components).
- **Avg Deg ($d_{avg}$)**: Average number of connections per node: $d_{avg} = \\frac{2|E|}{|V|}$.
- **Dens ($D$)**: Graph density: $D = \\frac{2|E|}{|V|(|V|-1)}$.
### Homophily Metrics
- **H_obs (Observed Homophily)**: Fraction of edges connecting nodes of the same class: $H_{obs} = \\frac{|\\{(u,v) \\in E : y_u = y_v\\}|}{|E|}$.
- **H_exp (Expected Homophily)**: Expected homophily in a random graph with same class distribution: $H_{exp} = \\sum_{k=1}^C (\\frac{|V_k|}{|V|})^2$.
- **H_adj (Adjusted Homophily)**: Measures homophily relative to expectation: $H_{adj} = \\frac{H_{obs} - H_{exp}}{1 - H_{exp}}$.
### Feature-Topology Relationship
- **Inertia within**: Within-class inertia ($\\mathcal{I}_{within}/\\mathcal{I}_{total}$). Measures how compact the classes are.
- **Inertia ratio within**: Ratio of within-class inertia to total inertia: $R_{within} = \\frac{\\mathcal{I}_{within}}{\\mathcal{I}_{total}}$.
- **Inertia ratio between**: Ratio of between-class inertia to total inertia: $R_{between} = \\frac{\\mathcal{I}_{between}}{\\mathcal{I}_{total}}$.
### Structural Information
- **Mod (Modularity)**: Measure of the strength of division of a network into communities. Calculated using NetworkX modularity on ground truth classes.
- **Clust (Clustering Coeff)**: Measure of the degree to which nodes in a graph tend to cluster together. Average clustering coefficient.
- **Diam (Diameter)**: The longest shortest path between any pair of nodes in the graph.
"""
    markdown_content = markdown_content.replace("REAL_TABLE_PLACEHOLDER", make_table(real_rows))
    markdown_content = markdown_content.replace("SBM_TABLE_PLACEHOLDER", make_table(sbm_rows))
    with open(report_path, "w") as f:
        f.write(markdown_content)
        
    logging.info(f"Generated datasets_report.md at {report_path}")


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_resources_dir = os.path.join(script_dir, "resources")

    parser = argparse.ArgumentParser(description="Generate and Visualize Graphs")
    parser.add_argument("--output_dir", type=str, default=default_resources_dir, help="Output directory for plots")
    parser.add_argument("--force-large-graphs-rendering", action="store_true", help="Force rendering of structure for N > 10000")
    parser.add_argument("--graphs", nargs="+", type=str, default=None, help="Specific graphs to filter and plot (e.g. 'Cora', 'SBM_h0.50')")
    parser.add_argument("--no-JS", dest="JS", action="store_false", help="Disable generating interactive Chart.js HTML visualizations")
    parser.set_defaults(JS=True)
    parser.add_argument("--list-graphs", action="store_true", help="List all available graph names and exit")
    parser.add_argument("--labeling", type=str, default="both", choices=["both", "numbers", "none"], help="Labeling mode: 'numbers' (with IDs), 'none' (clean), or 'both' (generate both versions)")
    parser.add_argument("--node-size", type=str, default="degree", choices=["degree", "constant", "page_rank"], help="Method for node sizing (default: degree)")
    parser.add_argument("--layout", type=str, default="kamada_kawai", choices=["sfdp", "spring", "kamada_kawai", "circular", "spectral"], help="Graph layout method")
    parser.add_argument("--styles", nargs="+", type=str, default=["publication"], help="Styles to render (e.g. publication darktheme)")
    parser.add_argument("--feature-plots", nargs="+", type=str, default=["tsne"], choices=["pca", "tsne"], help="Feature space plots")
    parser.add_argument("--gallery", action="store_true", help="Generate extensive gallery of visualizations")
    args = parser.parse_args()
    
    setup_logging(level=logging.INFO)
    os.makedirs(args.output_dir, exist_ok=True)
    
    if args.list_graphs:
        print("Available Graphs:")
        print("-----------------")
        print("Benchmarks:")
        benchmarks = [
            "Cora", "CiteSeer", "PubMed", 
            "Cornell", "Texas", "Wisconsin", 
            "Squirrel", "Chameleon", "Actor",
            "Roman-empire", "Amazon-ratings", "Minesweeper", "Tolokers", "Questions"
        ]
        for b in benchmarks:
            print(f"  - {b}")
        
        print("\nSBM (varying homophily):")
        homophily_levels = np.linspace(0.0, 1.0, 11)
        for h in homophily_levels:
            print(f"  - SBM_h{h:.2f}")
        sys.exit(0)

    # 1. Determine which graphs
    graphs_to_process = []
    
    should_gen_sbm = True
    if args.graphs:
        if not any("SBM" in g or g == "SBMall" for g in args.graphs):
            should_gen_sbm = False
            
    if should_gen_sbm:
        sbm_graphs = get_sbm_graphs(filter_list=args.graphs)
    else:
        sbm_graphs = []

    bench_graphs = get_benchmark_graphs(filter_list=args.graphs)
    
    all_graphs = sbm_graphs + bench_graphs

    # Filter again just in case SBMs need filtering
    if args.graphs:
        filtered_graphs = []
        for name, data in all_graphs:
            if any(req in name or (req == "SBMall" and "SBM" in name) for req in args.graphs):
                filtered_graphs.append((name, data))
        all_graphs = filtered_graphs
    
    if not all_graphs:
        logging.warning("No graphs matched the selection criteria.")
        return

    # Determine if we should skip static plots (JS-only mode)
    # Skip static plots if ONLY --JS is specified (no gallery, no other viz flags)
    js_only_mode = args.JS and not args.gallery
    
    # 2. Visualize
    all_stats = {}
    for name, data in tqdm(all_graphs, desc="Processing Graphs"):
        # Compute stats for reporting
        is_sbm = name.startswith("SBM")
        if is_sbm:
            h_val = float(name.split("_h")[1])
            # Generate 2000-node version for stats computation to match standard size
            stats_data = generate_sbm(num_nodes=2000, num_classes=4, num_features=10, homophily_coef=h_val, seed=42)
            all_stats[name] = compute_all_stats(name, stats_data, is_sbm=True, homophily_level=h_val)
        else:
            all_stats[name] = compute_all_stats(name, data, is_sbm=False)

        logging.info(f"--- Processing {name} ---")
        
        # ASSIGN ORIGINAL IDS IF NOT PRESENT
        if not hasattr(data, 'orig_ids'):
             data.orig_ids = torch.arange(data.num_nodes, dtype=torch.long)
        
        # Determine subfolder
        if name.startswith("SBM"):
             sub_dir = "SBM"
        else:
             sub_dir = name
        
        current_save_dir = os.path.join(args.output_dir, sub_dir)
        os.makedirs(current_save_dir, exist_ok=True)
        
        # Skip static plots if in JS-only mode
        if not js_only_mode:
            # Determine Labeling Modes
            show_numbers_list = []
            if args.labeling == "numbers":
                show_numbers_list = [True]
            elif args.labeling == "none":
                show_numbers_list = [False]
            else: # both
                show_numbers_list = [False, True]

            for show_nums in show_numbers_list:
                # A. Full Graph Structure
                plot_structure_styled(data, f"{name}_full", current_save_dir, args.force_large_graphs_rendering, 
                                      styles=args.styles, show_numbers=show_nums, node_size_method=args.node_size, layout=args.layout)
                
                # B. Largest Connected Component (LCC)
                try:
                     lcc_data = extract_lcc(data)
                     # Only log once
                     if show_nums == show_numbers_list[0]:
                          logging.info(f"Extracted LCC for {name}: {lcc_data.num_nodes}/{data.num_nodes} nodes")
                     
                     # lcc_data should inherit orig_ids because PyG subgraph slices attributes
                     plot_structure_styled(lcc_data, f"{name}_lcc", current_save_dir, args.force_large_graphs_rendering, 
                                           styles=args.styles, show_numbers=show_nums, node_size_method=args.node_size, layout=args.layout)
                          
                except Exception as e:
                     logging.error(f"Failed to extract/plot LCC for {name}: {e}")
                
                # C. Features & Topology
                plot_features(data, name, current_save_dir, show_numbers=show_nums, methods=args.feature_plots)

            plot_topology_embedding(data, name, current_save_dir)
        
        # JS Export (Interactive - always run if --JS is set)
        if args.JS:
             if data.num_nodes > 2500:
                 logging.info(f"Graph {name} is large ({data.num_nodes} nodes). Generating 2500-node sample.")
                 sample_data = subsample_graph(data, max_nodes=2500)
                 export_to_chartjs(sample_data, f"{name}_full_sample_2500", current_save_dir, force_rendering=True)
                 
                 logging.info(f"Generating full graph {name} ({data.num_nodes} nodes).")
                 export_to_chartjs(data, f"{name}_full", current_save_dir, force_rendering=True)
             else:
                 export_to_chartjs(data, f"{name}_full", current_save_dir, force_rendering=True)
             
             # Skip LCC for SBM graphs (not needed) or single-component graphs
             if name.startswith("SBM"):
                 logging.info(f"Skipping LCC for {name} (SBM graph)")
             else:
                 G_temp = to_networkx(data, to_undirected=True)
                 num_components = nx.number_connected_components(G_temp)
                 if num_components > 1:
                     try:
                         lcc_data = extract_lcc(data)
                         export_to_chartjs(lcc_data, f"{name}_lcc", current_save_dir, force_rendering=True)
                     except Exception as e: 
                         logging.error(f"Failed to export LCC for {name}: {e}")
                 else:
                     logging.info(f"Skipping LCC for {name} (single component)")
        
        # D. Gallery Mode
        if args.gallery:
             generate_gallery(data, name, current_save_dir)
          
    logging.info("Visualization Complete.")
    
    # Generate merged SBM explorer if SBM graphs were processed
    if args.JS and sbm_graphs:
        sbm_save_dir = os.path.join(args.output_dir, "SBM")
        export_sbm_merged_viewer(sbm_graphs, sbm_save_dir)
        
    # Update config.json and generate datasets_report.md
    if args.JS:
        update_config_json(args.output_dir, all_stats)
        generate_report_md(args.output_dir, all_stats)
if __name__ == "__main__":
    main()
