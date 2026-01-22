echo "get file"
# wget -v --output-file=/home/legmint/Downloads/Ankama\ Launcher-Setup-x86_64.AppImage --input-file=https://launcher.cdn.ankama.com/installers/production/Ankama%20Launcher-Setup-x86_64.AppImage
wget https://launcher.cdn.ankama.com/installers/production/Ankama%20Launcher-Setup-x86_64.AppImage
echo "move file"
# mv ~/Downloads/Ankama\ Launcher-Setup-x86_64.AppImage /usr/bin/Ankama\ Launcher-Setup-x86_64.AppImage
mv "Ankama Launcher-Setup-x86_64.AppImage" "/usr/bin/Ankama Launcher-Setup-x86_64.AppImage"
echo "chmod +777"
chmod +777 "/usr/bin/Ankama Launcher-Setup-x86_64.AppImage"
echo "Done."
