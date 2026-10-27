#!/usr/bin/env bash
#
# One-time server setup for the public demo instance (demo.recode.devwiles.online).
# Run it as a sudo-capable user on the server; safe to run again.
#
#   ssh <your-server> 'bash -s' < scripts/setup-demo-server.sh
#
# The demo lives entirely under /home/recode/demo with its own database, port,
# systemd unit and secret, so it never touches the real site's prod.db.
# After this, every push to main deploys the demo along with the real site.
#
set -euo pipefail

DEMO=/home/recode/demo
DOMAIN=demo.recode.devwiles.online
PORT=3201

# 1. Directories and environment. An existing demo.env is kept so its secret stays valid
sudo -u recode mkdir -p "$DEMO/data" "$DEMO/logs"
if ! sudo test -f "$DEMO/demo.env"; then
  SECRET=$(openssl rand -hex 32)
  sudo -u recode bash -c "umask 077; cat > $DEMO/demo.env" <<EOF
NODE_ENV=production
PORT=$PORT
HOSTNAME=127.0.0.1
DATABASE_URL=file:$DEMO/data/demo.db
AUTH_SECRET=$SECRET
DEMO_MODE=1
EOF
  echo "created $DEMO/demo.env"
fi

# 2. systemd unit. Only enabled here; the first deploy puts the app in place and starts it
sudo tee /etc/systemd/system/recode-demo.service >/dev/null <<EOF
[Unit]
Description=ReCode public demo (DEMO_MODE) for $DOMAIN
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=recode
WorkingDirectory=$DEMO/app
EnvironmentFile=$DEMO/demo.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
# The least important service on the box: first to go when memory runs out
OOMScoreAdjust=+600
MemoryMax=512M
StandardOutput=append:$DEMO/logs/demo.log
StandardError=append:$DEMO/logs/demo.err.log
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable recode-demo

# 3. Let the deploy user restart only this unit (a separate file; recode-deploy is untouched)
TMP=$(mktemp)
echo 'recode ALL=(root) NOPASSWD: /usr/bin/systemctl restart recode-demo, /usr/bin/systemctl start recode-demo, /usr/bin/systemctl stop recode-demo, /usr/bin/systemctl status recode-demo' >"$TMP"
sudo visudo -cf "$TMP"
sudo install -m 0440 -o root -g root "$TMP" /etc/sudoers.d/recode-demo-deploy
rm -f "$TMP"

# 4. nginx site, then HTTPS via certbot (which rewrites the block and adds the 80 -> 443 redirect)
if [ ! -f /etc/nginx/sites-available/recode-demo ]; then
  sudo tee /etc/nginx/sites-available/recode-demo >/dev/null <<EOF
server {
    server_name $DOMAIN;
    error_page 502 503 504 /maintenance.html;
    location = /maintenance.html {
        root /home/recode;
        internal;
    }
    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade    \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
        client_max_body_size 5m;
    }
    access_log /var/log/nginx/recode-demo.access.log;
    error_log  /var/log/nginx/recode-demo.error.log;
    listen 80;
    listen [::]:80;
}
EOF
fi
sudo ln -sfn /etc/nginx/sites-available/recode-demo /etc/nginx/sites-enabled/recode-demo
sudo nginx -t
sudo systemctl reload nginx

if ! sudo test -d "/etc/letsencrypt/live/$DOMAIN"; then
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --redirect
fi

echo "demo server ready: push to main (or re-run the Deploy ReCode workflow) to put the app in place"
