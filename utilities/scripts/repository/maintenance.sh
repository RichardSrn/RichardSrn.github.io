#!/bin/bash

# =============================================================================
#  ULTIMATE UBUNTU MAINTENANCE SCRIPT
#  Author: (Your Name)
#  Description: robust updates, cleanup (Apt, Snap, Flatpak, Docker), and logging.
# =============================================================================

# --- Configuration ---
LOG_FILE="/var/log/system_maintenance.log"
DATE_STAMP=$(date "+%Y-%m-%d %H:%M:%S")

# --- Colors for UI ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Setup Logging ---
# Redirect stdout and stderr to both the console and the log file
exec > >(tee -a "$LOG_FILE") 2>&1

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}   STARTING SYSTEM MAINTENANCE: $DATE_STAMP   ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check for Root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}[ERROR] This script must be run as root.${NC}"
   exit 1
fi

# Function: Section Header
print_header() {
    echo -e "\n${YELLOW}>>> $1...${NC}"
}

# Function: Success Message
print_success() {
    echo -e "${GREEN}[OK] $1${NC}"
}

# --- 1. Network Check ---
print_header "Checking Internet Connectivity"
if ping -q -c 1 -W 1 google.com >/dev/null; then
    print_success "Internet is online."
else
    echo -e "${RED}[ERROR] No internet connection. Aborting updates.${NC}"
    exit 1
fi

# --- 2. APT (Debian/Ubuntu) Maintenance ---
print_header "Updating APT Repositories"
apt update

print_header "Upgrading System Packages (includes Ubuntu Pro if attached)"
# DEBIAN_FRONTEND=noninteractive prevents popups during upgrade
DEBIAN_FRONTEND=noninteractive apt full-upgrade -y
print_success "Packages upgraded."

print_header "Cleaning up Orphaned Packages (Autoremove)"
apt autoremove -y
print_success "Orphans removed."

print_header "Cleaning APT Cache"
apt clean
print_success "Cache cleared."

# --- 3. Ubuntu Pro Check ---
if command -v pro &> /dev/null; then
    PRO_STATUS=$(pro status | grep "Status" | awk '{print $2}')
    if [ "$PRO_STATUS" == "Attached" ]; then
        echo -e "${GREEN}[INFO] Ubuntu Pro is ATTACHED. ESM updates were applied above.${NC}"
    else
        echo -e "${YELLOW}[INFO] Ubuntu Pro is NOT attached. You may be missing ESM security updates.${NC}"
    fi
fi

# --- 4. Snap Maintenance ---
if command -v snap &> /dev/null; then
    print_header "Refreshing Snap Packages"
    snap refresh
    
    print_header "Removing Old Snap Revisions (Space Saver)"
    # Clean up old versions of snaps (keeps strictly the current one)
    snap list --all | awk '/disabled/{print $1, $3}' |
        while read pkg revision; do
            snap remove "$pkg" --revision="$revision"
        done
    print_success "Snap maintenance complete."
fi

# --- 5. Flatpak Maintenance ---
if command -v flatpak &> /dev/null; then
    print_header "Updating Flatpak Packages"
    flatpak update -y
    
    print_header "Removing Unused Flatpak Runtimes"
    flatpak uninstall --unused -y
    print_success "Flatpak maintenance complete."
fi

# --- 6. Docker Maintenance (Developer Focused) ---
if command -v docker &> /dev/null; then
    print_header "Cleaning Docker Dangling Images"
    # Removes only "dangling" images (untagged, intermediate layers). Safe for most devs.
    docker image prune -f
    print_success "Docker dangling images removed."
else
    echo -e "${BLUE}[INFO] Docker not found, skipping.${NC}"
fi

# --- 7. Python Health Check (Reporting Only) ---
print_header "Checking for Outdated Python Packages (User Space)"
# We do NOT auto-upgrade to prevent breaking system tools or dev environments.
# We check the user who invoked sudo to see their packages.
ACTUAL_USER=$(logname 2>/dev/null || echo $SUDO_USER)
if [ -n "$ACTUAL_USER" ]; then
    echo -e "${BLUE}Listing outdated pip packages for user: $ACTUAL_USER${NC}"
    # Run pip list as the actual user, not root
    sudo -u "$ACTUAL_USER" python3 -m pip list --outdated 2>/dev/null || echo "Pip check failed or no pip installed."
else
    echo "Could not detect actual user for pip check."
fi
echo -e "${YELLOW}[NOTE] We do NOT auto-upgrade Python packages to avoid breaking dependencies.${NC}"

# --- 8. General System Cleanup ---
print_header "Vacuuming Systemd Journal Logs (Last 10 Days)"
journalctl --vacuum-time=10d

print_header "Emptying Trash for User ($ACTUAL_USER)"
if [ -n "$ACTUAL_USER" ]; then
    rm -rf /home/"$ACTUAL_USER"/.local/share/Trash/*
    print_success "Trash emptied."
fi

# --- 9. Final Summary ---
DISK_USAGE_AFTER=$(df -h / | grep / | awk '{ print $4 }')

echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}   MAINTENANCE COMPLETE!   ${NC}"
echo -e "${BLUE}   Free Disk Space: $DISK_USAGE_AFTER   ${NC}"
echo -e "${BLUE}   Log saved to: $LOG_FILE   ${NC}"
echo -e "${BLUE}======================================================${NC}"