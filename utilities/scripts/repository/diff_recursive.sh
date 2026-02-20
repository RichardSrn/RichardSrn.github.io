#!/usr/bin/env bash
# Usage: recursive-file-diff.sh DIR_A DIR_B
# Compares files present at the same relative paths under DIR_A and DIR_B.
# Exits with code 0 if no differences found, 1 if any differ, 2 on usage error.

set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 DIR_A DIR_B" >&2
  exit 2
fi

dirA=${1%/}   # strip trailing slash
dirB=${2%/}

if [ ! -d "$dirA" ]; then echo "Not a dir: $dirA" >&2; exit 2; fi
if [ ! -d "$dirB" ]; then echo "Not a dir: $dirB" >&2; exit 2; fi

# Collect all regular files in dirA and dirB, produce sorted unique relative paths
tmpA=$(mktemp)
tmpB=$(mktemp)
trap 'rm -f "$tmpA" "$tmpB"' EXIT

( cd "$dirA" && find . -type f -print | sed 's|^\./||' | sort ) > "$tmpA"
( cd "$dirB" && find . -type f -print | sed 's|^\./||' | sort ) > "$tmpB"

# Only compare paths that exist in both trees
comm -12 "$tmpA" "$tmpB" > /tmp/_common_paths.$$ || true
common=/tmp/_common_paths.$$

diff_found=0

while IFS= read -r rel; do
  fileA="$dirA/$rel"
  fileB="$dirB/$rel"

  # If either is not a regular file (shouldn't happen), skip
  if [ ! -f "$fileA" ] || [ ! -f "$fileB" ]; then
    echo "SKIP (missing/not-file): $rel"
    continue
  fi

  # For text files, show unified diff; for binaries, report cmp result.
  if file -b --mime-encoding "$fileA" | grep -qi binary || file -b --mime-encoding "$fileB" | grep -qi binary; then
    if ! cmp -s -- "$fileA" "$fileB"; then
      echo "BINARY DIFF: $rel"
      diff_found=1
    fi
  else
    # Use diff -u for human-readable unified diffs; suppress output if identical
    if ! diff -u --label "A/$rel" --label "B/$rel" -- "$fileA" "$fileB" > /dev/stdout 2>/dev/null; then
      # diff returns non-zero for differences; capture and print diff output
      diff -u --label "A/$rel" --label "B/$rel" -- "$fileA" "$fileB"
      echo "TEXT DIFF: $rel"
      diff_found=1
    fi
  fi
done < "$common"

rm -f "$common"

if [ "$diff_found" -eq 0 ]; then
  echo "No differences found for common files."
  exit 0
else
  echo "Differences found."
  exit 1
fi

