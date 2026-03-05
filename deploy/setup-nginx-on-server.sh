#!/bin/bash
# Run this script on the VPS as root (e.g. paste into SSH session or: ssh root@217.177.72.69 'bash -s' < setup-nginx-on-server.sh)

set -e

echo "1. Installing nginx..."
apt update
apt install -y nginx

echo "2. Creating nginx config..."
cat > /etc/nginx/sites-available/kinomi << 'ENDCONF'
server {
    listen 80;
    server_name kinomi.ru www.kinomi.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
ENDCONF

echo "3. Enabling site..."
ln -sf /etc/nginx/sites-available/kinomi /etc/nginx/sites-enabled/kinomi

echo "4. Removing default site..."
rm -f /etc/nginx/sites-enabled/default

echo "5. Testing nginx config..."
nginx -t

echo "6. Restarting nginx..."
systemctl restart nginx

echo "7. Nginx status:"
systemctl status nginx --no-pager

echo "Done. Open http://kinomi.ru to reach the app on port 3000."
