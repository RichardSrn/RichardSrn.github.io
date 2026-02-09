import os
import json
import re

RESOURCE_DIR = "utilities/graphs_visualization/resources"
OUTPUT_FILE = "utilities/graphs_visualization/config.json"

def parse_filename(filename):
    # Remove extension
    name = filename.replace("_interactive.html", "")
    
    # SBM Special Case: SBM_h0.00_full
    if name.startswith("SBM"):
        match = re.match(r"(SBM)_h([\d\.]+)_(\w+)", name)
        if match:
            return {
                "dataset": "SBM",
                "variant": f"h={match.group(2)}",
                "type": match.group(3)
            }
    
    # Standard Case: Cora_full, Cora_lcc, Cora_full_sample_2500
    parts = name.split("_")
    dataset = parts[0]
    remaining = "_".join(parts[1:])
    
    return {
        "dataset": dataset,
        "variant": "Standard",
        "type": remaining
    }

def parse_markdown_table(file_path):
    stats = {}
    
    with open(file_path, "r") as f:
        lines = f.readlines()
        
    current_section = None
    headers = []
    
    for line in lines:
        line = line.strip()
        
        # Detect sections
        if "Real Datasets Statistics" in line:
            current_section = "Real"
            continue
        elif "Generated Datasets (SBM) Statistics" in line:
            current_section = "SBM"
            continue
            
        # Parse Table Headers
        if line.startswith("|") and "Dataset" in line:
            headers = [h.strip() for h in line.split("|") if h.strip()]
            continue
            
        # Skip separator lines
        if line.startswith("|") and "---" in line:
            continue
            
        # Parse Table Rows
        if line.startswith("|") and current_section:
            values = [v.strip() for v in line.split("|") if v.strip()]
            if not values:
                continue
                
            dataset_name = values[0]
            row_data = dict(zip(headers, values))
            
            # Clean up SBM names to match graph files
            # Example: "SBM (h=0.0)" -> "h=0.00" (need to normalize)
            if current_section == "SBM":
                match = re.search(r"h=([\d\.]+)", dataset_name)
                if match:
                    val = float(match.group(1))
                    key = f"h={val:.2f}" # Normalize to match filename convention
                    if "SBM" not in stats:
                        stats["SBM"] = {}
                    stats["SBM"][key] = row_data
            else:
                # Real datasets are direct keys
                stats[dataset_name] = row_data

    return stats

def generate_manifest():
    manifest = {"graphs": {}, "stats": {}}
    
    # Parse Stats
    report_path = os.path.join(RESOURCE_DIR, "datasets_report.md")
    if os.path.exists(report_path):
        manifest["stats"] = parse_markdown_table(report_path)
    
    # Parse Graphs
    for root, dirs, files in os.walk(RESOURCE_DIR):
        for file in files:
            if file.endswith("_interactive.html"):
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, "utilities/graphs_visualization")
                size_mb = os.path.getsize(path) / (1024 * 1024)
                
                info = parse_filename(file)
                dataset = info["dataset"]
                variant = info["variant"]
                graph_type = info["type"]
                
                if dataset not in manifest["graphs"]:
                    manifest["graphs"][dataset] = {}
                
                if variant not in manifest["graphs"][dataset]:
                    manifest["graphs"][dataset][variant] = []
                
                manifest["graphs"][dataset][variant].append({
                    "type": graph_type,
                    "path": rel_path,
                    "size_mb": round(size_mb, 2)
                })

    with open(OUTPUT_FILE, "w") as f:
        json.dump(manifest, f, indent=4)
    
    print(f"Manifest generated at {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_manifest()
