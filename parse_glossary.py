import re
import json

def parse_report(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Extract Glossary section
    glossary_section = re.search(r'## Glossary & Formulas\n(.*?)(?=\n##|$)', content, re.DOTALL)
    if not glossary_section:
        return {}
        
    text = glossary_section.group(1)
    
    # Parse items like "- **Key**: Description"
    # The keys in the table are headers like "Nodes", "Edges", "Inertia ratio within"
    # The detailed descriptions (e.g. formulas) should be the tooltip.
    
    definitions = {}
    pattern = r'- \*\*(.*?)\*\*: (.*)'
    for match in re.finditer(pattern, text):
        key_raw = match.group(1) # e.g. "Nodes ($|V|$)"
        desc = match.group(2)
        
        # Clean up key: "Nodes ($|V|$)" -> "Nodes"
        # "Avg Deg ($d_{avg}$)" -> "Avg Deg"
        # "Inertia ratio within" -> "Inertia ratio within"
        
        # Split by '(' or just take the text part
        key_clean = re.split(r'\s*\(', key_raw)[0].strip()
        
        # normalize key to match table headers
        # Table headers in script.js: "Dataset", "Nodes", "Edges", "Feats", "Classes", "Comp", "Avg Deg", "Dens", "H_obs", "H_exp", "H_adj", "Inertia ratio within", "Inertia ratio between", "Mod", "Clust", "Diam"
        
        definitions[key_clean] = desc
        
    return definitions

defs = parse_report("utilities/graphs_visualization/resources/datasets_report.md")
print(json.dumps(defs, indent=2))
