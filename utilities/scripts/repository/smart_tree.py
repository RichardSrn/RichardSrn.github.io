#!/usr/bin/env python3
import os
import sys
import argparse
from pathlib import Path
from collections import Counter

# --- Configuration & Heuristics ---

# Folders to identify as "Environments/Builds" and stop recursion
# Key: Directory Name (or marker file inside), Value: Display Label
STOP_DIRS = {
    'node_modules': '📦 Node.js Modules',
    '.git': 'main Git Repository',
    '.hg': 'Mercurial Repository',
    '.svn': 'SVN Repository',
    '__pycache__': '🐍 Python Cache',
    '.pytest_cache': '🧪 Pytest Cache',
    '.mypy_cache': 'Type Checker Cache',
    '.tox': 'Tox Environment',
    '.idea': 'IntelliJ/PyCharm Config',
    '.vscode': 'VSCode Config',
    'target': '🦀 Rust Target/Build',  # Common in Rust
    'build': '🔨 Build Directory',      # Common in C/Java
    'dist': '📦 Distribution/Output',
    'site-packages': '🐍 Python Site Packages'
}

# Heuristic: If a folder contains any of these files, treat it as an environment root
ENV_MARKERS = {
    'pyvenv.cfg': '🐍 Python Virtual Env',
    'Cargo.toml': None, # Don't stop at Cargo.toml, but maybe useful context? (Not used for stopping yet)
}

# --- Styling ---

class Style:
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    MAGENTA = '\033[95m'
    GREY = '\033[90m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

    @staticmethod
    def color(text, color_code):
        if sys.stdout.isatty():
            return f"{color_code}{text}{Style.RESET}"
        return text

# --- Core Logic ---

def analyze_directory(path_obj, show_hidden=False):
    """
    Analyzes a directory to determine:
    1. If it's a special environment (stop recursion).
    2. The summary of files inside it.
    3. The list of valid subdirectories to traverse.
    """
    is_stop = False
    stop_label = ""
    
    # 1. Check Directory Name against Blocklist
    if path_obj.name in STOP_DIRS:
        is_stop = True
        stop_label = STOP_DIRS[path_obj.name]

    # 2. Check for Marker Files (e.g. pyvenv.cfg)
    # Only check markers if we haven't already decided to stop
    if not is_stop:
        try:
            # Quick check for venv markers without full iteration if possible
            if (path_obj / 'pyvenv.cfg').exists():
                is_stop = True
                stop_label = ENV_MARKERS['pyvenv.cfg']
            elif (path_obj / 'bin' / 'activate').exists():
                is_stop = True
                stop_label = "🐍 Python Virtual Env (Unix)"
            elif (path_obj / 'Scripts' / 'activate').exists():
                is_stop = True
                stop_label = "🐍 Python Virtual Env (Win)"
        except PermissionError:
            pass

    # 3. Scan Content
    files_summary = ""
    subdirs = []
    
    try:
        # We scan the directory once
        all_items = list(path_obj.iterdir())
        
        if not show_hidden:
            files = [f for f in all_items if f.is_file() and not f.name.startswith('.')]
            subdirs = [d for d in all_items if d.is_dir() and not d.name.startswith('.')]
        else:
            files = [f for f in all_items if f.is_file()]
            subdirs = [d for d in all_items if d.is_dir()]
        
        # Sort subdirs for consistent tree display
        subdirs.sort(key=lambda s: s.name.lower())

        # Generate File Summary
        if files:
            ext_counts = Counter()
            for f in files:
                ext = f.suffix.lower().lstrip('.')
                if not ext:
                    # Handle Makefiles, Dockerfiles, dotfiles
                    name = f.name
                    if name.startswith('.'): ext = name # e.g. .gitignore
                    elif name.lower() in ['makefile', 'dockerfile', 'jenkinsfile']: ext = name
                    else: ext = 'no-ext'
                ext_counts[ext] += 1
            
            # Format: "3 py, 1 md"
            # Sort by count descending
            summary_parts = [f"{count} {ext}" for ext, count in ext_counts.most_common(4)]
            if len(ext_counts) > 4:
                summary_parts.append("...")
            files_summary = ", ".join(summary_parts)

    except PermissionError:
        files_summary = Style.color("Permission Denied", Style.RED)
        is_stop = True # Cannot traverse anyway

    return is_stop, stop_label, files_summary, subdirs

def get_common_pattern(names):
    """
    Finds a common prefix in a list of names to describe a group.
    e.g. ["exp_1", "exp_2", "exp_3"] -> "exp_"
    """
    if not names: return ""
    prefix = os.path.commonprefix(names)
    if len(prefix) > 3: # Only use if significant
        return prefix
    return ""

def print_tree(path, prefix="", is_last=True, depth=0, max_depth=10, fold_threshold=10, show_hidden=False):
    path_obj = Path(path)
    
    # Analyze
    is_stop, stop_label, files_summary, subdirs = analyze_directory(path_obj)
    
    # --- Formatting the Line ---
    connector = "└── " if is_last else "├── "
    if depth == 0: connector = "" # Root

    name_str = path_obj.name
    if depth == 0: name_str = str(path_obj)

    # Decorate Name
    if is_stop:
        display_name = Style.color(name_str, Style.YELLOW)
        meta = f"  [{Style.color(stop_label, Style.MAGENTA)}]"
    else:
        display_name = Style.color(name_str, Style.BLUE)
        meta_parts = []
        
        # File Summary
        if files_summary:
            meta_parts.append(f"files: {Style.color(files_summary, Style.GREEN)}")
        
        # Subdir Summary (if not recursing or empty)
        if not subdirs and not is_stop:
             # Empty folder?
             if not files_summary:
                 meta_parts.append(Style.color("Empty", Style.RED))
        
        meta = f" # {'; '.join(meta_parts)}" if meta_parts else ""

    print(f"{prefix}{connector}{display_name}{meta}")

    # --- Recursion & Folding Logic ---
    
    if is_stop or depth >= max_depth:
        return

    # Handle subdirectories
    count = len(subdirs)
    
    # Logic: If too many subdirectories, fold the middle
    if count > fold_threshold:
        # Show first 3
        head_count = 3
        # Show last 1 (often valuable for time series / incremental backups)
        tail_count = 1
        
        to_show_head = subdirs[:head_count]
        to_show_tail = subdirs[-tail_count:]
        hidden_dirs = subdirs[head_count:-tail_count]
        
        # Process Head
        new_prefix = prefix + ("    " if is_last else "│   ")
        for i, subdir in enumerate(to_show_head):
            print_tree(subdir, new_prefix, is_last=False, depth=depth+1, max_depth=max_depth, fold_threshold=fold_threshold, show_hidden=show_hidden)
        
        # Process Folded Middle
        hidden_count = len(hidden_dirs)
        pattern = get_common_pattern([d.name for d in hidden_dirs])
        
        desc = f"... {hidden_count} directories hidden"
        if pattern:
            desc += f" (mostly '{pattern}*')"
            
        print(f"{new_prefix}├── {Style.color(desc, Style.GREY)}")
        
        # Process Tail
        for i, subdir in enumerate(to_show_tail):
            # This is effectively the last child of the current node
            print_tree(subdir, new_prefix, is_last=(i == len(to_show_tail)-1), depth=depth+1, max_depth=max_depth, fold_threshold=fold_threshold, show_hidden=show_hidden)
            
    else:
        # Standard processing
        new_prefix = prefix + ("    " if is_last else "│   ")
        for i, subdir in enumerate(subdirs):
            is_last_child = (i == count - 1)
            print_tree(subdir, new_prefix, is_last_child, depth=depth+1, max_depth=max_depth, fold_threshold=fold_threshold, show_hidden=show_hidden)

def main():
    parser = argparse.ArgumentParser(description="Smart Tree: Context-aware directory visualizer for developers.")
    parser.add_argument("path", nargs="?", default=".", help="Directory to analyze")
    parser.add_argument("--depth", "-d", type=int, default=5, help="Max recursion depth (default: 5)")
    parser.add_argument("--fold", "-f", type=int, default=12, help="Threshold to fold directories (default: 12)")
    parser.add_argument("--all", "-a", action="store_true", help="Do not hide/fold anything (disables smart features)")
    parser.add_argument("--hidden", action="store_true", help="Show hidden files and folders")
    
    args = parser.parse_args()
    
    root_path = Path(args.path)
    if not root_path.exists():
        print(f"{Style.color('Error:', Style.RED)} Path '{root_path}' does not exist.")
        return

    # If --all is passed, we effectively disable folding and stopping (to a reasonable extent)
    if args.all:
        # Clear stop dirs to force recursion
        STOP_DIRS.clear()
        ENV_MARKERS.clear()
        fold_thresh = 999999
    else:
        fold_thresh = args.fold

    print_tree(root_path, max_depth=args.depth, fold_threshold=fold_thresh, show_hidden=args.hidden)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAborted.")