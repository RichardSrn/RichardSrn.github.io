#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# USB speed report script
#
# Usage (example):
#   sudo ./usb_speed_report.sh /dev/sda /media/youruser/YourUsbMountPoint
#
# It will:
#   - Show USB link speed (lsusb -t)
#   - Measure read speed (hdparm)
#   - Measure write speed (dd 1 GiB)
#   - Print a short summary comparing to advertised:
#       * Read: up to 130 MB/s
#       * Write: up to 30 MB/s
###############################################################################

# Advertised speeds (from your box)
ADVERTISED_READ=130   # MB/s
ADVERTISED_WRITE=30   # MB/s

if [[ $# -ne 2 ]]; then
  echo "Usage: sudo $0 /dev/sdX /path/to/mountpoint"
  echo "Example: sudo $0 /dev/sda /media/myuser/MYUSB"
  exit 1
fi

DEV="$1"
MOUNTPOINT="$2"

if [[ ! -b "$DEV" ]]; then
  echo "ERROR: $DEV is not a block device."
  exit 1
fi

if [[ ! -d "$MOUNTPOINT" ]]; then
  echo "ERROR: mountpoint $MOUNTPOINT does not exist."
  exit 1
fi

echo "============================================================"
echo "USB SPEED TEST REPORT"
echo "============================================================"
echo
echo "Device under test: $DEV"
echo "Mountpoint:        $MOUNTPOINT"
echo

echo "------------------------------------------------------------"
echo "1) USB link speed (lsusb -t)"
echo "------------------------------------------------------------"
lsusb -t
echo

echo "------------------------------------------------------------"
echo "2) Read speed test (hdparm -tT $DEV)"
echo "------------------------------------------------------------"
# Capture hdparm output
HDPARM_OUTPUT=$(hdparm -tT "$DEV" 2>&1 || true)
echo "$HDPARM_OUTPUT"
echo

# Extract buffered disk reads MB/s from hdparm output if possible
# Line example: " Timing buffered disk reads: 436 MB in  3.01 seconds = 144.78 MB/sec"
READ_MBPS_RAW=$(echo "$HDPARM_OUTPUT" | awk '/buffered disk reads:/ {print $11}')
if [[ -z "${READ_MBPS_RAW:-}" ]]; then
  READ_MBPS="N/A"
else
  READ_MBPS="$READ_MBPS_RAW"
fi

echo "------------------------------------------------------------"
echo "3) Write speed test (dd 1 GiB)"
echo "   writes a temporary 1 GiB file to the USB stick."
echo "------------------------------------------------------------"
cd "$MOUNTPOINT"

# Run dd and capture its stderr (speed line) using 'time' is noisy; better parse dd output itself
DD_OUTPUT=$(dd if=/dev/zero of=testfile_usb_speed bs=1M count=1024 oflag=direct 2>&1 || true)
sync
echo "$DD_OUTPUT"
echo

# Extract write speed from dd output
# Typical line: "1073741824 bytes (1.1 GB, 1.0 GiB) copied, 624.254 s, 1.7 MB/s"
WRITE_MBPS_RAW=$(echo "$DD_OUTPUT" | awk '/copied/ {print $(NF-1)}')
if [[ -z "${WRITE_MBPS_RAW:-}" ]]; then
  WRITE_MBPS="N/A"
else
  WRITE_MBPS="$WRITE_MBPS_RAW"
fi

# Clean up test file
rm -f testfile_usb_speed || true

echo "------------------------------------------------------------"
echo "4) Summary and comparison to advertised speeds"
echo "------------------------------------------------------------"

echo "Advertised (box):"
echo "  - Read speed : up to ${ADVERTISED_READ} MB/s"
echo "  - Write speed: up to ${ADVERTISED_WRITE} MB/s"
echo

echo "Measured:"
echo "  - Read speed (hdparm): ${READ_MBPS} MB/s"
echo "  - Write speed (dd 1 GiB): ${WRITE_MBPS} MB/s"
echo

# If numeric, calculate percentage of advertised
calc_percent() {
  local measured="$1"
  local advertised="$2"
  awk -v m="$measured" -v a="$advertised" 'BEGIN { if (a>0) printf "%.1f", (m/a)*100; else print "N/A"; }'
}

if [[ "$READ_MBPS" != "N/A" ]]; then
  READ_PCT=$(calc_percent "$READ_MBPS" "$ADVERTISED_READ")
else
  READ_PCT="N/A"
fi

if [[ "$WRITE_MBPS" != "N/A" ]]; then
  WRITE_PCT=$(calc_percent "$WRITE_MBPS" "$ADVERTISED_WRITE")
else
  WRITE_PCT="N/A"
fi

echo "Relative to advertised 'up to' values:"
echo "  - Read:  ${READ_MBPS} MB/s  (~${READ_PCT}% of advertised 130 MB/s)"
echo "  - Write: ${WRITE_MBPS} MB/s  (~${WRITE_PCT}% of advertised 30 MB/s)"
echo

echo "============================================================"
echo "End of report"
echo "============================================================"
