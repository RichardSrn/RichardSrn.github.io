#!/bin/bash

rename() {
    old="$1"
    new="$2"

    for file in *; do
        if [[ -f "$file" ]]; then
            new_name=$(echo "$file" | tr "$old" "$new")
            if [[ "$new_name" != "$file" ]]; then
                mv "$file" "$new_name"
                echo "Renamed '$file' to '$new_name'"
            fi
        fi
    done
}


# Usage: rename OLD NEW
rename "$@"
