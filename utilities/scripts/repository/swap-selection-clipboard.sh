#!/usr/bin/env bash
# swap-selection-clipboard.sh
# Goal: Exchange current text selection with clipboard content.
#
# Logic:
# 1. Capture current selection (PRIMARY)
# 2. Re-paste the CLIPBOARD onto the selection (replaces it)
# 3. Set the CLIPBOARD to the old PRIMARY content

# 1. Capture current PRIMARY selection
# If nothing is selected, xclip might fail or return empty.
OLD_SELECTION=$(xclip -o -selection primary 2>/dev/null)

# 2. If PRIMARY was empty, we might not want to do anything, 
# or we just paste clipboard at cursor.
# Let's proceed with pasting clipboard regardless.

# Small sleep to ensure the capture is finished before we trigger keys
sleep 0.05

# 3. Paste CLIPBOARD content
# This replaces the current selection in most GUI applications.
xdotool key --clearmodifiers ctrl+v

# 4. Small sleep to allow the application to process the paste
sleep 0.1

# 5. Set CLIPBOARD to the OLD_SELECTION
if [ -n "$OLD_SELECTION" ]; then
    echo -n "$OLD_SELECTION" | xclip -i -selection clipboard
    # Optional notification (requires libnotify-bin)
    if command -v notify-send >/dev/null; then
        notify_icon="edit-paste"
        # Truncate text for notification
        display_text=$(echo "$OLD_SELECTION" | head -c 50 | sed 's/$/.../')
        notify-send -i "$notify_icon" "Selection Swapped" "Clipboard now contains: $display_text" -t 1500
    fi
fi

