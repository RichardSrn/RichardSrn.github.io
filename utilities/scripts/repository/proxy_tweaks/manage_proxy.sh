#!/bin/bash

# Configuration
PROXY_URL="http://cache.univ-st-etienne.fr:3128/"
NO_PROXY_VAL="localhost,127.0.0.1,0.0.0.0,ujmse.local,univ-st-etienne.fr"
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
    # Update /etc/environment
    sed -i "/^#\?no_proxy=/d" $ENV_FILE
    sed -i "/^#\?NO_PROXY=/d" $ENV_FILE
    sed -i "/^#\?http_proxy=/d" $ENV_FILE
    sed -i "/^#\?https_proxy=/d" $ENV_FILE
    sed -i "/^#\?ftp_proxy=/d" $ENV_FILE
    sed -i "/^#\?HTTP_PROXY=/d" $ENV_FILE
    sed -i "/^#\?HTTPS_PROXY=/d" $ENV_FILE
    sed -i "/^#\?FTP_PROXY=/d" $ENV_FILE

    echo "http_proxy=\"$PROXY_URL\"" >> $ENV_FILE
    echo "https_proxy=\"$PROXY_URL\"" >> $ENV_FILE
    echo "ftp_proxy=\"$PROXY_URL\"" >> $ENV_FILE
    echo "HTTP_PROXY=\"$PROXY_URL\"" >> $ENV_FILE
    echo "HTTPS_PROXY=\"$PROXY_URL\"" >> $ENV_FILE
    echo "FTP_PROXY=\"$PROXY_URL\"" >> $ENV_FILE
    echo "no_proxy=\"$NO_PROXY_VAL\"" >> $ENV_FILE
    echo "NO_PROXY=\"$NO_PROXY_VAL\"" >> $ENV_FILE
    
    # Update APT
    echo "Acquire::http::Proxy \"$PROXY_URL\";" > $APT_FILE
    echo "Acquire::https::Proxy \"$PROXY_URL\";" >> $APT_FILE
    
    # Update Systemd
    mkdir -p $(dirname $SYSTEMD_CONF)
    echo -e "[Manager]\nDefaultEnvironment=\"HTTP_PROXY=$PROXY_URL\" \"HTTPS_PROXY=$PROXY_URL\" \"FTP_PROXY=$PROXY_URL\" \"NO_PROXY=$NO_PROXY_VAL\"" > $SYSTEMD_CONF
}

disable_proxy() {
    echo "Disabling proxy settings..."
    # Remove lines from /etc/environment
    sed -i "/^#\?http_proxy=/d" $ENV_FILE
    sed -i "/^#\?https_proxy=/d" $ENV_FILE
    sed -i "/^#\?ftp_proxy=/d" $ENV_FILE
    sed -i "/^#\?HTTP_PROXY=/d" $ENV_FILE
    sed -i "/^#\?HTTPS_PROXY=/d" $ENV_FILE
    sed -i "/^#\?FTP_PROXY=/d" $ENV_FILE
    sed -i "/^#\?no_proxy=/d" $ENV_FILE
    sed -i "/^#\?NO_PROXY=/d" $ENV_FILE
    
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