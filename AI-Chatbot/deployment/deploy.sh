#!/bin/bash
# ==========================================================
# AI Chatbot Platform - Azure VM Deployment Script
# Run this on a fresh Ubuntu Server VM as:
#   chmod +x deploy.sh && sudo ./deploy.sh
# ==========================================================
set -e

# ── CONFIG ─────────────────────────────────────────────────
REPO_URL="https://github.com/rishabhkankariya/codealpha_tasks"
APP_DIR="/var/www/chatbot"
SERVICE_NAME="chatbot"
BACKEND_PORT=8000
# ───────────────────────────────────────────────────────────

echo ""
echo "=========================================================="
echo "  AI Chatbot Platform — Azure VM Deployment"
echo "=========================================================="
echo ""

# 1. System packages
echo "[1/6] Installing system packages..."
apt-get update -y -q
apt-get install -y -q python3 python3-pip python3-venv nginx curl git build-essential

# 2. Setup swap file (critical safeguard on 1 GB RAM — prevents OOM kills)
echo "[2/7] Configuring 2 GB swap file..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    # Make swap persistent across reboots
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "  Swap file created: $(free -h | grep Swap)"
else
    echo "  Swap file already exists, skipping."
fi

# 3. Clone repository
echo "[3/7] Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "  Directory exists — pulling latest changes..."
    cd "$APP_DIR"
    git pull
else
    git clone "$REPO_URL" /tmp/codealpha_tasks
    mkdir -p "$APP_DIR"
    cp -r /tmp/codealpha_tasks/AI-Chatbot/backend "$APP_DIR/"
    cp -r /tmp/codealpha_tasks/AI-Chatbot/deployment "$APP_DIR/"
    rm -rf /tmp/codealpha_tasks
fi

# 4. Python virtualenv + dependencies
echo "[4/7] Setting up Python environment..."
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip -q
echo "  Installing CPU-only PyTorch (memory optimized for 1 GB RAM)..."
pip install torch --no-cache-dir -q --index-url https://download.pytorch.org/whl/cpu
echo "  Installing app dependencies..."
pip install --no-cache-dir -q -r requirements.txt

# 5. Database initialisation & seeding
echo "[5/7] Initialising database and seeding default data..."
mkdir -p "$APP_DIR/backend/data"
python -c "from app.core.seeding import seed_database; seed_database()"

# 6. Systemd service
echo "[6/7] Configuring systemd service..."

# Write service file directly so the port and path are always correct
cat > /etc/systemd/system/${SERVICE_NAME}.service << EOF
[Unit]
Description=FastAPI AI Chatbot Platform Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=${APP_DIR}/backend
Environment="PATH=${APP_DIR}/backend/venv/bin"
Environment="SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
Environment="DATABASE_URL=sqlite:////${APP_DIR}/backend/data/chatbot.db"
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port ${BACKEND_PORT} --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}
echo "  Service '${SERVICE_NAME}' started on port ${BACKEND_PORT}."

# 7. Nginx configuration
echo "[7/7] Configuring Nginx reverse proxy..."

# Allow all Azure Security Group origins for CORS via Nginx
cat > /etc/nginx/sites-available/chatbot << 'EOF'
server {
    listen 80;
    server_name _;   # Replace _ with your VM public IP or domain

    # Health check
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }

    # Proxy all /api requests to FastAPI backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers — allow Cloudflare Pages frontend origin
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        if ($request_method = OPTIONS) {
            return 204;
        }
    }

    # FastAPI Swagger docs (optional — remove in production)
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_set_header Host $host;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;
}
EOF

ln -sf /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

# Final permissions
chown -R www-data:www-data "$APP_DIR"
chmod -R 775 "$APP_DIR/backend/data"

# ── DONE ───────────────────────────────────────────────────
VM_IP=$(curl -s ifconfig.me 2>/dev/null || echo "<your-vm-ip>")

echo ""
echo "=========================================================="
echo "  Deployment Complete!"
echo "=========================================================="
echo ""
echo "  Backend API :  http://${VM_IP}/api"
echo "  Swagger Docs:  http://${VM_IP}/docs"
echo "  Health Check:  http://${VM_IP}/health"
echo ""
echo "  Memory status:"
free -h | grep -E 'Mem|Swap'
echo ""
echo "  View logs   :  journalctl -u ${SERVICE_NAME} -f"
echo "  Restart svc :  systemctl restart ${SERVICE_NAME}"
echo ""
echo "  ⚠️  HTTPS REQUIRED for Cloudflare Pages!"
echo "  Browsers block HTTP API calls from HTTPS frontends (mixed content)."
echo ""
echo "  Option A — Point a domain/subdomain to this VM IP:"
echo "    e.g. api.yourdomain.com → ${VM_IP}"
echo "    Then set: VITE_API_URL=https://api.yourdomain.com/api"
echo ""
echo "  Option B — Use Cloudflare Tunnel (free, no domain needed):"
echo "    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/"
echo ""
echo "  DO NOT use plain http:// with Cloudflare Pages — it will fail in browsers."
echo ""
echo "=========================================================="
