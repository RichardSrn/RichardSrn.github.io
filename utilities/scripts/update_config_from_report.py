import json
import re
import os

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPORT_PATH = os.path.join(SCRIPT_DIR, 'resources', 'datasets_report.md')
CONFIG_PATH = os.path.join(SCRIPT_DIR, 'config.json')

def parse_markdown_table(lines):
    """Parses a markdown table into a list of dictionaries."""
    headers = []
    data = []
    
    for line in lines:
        line = line.strip()
        if not line.startswith('|'):
            continue
        
        # Remove outer pipes and split
        parts = [p.strip() for p in line.strip('|').split('|')]
        
        if not headers:
            headers = parts
            continue
            
        if '---' in parts[0]: # Separator line
            continue
            
        if len(parts) != len(headers):
            continue
            
        row = {}
        for i, h in enumerate(headers):
            row[h] = parts[i]
        data.append(row)
        
    return data

def extract_link(md_link):
    """Extracts URL from [Link](url) format."""
    match = re.search(r'\]\((.*?)\)', md_link)
    if match:
        return match.group(1)
    return md_link

def main():
    if not os.path.exists(REPORT_PATH):
        print(f"Report not found: {REPORT_PATH}")
        return

    with open(REPORT_PATH, 'r') as f:
        content = f.readlines()

    # Split content into sections to parse tables separately
    real_datasets_lines = []
    sbm_datasets_lines = []
    
    current_section = None
    for line in content:
        if "## Real Datasets Statistics" in line:
            current_section = "real"
            continue
        elif "## Generated Datasets (SBM) Statistics" in line:
            current_section = "sbm"
            continue
        elif line.startswith("## "):
            current_section = None
            continue
            
        if current_section == "real":
            real_datasets_lines.append(line)
        elif current_section == "sbm":
            sbm_datasets_lines.append(line)

    real_data = parse_markdown_table(real_datasets_lines)
    sbm_data = parse_markdown_table(sbm_datasets_lines)
    
    # Load Config
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    
    if 'stats' not in config:
        config['stats'] = {}

    # Update Real Datasets
    for row in real_data:
        dataset = row.get('Dataset')
        if not dataset: continue
        
        # Extract metadata
        article = row.get('Article', '-')
        authors = row.get('Authors', '-')
        link_md = row.get('Link', '-')
        link_url = extract_link(link_md)
        
        if dataset not in config['stats']:
            config['stats'][dataset] = {}
            
        config['stats'][dataset]['Article'] = article
        config['stats'][dataset]['Authors'] = authors
        config['stats'][dataset]['Link'] = link_url
        
        # Also copy other stats if they might be fresher? 
        # For now, let's just stick to the requested metadata to be safe
        # actually, the user wants "everything of the updated table"
        # lets update everything EXCEPT the hidden internal keys like _id
        
        for k, v in row.items():
            if k not in ['Dataset', 'Article', 'Authors', 'Link']:
                 config['stats'][dataset][k] = v

    # Update SBM Datasets
    # SBM keys in stats are usually nested under "SBM" -> "h=0.xx" based on current structure
    # Let's check existing structure
    if 'SBM' not in config['stats']:
        config['stats']['SBM'] = {}
        
    for row in sbm_data:
        dataset_name = row.get('Dataset') # e.g. "SBM (h=0.0)"
        if not dataset_name: continue
        
        # Parse h value from name
        match = re.search(r'h=([\d\.]+)', dataset_name)
        if match:
            h_val = match.group(1)
            # Format to match config keys (likely 2 decimals)
            # Check if existing keys have specific format
            # In config.json we saw "h=0.50", "h=0.00" etc
            
            # Try to match existing key
            key = f"h={float(h_val):.2f}"
            
            if key not in config['stats']['SBM']:
                config['stats']['SBM'][key] = {}
            
            # Update stats
            # SBM usually doesn't have Article/Authors in the report (marked as "-")
            config['stats']['SBM'][key]['Article'] = row.get('Article', '-')
            config['stats']['SBM'][key]['Authors'] = row.get('Authors', '-')
            # Link is usually "-"
            config['stats']['SBM'][key]['Link'] = extract_link(row.get('Link', '-'))
            
            for k, v in row.items():
                if k not in ['Dataset', 'Article', 'Authors', 'Link']:
                     config['stats']['SBM'][key][k] = v

    # Save Config
    with open(CONFIG_PATH, 'w') as f:
        json.dump(config, f, indent=4)
        
    print("Config stats updated successfully.")

if __name__ == "__main__":
    main()
