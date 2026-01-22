#!/usr/bin/env bash
# swap-selection-clipboard.sh
# Behavior:
# - clipboard -> temporary
# - primary selection (selected text) -> clipboard (removes selection)
# - paste temporary (old clipboard) at cursor

TMPFILE="$(mktemp)"
# read clipboard into tmp
xclip -selection clipboard -o > "$TMPFILE" 2>/dev/null || printf "" > "$TMPFILE"

# read primary (current selection) and move it to clipboard
xclip -selection primary -o 2>/dev/null | xclip -selection clipboard -i

# Clear visual selection in most apps by sending Escape (best-effort)
# then paste old clipboard (from TMPFILE) with Ctrl+V
# Note: some apps use Shift+Insert; we use Ctrl+V which works in GUI text fields.
sleep 0.02
xdotool key --clearmodifiers Escape
sleep 0.02

# Type paste (Ctrl+V) — use clipboard paste
xdotool key --clearmodifiers ctrl+v

# remove tmp
rm -f "$TMPFILE"

