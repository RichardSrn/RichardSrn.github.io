if grep -q "^#http_proxy=" /etc/environment; then \
  sudo sed -i "s/^#http_proxy=/http_proxy=/" /etc/environment; \
  sudo sed -i "s/^#https_proxy=/https_proxy=/" /etc/environment; \
  sudo sed -i "s/^#ftp_proxy=/ftp_proxy=/" /etc/environment; \
fi
