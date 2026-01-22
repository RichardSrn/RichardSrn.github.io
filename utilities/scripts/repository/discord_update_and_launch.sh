#!/bin/bash

# --- Configuration ---
# The official download URL that redirects to the specific .deb version
UPDATE_URL="https://discord.com/api/download/stable?platform=linux&format=deb"
# The standard path where the actual Discord binary lives
REAL_DISCORD_BIN="/usr/share/discord/Discord"
TEMP_DEB="/tmp/discord-update.deb"

# --- Functions ---

get_remote_version() {
    # 1. Hit the update URL (headers only) to get the redirect location
    # 2. Extract the filename from the 'location' header
    # 3. Parse the version number X.X.XX from 'discord-X.X.XX.deb'
    curl -sI "$UPDATE_URL" | grep -i "^location:" | grep -oP 'discord-\K[0-9.]+(?=\.deb)'
}

get_local_version() {
    # Get the installed version from dpkg
    dpkg-query -W -f='${Version}\n' discord 2>/dev/null
}

# --- Main Logic ---

echo "Checking for Discord updates..."

# Get versions
REMOTE_VER=$(get_remote_version)
LOCAL_VER=$(get_local_version)

# Sanity check: If we have no internet or parsing failed, just try to launch app
if [ -z "$REMOTE_VER" ]; then
    echo "⚠ Could not fetch remote version. Starting Discord anyway..."
    nohup "$REAL_DISCORD_BIN" >/dev/null 2>&1 &
    exit 0
fi

# Compare Versions
if [ "$REMOTE_VER" != "$LOCAL_VER" ]; then
    echo "-----------------------------------------------------"
    echo "Update Required!"
    echo "Installed: $LOCAL_VER"
    echo "Available: $REMOTE_VER"
    echo "-----------------------------------------------------"
    
    # Ask for password upfront so the token is cached for the install step
    echo "🔑 Please enter your password to authorize the update:"
    if sudo -v; then
        echo "⬇ Downloading update..."
        # Download to /tmp (overwrite existing)
        wget -O "$TEMP_DEB" "$UPDATE_URL" -q --show-progress

        echo "📦 Installing update..."
        # -y flag accepts prompts automatically
        sudo apt install -y "$TEMP_DEB"

        # Cleanup
        rm "$TEMP_DEB"
        echo "✅ Update complete."
    else
        echo "❌ Authentication failed or cancelled. Attempting to launch old version..."
    fi
else
    echo "✅ Discord is up to date ($LOCAL_VER)."
fi

echo "🚀 Launching Discord..."

# setsid runs the command in a new session. 
# This detaches it completely from the terminal's control.
setsid "$REAL_DISCORD_BIN" >/dev/null 2>&1 &

# Give it a brief moment to initialize before we kill the terminal
sleep 2

exit 0
