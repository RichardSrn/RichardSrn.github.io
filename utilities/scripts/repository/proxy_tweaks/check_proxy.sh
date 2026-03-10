#!/bin/bash

usb_id="0bda:8153"
usb_connected=false

# Check if the USB identified as 1abb:7756 is connected
if lsusb | grep -q "$usb_id"; then
    usb_connected=true
fi

# Run proxyon if USB is connected, else run proxyoff
if $usb_connected; then
    /home/$USER/Documents/script/proxyon_script.sh
else
    /home/$USER/Documents/script/proxyoff_script.sh
fi
