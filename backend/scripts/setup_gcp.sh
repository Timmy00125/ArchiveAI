#!/usr/bin/env bash
# Setup GCP infrastructure for ArchiveAI
# Run this ONCE from your local machine with gcloud installed.
# Make sure you have set your project first:
#   gcloud config set project YOUR_PROJECT_ID

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
VM_NAME="${VM_NAME:-archiveai-backend}"
SQL_INSTANCE="${SQL_INSTANCE:-archiveai-postgres}"
DB_NAME="${DB_NAME:-archiveai_chat}"
DB_USER="${DB_USER:-archiveai}"

echo "========================================"
echo " GCP Infrastructure Setup"
echo " Project: $PROJECT_ID"
echo " Region:  $REGION"
echo "========================================"

# ── 1. Enable APIs ───────────────────────────────────────────────────────────
echo "[1/6] Enabling GCP APIs..."
gcloud services enable compute.googleapis.com \
  sqladmin.googleapis.com \
  aiplatform.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com

# ── 2. Create service account ────────────────────────────────────────────────
echo "[2/6] Creating service account..."
SA_NAME="archiveai-backend-sa"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
    echo "    Service account already exists."
else
    gcloud iam service-accounts create "$SA_NAME" \
        --display-name="ArchiveAI Backend Service Account"
fi

# Grant roles
echo "    Granting roles..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/aiplatform.user" --condition=None

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudsql.client" --condition=None

# ── 3. Create Cloud SQL instance ─────────────────────────────────────────────
echo "[3/6] Creating Cloud SQL PostgreSQL instance..."
if gcloud sql instances describe "$SQL_INSTANCE" >/dev/null 2>&1; then
    echo "    Cloud SQL instance already exists."
else
    echo "    Creating instance (this may take a few minutes)..."
    gcloud sql instances create "$SQL_INSTANCE" \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region="$REGION" \
        --storage-size=10GB \
        --storage-auto-increase \
        --availability-type=zonal
fi

# Get SQL connection info
SQL_IP=$(gcloud sql instances describe "$SQL_INSTANCE" --format='value(ipAddresses[].ipAddress)' | head -1)
echo "    Cloud SQL IP: $SQL_IP"

# ── 4. Create database and user ────────────────────────────────────────────
echo "[4/6] Creating database and user..."
# Generate a random password
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)}"

gcloud sql databases create "$DB_NAME" --instance="$SQL_INSTANCE" 2>/dev/null || echo "    Database already exists."
gcloud sql users create "$DB_USER" --instance="$SQL_INSTANCE" --password="$DB_PASSWORD" 2>/dev/null || echo "    User already exists."

# Enable pgvector
echo "    Enabling pgvector extension..."
gcloud sql instances patch "$SQL_INSTANCE" --database-flags=cloudsql.enable_pgvector=on 2>/dev/null || true

# ── 5. Create Compute Engine VM ─────────────────────────────────────────────
echo "[5/6] Creating Compute Engine VM..."
if gcloud compute instances describe "$VM_NAME" --zone="$ZONE" >/dev/null 2>&1; then
    echo "    VM already exists."
else
    gcloud compute instances create "$VM_NAME" \
        --zone="$ZONE" \
        --machine-type=e2-medium \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=30GB \
        --tags=archiveai-backend \
        --service-account="$SA_EMAIL" \
        --scopes=cloud-platform
fi

VM_IP=$(gcloud compute instances describe "$VM_NAME" --zone="$ZONE" --format='value(networkInterfaces[0].accessConfigs[0].natIP)')
echo "    VM External IP: $VM_IP"

# ── 6. Firewall rules ────────────────────────────────────────────────────────
echo "[6/6] Creating firewall rules..."
gcloud compute firewall-rules create archiveai-allow-http \
    --allow tcp:80,tcp:443 \
    --target-tags=archiveai-backend \
    --description="Allow HTTP/HTTPS for ArchiveAI" 2>/dev/null || echo "    HTTP rule already exists."

gcloud compute firewall-rules create archiveai-allow-ssh \
    --allow tcp:22 \
    --target-tags=archiveai-backend \
    --description="Allow SSH for ArchiveAI" 2>/dev/null || echo "    SSH rule already exists."

echo ""
echo "========================================"
echo " Infrastructure setup complete!"
echo "========================================"
echo ""
echo "  Cloud SQL IP:   $SQL_IP"
echo "  VM External IP: $VM_IP"
echo "  DB Password:    $DB_PASSWORD"
echo ""
echo "  Next steps:"
echo "  1. Authorize VM IP in Cloud SQL connections"
echo "     (or use Cloud SQL Auth Proxy)"
echo "  2. SSH into the VM:"
echo "     gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  3. Clone your repo and run backend/deploy.sh"
echo ""
echo "  Your .env DB_HOST should be: $SQL_IP"
echo "  Your .env DB_PASSWORD should be: $DB_PASSWORD"
echo ""
