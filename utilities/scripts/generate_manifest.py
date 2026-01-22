import os
import json
import ast

# Determine the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Define paths relative to the script directory
REPOSITORY_DIR = os.path.join(SCRIPT_DIR, 'repository')
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'scripts_manifest.json')

def get_file_size(path):
    return os.path.getsize(path)

def extract_help_text(file_path):
    """
    Extracts help text or docstrings from files.
    - Python: module docstring
    - Shell/Others: leading comments
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        if ext == '.py':
            try:
                tree = ast.parse(content)
                docstring = ast.get_docstring(tree)
                if docstring:
                    return docstring.strip()
            except Exception:
                pass # Fallback to comment extraction if parse fails

        # Fallback / Other languages: Extract top comments
        lines = content.splitlines()
        comments = []
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            
            # Check for comment markers
            if ext in ['.py', '.sh', '.yaml', '.yml'] and stripped.startswith('#'):
                comments.append(stripped.lstrip('#').strip())
            elif ext in ['.js', '.c', '.cpp', '.java', '.css'] and (stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*')):
                 # Simple cleanup for C-style comments
                 clean_line = stripped
                 if clean_line.startswith('//'): clean_line = clean_line[2:]
                 if clean_line.startswith('/*'): clean_line = clean_line[2:]
                 if clean_line.endswith('*/'): clean_line = clean_line[:-2]
                 if clean_line.startswith('*'): clean_line = clean_line[1:]
                 comments.append(clean_line.strip())
            elif ext == '.html' and stripped.startswith('<!--'):
                 # Very basic HTML comment extraction (single line mostly)
                 clean_line = stripped.replace('<!--', '').replace('-->', '')
                 comments.append(clean_line.strip())
            else:
                # Stop at first non-comment line (mostly)
                # Allow shebangs in shell scripts to be skipped or included, usually included as comment by logic above
                if not stripped.startswith('#') and not stripped.startswith('//'):
                     break
        
        if comments:
            # Skip shebang if it's the first line of comments
            if comments[0].startswith('!'):
                comments = comments[1:]
            return "\n".join(comments).strip()
            
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

    return None

def generate_manifest():
    scripts = []
    
    if not os.path.exists(REPOSITORY_DIR):
        print(f"Directory '{REPOSITORY_DIR}' not found. Creating it.")
        os.makedirs(REPOSITORY_DIR)
        return

    for root, dirs, files in os.walk(REPOSITORY_DIR):
        for file in files:
            # Skip hidden files
            if file.startswith('.'):
                continue
                
            file_path = os.path.join(root, file)
            # Make path relative to the SCRIPT_DIR (where the HTML/JS live)
            rel_path = os.path.relpath(file_path, start=SCRIPT_DIR)
            
            # Create script entry
            entry = {
                'name': file,
                'path': rel_path,
                'size': get_file_size(file_path),
                'extension': os.path.splitext(file)[1].lower(),
                'help_text': extract_help_text(file_path)
            }
            
            scripts.append(entry)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(scripts, f, indent=2)
    
    print(f"Manifest generated with {len(scripts)} scripts.")
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == '__main__':
    generate_manifest()
