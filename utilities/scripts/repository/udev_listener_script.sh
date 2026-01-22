#!/bin/bash

exec /lib/systemd/systemd-udevd --daemon
systemctl start usbethernet.service
