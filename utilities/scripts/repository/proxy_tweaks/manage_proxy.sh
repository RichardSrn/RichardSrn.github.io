#!/bin/bash

# Configuration
PROXY_URL="http://cache.univ-st-etienne.fr:3128/"
ENV_FILE="/etc/environment"
APT_FILE="/etc/apt/apt.conf.d/95proxies"
SYSTEMD_CONF="/etc/systemd/system.conf.d/proxy.conf"

# Ensure script is run with sudo
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo)"
   exit 1
fi

enable_proxy() {
    echo "Enabling proxy settings..."
    # Uncomment lines in /etc/environment
    sed -i 's/^#\(http_proxy=\)/\1/' $ENV_FILE
    sed -i 's/^#\(https_proxy=\)/\1/' $ENV_FILE
    sed -i 's/^#\(ftp_proxy=\)/\1/' $ENV_FILE
    
    # Update APT
    echo "Acquire::http::Proxy \"$PROXY_URL\";" > $APT_FILE
    echo "Acquire::https::Proxy \"$PROXY_URL\";" >> $APT_FILE
    
    # Update Systemd
    mkdir -p $(dirname $SYSTEMD_CONF)
    echo -e "[Manager]\nDefaultEnvironment=\"HTTP_PROXY=$PROXY_URL\" \"HTTPS_PROXY=$PROXY_URL\" \"FTP_PROXY=$PROXY_URL\"" > $SYSTEMD_CONF
}

disable_proxy() {
    echo "Disabling proxy settings..."
    # Comment lines in /etc/environment
    sed -i 's/^\(http_proxy=\)/#\1/' $ENV_FILE
    sed -i 's/^\(https_proxy=\)/#\1/' $ENV_FILE
    sed -i 's/^\(ftp_proxy=\)/#\1/' $ENV_FILE
    
    # Remove APT and Systemd configs
    rm -f $APT_FILE
    rm -f $SYSTEMD_CONF
}

apply_updates() {
    echo "Applying configuration system-wide..."
    # Reload systemd manager
    systemctl daemon-reexec
    
    # Optional: Restart specific services that need the proxy
    # systemctl restart snapd.service
    
    echo "System-wide update complete."
    echo "Note: To update your current shell, run: source_proxy"
}

case "$1" in
    --proxyON)
        enable_proxy
        apply_updates
        ;;
    --proxyOFF)
        disable_proxy
        apply_updates
        ;;
    --update)
        apply_updates
        ;;
    *)
        echo "Usage: $0 {--proxyON|--proxyOFF|--update}"
        exit 1
esac