# Dataset Report

## Real Datasets Statistics
| Dataset        |   Nodes |   Edges |   Feats |   Classes |   Comp |   Avg Deg |      Dens |   H_obs |   H_exp |   H_adj |   Inertia ratio within |   Inertia ratio between |    Mod |   Clust |   Diam |
|----------------|---------|---------|---------|-----------|--------|-----------|-----------|---------|---------|---------|------------------------|-------------------------|--------|---------|--------|
| Cora           |    2708 |    5278 |    1433 |         7 |     78 |      3.9  | 0.0014    |   0.81  |   0.18  |   0.768 |                  0.974 |               0.026     |  0.64  |   0.257 |    inf |
| CiteSeer       |    3327 |    4552 |    3703 |         6 |    438 |      2.74 | 0.0008227 |   0.736 |   0.178 |   0.678 |                  0.983 |               0.017     |  0.539 |   0.122 |    inf |
| PubMed         |   19717 |   44324 |     500 |         3 |      1 |      4.5  | 0.000228  |   0.802 |   0.357 |   0.693 |                  0.982 |               0.018     |  0.432 |   0.054 |     18 |
| Cornell        |     183 |     149 |    1703 |         5 |      1 |      1.63 | 0.0089    |   0.131 |   0.287 |  -0.219 |                  0.93  |               0.07      | -0.146 |   0.158 |      8 |
| Texas          |     183 |     162 |    1703 |         5 |      1 |      1.78 | 0.0097    |   0.108 |   0.374 |  -0.425 |                  0.939 |               0.061     | -0.164 |   0.253 |      8 |
| Wisconsin      |     251 |     257 |    1703 |         5 |      1 |      2.05 | 0.0082    |   0.196 |   0.324 |  -0.189 |                  0.911 |               0.089     | -0.093 |   0.222 |      8 |
| Chameleon      |    2277 |   18050 |    2325 |         5 |      1 |     15.85 | 0.007     |   0.235 |   0.202 |   0.042 |                  0.993 |               0.007     |  0.027 |   0.488 |     11 |
| Squirrel       |    5201 |  108536 |    2089 |         5 |      1 |     41.74 | 0.008     |   0.224 |   0.2   |   0.03  |                  0.995 |               0.005     |  0.006 |   0.415 |     10 |
| Actor          |    7600 |   15009 |     932 |         5 |      1 |      3.95 | 0.0005198 |   0.219 |   0.213 |   0.007 |                  0.994 |               0.006     |  0.005 |   0.084 |     12 |
| Minesweeper    |   10000 |   39402 |       7 |         2 |      1 |      7.88 | 0.0007881 |   0.683 |   0.68  |   0.009 |                  1     |               0.0001318 |  0.003 |   0.434 |     99 |
| Tolokers       |   11758 |  519000 |      10 |         2 |      1 |     88.28 | 0.0075    |   0.595 |   0.659 |  -0.188 |                  0.973 |               0.027     |  0.041 |   0.534 |     11 |
| Roman-empire   |   22662 |   32927 |     300 |        18 |      1 |      2.91 | 0.0001282 |   0.047 |   0.088 |  -0.045 |                  0.839 |               0.161     | -0.043 |   0.394 |   6824 |
| Amazon-ratings |   24492 |   93050 |     300 |         5 |      1 |      7.6  | 0.0003103 |   0.38  |   0.271 |   0.15  |                  0.999 |               0.0009036 |  0.101 |   0.589 |     46 |
| Questions      |   48921 |  153540 |     301 |         2 |      1 |      6.28 | 0.0001283 |   0.84  |   0.942 |  -1.771 |                  0.998 |               0.002     |  0.003 |   0.026 |     16 |

## Generated Datasets (SBM) Statistics
*Parameters: 2000 nodes, 4 classes, 10 features*

| Dataset     |   Nodes |   Edges |   Feats |   Classes |   Comp |   Avg Deg |   Dens |   H_obs |   H_exp |   H_adj |   Inertia ratio within |   Inertia ratio between |    Mod |   Clust |   Diam |
|-------------|---------|---------|---------|-----------|--------|-----------|--------|---------|---------|---------|------------------------|-------------------------|--------|---------|--------|
| SBM (h=0.0) |    2000 |   10003 |      10 |         4 |      1 |     10    | 0.005  |   0     |    0.25 |  -0.333 |                  0.816 |                   0.184 | -0.25  |   0.003 |      6 |
| SBM (h=0.2) |    2000 |   10070 |      10 |         4 |      1 |     10.07 | 0.005  |   0.197 |    0.25 |  -0.071 |                  0.816 |                   0.184 | -0.053 |   0.004 |      6 |
| SBM (h=0.5) |    2000 |   10119 |      10 |         4 |      1 |     10.12 | 0.0051 |   0.493 |    0.25 |   0.324 |                  0.816 |                   0.184 |  0.243 |   0.004 |      6 |
| SBM (h=0.8) |    2000 |    9920 |      10 |         4 |      1 |      9.92 | 0.005  |   0.802 |    0.25 |   0.735 |                  0.816 |                   0.184 |  0.552 |   0.01  |      7 |
| SBM (h=1.0) |    2000 |    9912 |      10 |         4 |      4 |      9.91 | 0.005  |   1     |    0.25 |   1     |                  0.816 |                   0.184 |  0.75  |   0.021 |    inf |

## Glossary & Formulas
This section explains each metric and the mathematical formula used for its calculation.

- **Nodes ($|V|$)**: Number of vertices in the graph.
- **Edges ($|E|$)**: Number of undirected edges.
- **Feats ($d$)**: Dimensionality of per-node feature vectors.
- **Classes ($C$)**: Number of distinct categories in the labels.
- **Comp**: Number of connected groups of nodes (Connected Components).
- **Avg Deg ($d_{avg}$)**: Average number of connections per node: $d_{avg} = \frac{2|E|}{|V|}$.
- **Dens ($D$)**: Graph density: $D = \frac{2|E|}{|V|(|V|-1)}$.
### Homophily Metrics
- **H_obs (Observed Homophily)**: Fraction of edges connecting nodes of the same class: $H_{obs} = \frac{|\{(u,v) \in E : y_u = y_v\}|}{|E|}$.
- **H_exp (Expected Homophily)**: Expected homophily in a random graph with same class distribution: $H_{exp} = \sum_{k=1}^C (\frac{|V_k|}{|V|})^2$.
- **H_adj (Adjusted Homophily)**: Measures homophily relative to expectation: $H_{adj} = \frac{H_{obs} - H_{exp}}{1 - H_{exp}}$.
### Feature-Topology Relationship
- **Inertia ratio within**: Ratio of within-class inertia to total inertia: $R_{within} = \frac{S_{within}}{S_{total}}$.
- **Inertia ratio between**: Ratio of between-class inertia to total inertia: $R_{between} = \frac{S_{between}}{S_{total}}$.
### Structural Information
- **Mod (Modularity)**: Measure of the strength of division of a network into communities. Calculated using NetworkX modularity on ground truth classes.
- **Clust (Clustering Coeff)**: Measure of the degree to which nodes in a graph tend to cluster together. Average clustering coefficient.
- **Diam (Diameter)**: The longest shortest path between any pair of nodes in the graph.
