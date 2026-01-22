#!/bin/bash

# Default values
depth=0
ignore_dirs=( "__pycache__" "venv" ".git" )
ignore_paths=()

# Function to print the codebase
print_codebase() {
    local dir="$1"
    local current_depth="$2"

    # Build the ignore options for the tree command
    local ignore_options=()
    for dir_to_ignore in "${ignore_dirs[@]}"; do
        # Add -I and the directory name for each item in ignore_dirs
        ignore_options+=("-I")
        ignore_options+=("$dir_to_ignore")
    done

    # Show the tree structure
    echo "Tree structure of $dir:"

    # Determine if depth limit should be applied
    local depth_option=()
    # The tree command's -L option requires a level greater than 0 to show anything below the root.
    # Omitting -L shows the full tree.
    if [[ "$current_depth" -gt 0 ]]; then
        depth_option+=("-L")
        depth_option+=("$current_depth")
    fi

    # Call the tree command with depth limit (if applicable) and ignore options
    # "${depth_option[@]}" expands to nothing if current_depth is <= 0
    # "${ignore_options[@]}" expands to the series of -I options
    tree "${depth_option[@]}" "${ignore_options[@]}" "$dir"
    
    echo ""
    echo "---"
    echo ""

    # Recursively print files
    for file in "$dir"/*; do
        if [[ -d "$file" ]]; then
            # Check if the directory is in the ignore list
            if [[ " ${ignore_dirs[@]} " =~ " $(basename "$file") " ]]; then
                continue
            fi
            print_codebase "$file" "$current_depth"
        elif [[ -f "$file" ]]; then
            # Determine the language based on the file extension
            case "${file##*.}" in
                py) lang="python" ;;
                sh) lang="bash" ;;
                html) lang="html" ;;
                js) lang="javascript" ;;
                css) lang="css" ;;
                *) lang="text" ;;
            esac

            # Print the file path and contents
            echo "$file"
            echo '```'"$lang"
            cat "$file"
            echo '```'
            echo
        fi
    done
}

# Parse options
while getopts "l:a:i:" opt; do
    case $opt in
        l) depth="$OPTARG" ;;
        a) ignore_dirs=() ;;  # Clear ignore_dirs if -a is provided
        i) ignore_paths+=("$OPTARG") ;;  # Add ignored path
        *) echo "Usage: $0 [-l level] [-a] [-i ignored_path]"; exit 1 ;;
    esac
done

# Start printing the codebase from the current directory
print_codebase "." "$depth"
