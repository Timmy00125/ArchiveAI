#!/usr/bin/env bash
# Deploy ArchiveAI backend to a fresh GCP Ubuntu VM
# Run this script on the VM after cloning the repo.

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/archiveai}"
BACKEND_DIR="$PROJECT_DIR/backend"
USER="${USER:-$(whoami)}"

echo "========================================"
echo " ArchiveAI Backend Deploy Script"
echo "========================================"

# ── 1. System dependencies ───────────────────────────────────────────────────
echo "[1/9] Installing system packages..."
sudo apt-get update -y
sudo apt-get install -y \
    python3 python3-venv python3-pip \
    python3-dev build-essential \
    libpq-dev \
    git curl nginx \
    postgresql-client

# ── 2. Create app directory ────────────────────────────────────────────────
echo "[2/9] Setting up application directory..."
sudo mkdir -p "$PROJECT_DIR"
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "    Project already exists. Pulling latest changes..."
    cd "$PROJECT_DIR"
    git pull
else
    echo "    ERROR: Please clone your repo into $PROJECT_DIR first."
    echo "    Example: git clone https://github.com/YOUR_USER/ArchiveAI.git $PROJECT_DIR"
    exit 1
fi

# ── 3. Python virtual environment ──────────────────────────────────────────
echo "[3/9] Creating Python virtual environment..."
cd "$BACKEND_DIR"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# ── 4. Create data directories ─────────────────────────────────────────────
echo "[4/9] Creating local storage directories..."
mkdir -p data/uploads data/markdown data/structures

# ── 5. Environment file ────────────────────────────────────────────────────
echo "[5/9] Checking environment file..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "    WARNING: No .env file found."
    echo "    Please copy .env.production to .env and configure it:"
    echo "    cp $BACKEND_DIR/.env.production $BACKEND_DIR/.env"
    echo "    nano $BACKEND_DIR/.env"
    echo ""
    echo "    Then re-run this script or start the service manually."
    exit 1
fi

# ── 6. Test database connectivity ──────────────────────────────────────────
echo "[6/9] Testing database connectivity..."
set +u
source "$BACKEND_DIR/.env"
PG_URI="${POSTGRES_URI:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}}"
set -u
if command -v psql >/dev/null 2>&1; then
    if psql "$PG_URI" -c "SELECT 1;" >/dev/null 2>&1; then
        echo "    Database connection OK."
    else
        echo "    WARNING: Could not connect to PostgreSQL."
        echo "    Please check your .env and your database provider (e.g. Neon)."
        echo "    Continuing anyway — the app will retry at startup."
    fi
else
    echo "    psql not available, skipping DB connectivity test."
fi

# ── 7. Install systemd service ─────────────────────────────────────────────
echo "[7/9] Installing systemd service..."
sudo cp "$BACKEND_DIR/config/systemd/archiveai.service" /etc/systemd/system/archiveai.service

# Replace placeholder user and paths in the service file
sudo sed -i "s|User=archiveai|User=$USER|g" /etc/systemd/system/archiveai.service
sudo sed -i "s|/opt/archiveai|$PROJECT_DIR|g" /etc/systemd/system/archiveai.service
sudo systemctl daemon-reload
sudo systemctl enable archiveai

# ── 8. Install nginx config ──────────────────────────────────────────────────
echo "[8/9] Installing nginx configuration..."
sudo cp "$BACKEND_DIR/config/nginx/archiveai" /etc/nginx/sites-available/archiveai
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/archiveai /etc/nginx/sites-enabled/archiveai
sudo nginx -t
sudo systemctl restart nginx

# ── 9. Start the backend ───────────────────────────────────────────────────
echo "[9/9] Starting ArchiveAI backend service..."
sudo systemctl start archiveai

echo ""
echo "========================================"
echo " Deployment complete!"
echo "========================================"
echo ""
echo "  Health check:  http://$(curl -s ifconfig.me)/health"
echo "  API docs:      http://$(curl -s ifconfig.me)/docs"
echo ""
echo "  Check service status:"
echo "    sudo systemctl status archiveai"
echo ""
echo "  View logs:"
echo "    sudo journalctl -u archiveai -f"
echo ""
