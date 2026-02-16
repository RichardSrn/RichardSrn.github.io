#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Fedora USB preparation script (with separate /boot)
#
# Usage:
#   sudo ./prep_fedora_usb.sh /dev/sdX
#
# This will:
#   - Wipe /dev/sdX (after confirmation)
#   - Create GPT with 5 partitions:
#       1: 512 MiB  EFI System Partition (vfat)         -> /boot/efi
#       2: 1 GiB    /boot (ext4)                        -> /boot
#       3: 20 GiB   Fedora root (ext4)                  -> /
#       4: 8 GiB    LUKS2-secured storage (ext4 inside) -> /mnt/Secure (later)
#       5: rest     exFAT STORAGE                       -> /mnt/Storage (later)
#   - Configure LUKS2 on partition 4 with strong parameters
###############################################################################

### CONFIGURABLE PARAMETERS ####################################################

EFI_SIZE_MIB=512       # EFI System Partition size
BOOT_SIZE_GIB=1        # /boot partition size (GiB)
ROOT_SIZE_GIB=20       # Fedora root partition size (GiB)
SECURE_SIZE_GIB=8      # Secure LUKS partition size (GiB)

# LUKS settings
LUKS_NAME="secure_storage"
LUKS_TYPE="luks2"
LUKS_CIPHER="aes-xts-plain64"
LUKS_KEY_SIZE=512
LUKS_PBKDF="argon2id"
LUKS_PBKDF_MEMORY=524288    # KiB (512 MiB)
LUKS_PBKDF_PARALLEL=2
LUKS_PBKDF_TIME=2000        # ms (iter-time)
LUKS_HASH="sha256"          # default is fine; set explicitly

# Labels
LABEL_ESP="FEDORA-ESP"
LABEL_BOOT="FEDORA-BOOT"
LABEL_ROOT="FEDORA-ROOT"
LABEL_SECURE="SECURE-DATA"
LABEL_STORAGE="STORAGE"

###############################################################################

# ---- Helper functions -------------------------------------------------------

error() {
  echo "ERROR: $*" >&2
  exit 1
}

require_root() {
  if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root. Use: sudo $0 /dev/sdX"
  fi
}

check_dependencies() {
  local deps=(parted cryptsetup mkfs.vfat mkfs.ext4 blkid)
  for d in "${deps[@]}"; do
    command -v "$d" >/dev/null 2>&1 || error "Missing dependency: $d"
  done

  # exFAT tools
  if ! command -v mkfs.exfat >/dev/null 2>&1; then
    echo "exFAT tools (mkfs.exfat) not found. Installing exfatprogs..."
    apt-get update
    apt-get install -y exfatprogs
  fi
}

strong_passphrase_check() {
  local pass="$1"
  local len min_len=16
  len=${#pass}

  local has_upper=0 has_lower=0 has_digit=0 has_special=0

  [[ "$pass" =~ [A-Z] ]] && has_upper=1
  [[ "$pass" =~ [a-z] ]] && has_lower=1
  [[ "$pass" =~ [0-9] ]] && has_digit=1
  [[ "$pass" =~ [^A-Za-z0-9] ]] && has_special=1

  local score=0
  (( len >= min_len )) && ((score++))
  (( has_upper )) && ((score++))
  (( has_lower )) && ((score++))
  (( has_digit )) && ((score++))
  (( has_special )) && ((score++))

  # Return:
  # 0 = strong enough
  # 1 = weak (but user may accept)
  if (( score >= 4 )); then
    return 0
  else
    return 1
  fi
}

prompt_luks_passphrase() {
  local pass pass2
  while true; do
    echo "Enter LUKS passphrase for SECURED STORAGE (will not be echoed):"
    read -rs pass
    echo
    echo "Confirm LUKS passphrase:"
    read -rs pass2
    echo

    if [[ "$pass" != "$pass2" ]]; then
      echo "Passphrases do not match. Please try again."
      continue
    fi

    if [[ -z "$pass" ]]; then
      echo "Passphrase cannot be empty."
      continue
    fi

    if strong_passphrase_check "$pass"; then
      echo "Passphrase seems reasonably strong."
      LUKS_PASSPHRASE="$pass"
      break
    else
      echo "WARNING: Passphrase appears weak."
      echo "Recommended: at least 16 characters, mix of upper/lowercase, numbers, symbols."
      read -rp "Type 'ACCEPT' to use this weak passphrase anyway, or anything else to re-enter: " choice
      if [[ "$choice" == "ACCEPT" ]]; then
        LUKS_PASSPHRASE="$pass"
        break
      fi
    fi
  done
}

confirm_target_device() {
  local dev="$1"

  [[ -b "$dev" ]] || error "$dev is not a block device."

  echo "Target device: $dev"
  echo
  lsblk -o NAME,SIZE,MODEL,TRAN "$dev"
  echo

  # Size info
  local size_gib
  size_gib=$(lsblk -bno SIZE "$dev" | awk '{printf "%.2f", $1/1024/1024/1024}')

  echo "About to COMPLETELY WIPE $dev."
  echo "Current size: ${size_gib} GiB (all existing data will be lost)."
  echo "Type 'YES' to wipe the USB $dev and remove all existing data."
  read -rp "> " ans
  if [[ "$ans" != "YES" ]]; then
    echo "Aborting."
    exit 1
  fi
}

wipe_device() {
  local dev="$1"

  echo "Wiping existing filesystem signatures on $dev..."
  wipefs -a "$dev"
}

create_partitions() {
  local dev="$1"

  echo "Creating GPT partition table and partitions on $dev..."

  # Calculate MiB boundaries
  local start_esp end_esp
  local start_boot end_boot
  local start_root end_root
  local start_secure end_secure

  start_esp=1                              # MiB
  end_esp=$(( start_esp + EFI_SIZE_MIB ))  # 1 -> 513

  start_boot=$end_esp
  end_boot=$(( start_boot + BOOT_SIZE_GIB * 1024 ))   # next GiB

  start_root=$end_boot
  end_root=$(( start_root + ROOT_SIZE_GIB * 1024 ))

  start_secure=$end_root
  end_secure=$(( start_secure + SECURE_SIZE_GIB * 1024 ))

  # Partition 5 will go to 100% of disk
  parted --script "$dev" \
    mklabel gpt \
    unit MiB \
    mkpart ESP fat32 "${start_esp}" "${end_esp}" \
    set 1 esp on \
    mkpart Boot ext4 "${start_boot}" "${end_boot}" \
    mkpart FedoraRoot ext4 "${start_root}" "${end_root}" \
    mkpart SecureLinux ext4 "${start_secure}" "${end_secure}" \
    mkpart Storage ext4 "${end_secure}" 100%

  echo "Partition table created:"
  parted "$dev" print
}

format_filesystems_and_luks() {
  local dev="$1"
  local p1 p2 p3 p4 p5
  p1="${dev}1"
  p2="${dev}2"
  p3="${dev}3"
  p4="${dev}4"
  p5="${dev}5"

  echo "Formatting EFI partition ($p1) as FAT32..."
  mkfs.vfat -F32 -n "$LABEL_ESP" "$p1"

  echo "Formatting /boot partition ($p2) as ext4..."
  mkfs.ext4 -L "$LABEL_BOOT" -F "$p2"

  echo "Formatting Fedora root partition ($p3) as ext4..."
  mkfs.ext4 -L "$LABEL_ROOT" -F "$p3"

  echo "Configuring LUKS2 on secure partition ($p4)..."
  printf "%s" "$LUKS_PASSPHRASE" | cryptsetup luksFormat \
    --type "$LUKS_TYPE" \
    --cipher "$LUKS_CIPHER" \
    --key-size "$LUKS_KEY_SIZE" \
    --pbkdf "$LUKS_PBKDF" \
    --pbkdf-memory "$LUKS_PBKDF_MEMORY" \
    --pbkdf-parallel "$LUKS_PBKDF_PARALLEL" \
    --iter-time "$LUKS_PBKDF_TIME" \
    --hash "$LUKS_HASH" \
    "$p4" \
    --key-file=-

  echo "Opening LUKS container as /dev/mapper/$LUKS_NAME..."
  printf "%s" "$LUKS_PASSPHRASE" | cryptsetup open "$p4" "$LUKS_NAME" --key-file=-

  echo "Formatting secure LUKS volume (/dev/mapper/$LUKS_NAME) as ext4..."
  mkfs.ext4 -L "$LABEL_SECURE" -F "/dev/mapper/$LUKS_NAME"

  echo "Closing LUKS container..."
  cryptsetup close "$LUKS_NAME"

  echo "Formatting STORAGE partition ($p5) as exFAT..."
  mkfs.exfat -n "$LABEL_STORAGE" "$p5"

  echo "Filesystems and LUKS configuration completed."
}

print_summary_and_next_steps() {
  local dev="$1"
  local dev1="${dev}1"
  local dev2="${dev}2"
  local dev3="${dev}3"
  local dev4="${dev}4"
  local dev5="${dev}5"

  echo
  echo "==================================================================="
  echo "Fedora USB disk preparation COMPLETED on $dev"
  echo "==================================================================="
  echo
  echo "Partition layout:"
  lsblk -f "$dev"
  echo

  echo "Next steps to install Fedora:"
  echo
  echo "1. Create a separate Fedora Live USB installer from your ISO (if not"
  echo "   already done), for example:"
  echo "     sudo dd if=/path/to/Fedora-Workstation-Live-*.iso of=/dev/sdY bs=4M status=progress conv=fsync"
  echo "   (Replace /dev/sdY with your installer USB device.)"
  echo
  echo "2. Reboot your machine and boot from the Fedora Live USB (the installer)."
  echo
  echo "3. In the Fedora Live environment, run 'Install Fedora'."
  echo "   - Select language."
  echo "   - In 'Installation Destination':"
  echo "       * Select only $dev as the target."
  echo "       * Choose 'Custom' (manual) storage configuration."
  echo
  echo "4. In the custom storage screen, assign:"
  echo "   - Partition 1 ($dev1, label $LABEL_ESP):"
  echo "       * Mount point: /boot/efi"
  echo "       * Filesystem: vfat"
  echo "       * Reformat is fine (it's empty), or leave as is."
  echo
  echo "   - Partition 2 ($dev2, label $LABEL_BOOT):"
  echo "       * Mount point: /boot"
  echo "       * Filesystem: ext4"
  echo "       * Reformat is OK (disk is empty)."
  echo
  echo "   - Partition 3 ($dev3, label $LABEL_ROOT):"
  echo "       * Mount point: /"
  echo "       * Filesystem: ext4"
  echo "       * Reformat is OK (disk is empty)."
  echo
  echo "   - Partition 4 ($dev4, LUKS container):"
  echo "       * LEAVE UNUSED in the installer."
  echo "         (Already set up as LUKS + ext4 inside.)"
  echo
  echo "   - Partition 5 ($dev5, label $LABEL_STORAGE):"
  echo "       * LEAVE UNUSED in the installer (no mount point)."
  echo
  echo "5. Continue installation."
  echo "   - Create user:"
  echo "       Username: USER1"
  echo "       Password: USER1p@ss"
  echo "       Make USER1 an administrator (sudo)."
  echo "   - Hostname: fedora-usb"
  echo
  echo "6. After installation finishes:"
  echo "   - Reboot and boot from $dev (the USB OS)."
  echo
  echo "7. In Fedora, you can later:"
  echo "   - Unlock and mount SECURED STORAGE:"
  echo "       sudo cryptsetup open $dev4 $LUKS_NAME"
  echo "       sudo mkdir -p /mnt/Secure"
  echo "       sudo mount /dev/mapper/$LUKS_NAME /mnt/Secure"
  echo
  echo "   - Mount STORAGE partition:"
  echo "       sudo mkdir -p /mnt/Storage"
  echo "       sudo mount $dev5 /mnt/Storage"
  echo
  echo "If you want, I can help you craft /etc/crypttab and /etc/fstab entries"
  echo "inside Fedora once it's installed, based on the UUIDs from 'blkid'."
  echo
}

# ---- Main -------------------------------------------------------------------

main() {
  require_root
  check_dependencies

  if [[ $# -ne 1 ]]; then
    echo "Usage: sudo $0 /dev/sdX"
    exit 1
  fi

  local dev="$1"

  # Basic sanity: do not allow a partition (e.g. /dev/sda1)
  if [[ "$dev" =~ [0-9]$ ]]; then
    error "Please specify the whole disk (e.g. /dev/sda), not a partition (e.g. /dev/sda1)."
  fi

  confirm_target_device "$dev"
  prompt_luks_passphrase
  wipe_device "$dev"
  create_partitions "$dev"
  format_filesystems_and_luks "$dev"
  print_summary_and_next_steps "$dev"

  echo "All done."
}

main "$@"