#!/bin/bash

# Generate a random number between 420 and 720 seconds (7 to 12 minutes)
RANDOM_SECONDS=$((RANDOM % 301 + 420))

# Calculate the shutdown time in minutes and seconds
SHUTDOWN_TIME=$(date -d "+$RANDOM_SECONDS seconds" +"%H:%M")
CURRENT_TIME=$(date +"%H:%M")

# Display the time when the shutdown will occur in a zenity dialog
zenity --info --text="<big><big>The system will shut down in $((RANDOM_SECONDS / 60)) minutes and $((RANDOM_SECONDS % 60)) seconds at $SHUTDOWN_TIME.</big></big>" --timeout=10 --width=400

# Run the shutdown command with the specified time in seconds
shutdown -t $RANDOM_SECONDS

# Log the command execution and shutdown time
LOG_FILE="./shutdown_log.txt"
echo "$CURRENT_TIME ; $SHUTDOWN_TIME" > "$LOG_FILE"
