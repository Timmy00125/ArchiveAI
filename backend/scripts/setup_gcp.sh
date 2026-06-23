#!/usr/bin/env bash
# Setup GCP infrastructure for ArchiveAI (Compute Engine only).
# The PostgreSQL database runs on Neon (or another managed Postgres+pgvector
# provider), NOT on Cloud SQL. This script only provisions the VM that runs the
# FastAPI backend and the Gemini/Vertex AI service account it uses.
#
# Run this ONCE from your local machine with gcloud installed.
# Make sure you have set your project first:
#   gcloud config set project YOUR_PROJECT_ID

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${REGION:-us-central1}"
ZONE="${ZONE:-us-central1-a}"
VM_NAME="${VM_NAME:-archiveai-backend}"

echo "========================================"
echo " GCP Infrastructure Setup (VM only)"
echo " Project: $PROJECT_ID"
echo " Region:  $REGION"
echo " DB:      Neon (managed Postgres + pgvector)"
echo "========================================"

# ── 1. Enable APIs ───────────────────────────────────────────────────────────
echo "[1/4] Enabling GCP APIs..."
gcloud services enable compute.googleapis.com \
  aiplatform.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com

# ── 2. Create service account ────────────────────────────────────────────────
echo "[2/4] Creating service account..."
SA_NAME="archiveai-backend-sa"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1; then
    echo "    Service account already exists."
else
    gcloud iam service-accounts create "$SA_NAME" \
        --display-name="ArchiveAI Backend Service Account"
fi

# Grant roles — only Gemini/Vertex AI access is needed (DB is external now).
echo "    Granting roles..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/aiplatform.user" --condition=None

# ── 3. Create Compute Engine VM ─────────────────────────────────────────────
echo "[3/4] Creating Compute Engine VM..."
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

# ── 4. Firewall rules ────────────────────────────────────────────────────────
echo "[4/4] Creating firewall rules..."
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
echo "  VM External IP: $VM_IP"
echo ""
echo "  Database: provisioned separately on Neon (https://neon.tech)"
echo "    - Create a Postgres project, enable pgvector:"
echo "        CREATE EXTENSION IF NOT EXISTS vector;"
echo "    - Note the connection string Neon gives you."
echo ""
echo "  Next steps:"
echo "  1. SSH into the VM:"
echo "     gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  2. Clone your repo into /opt/archiveai"
echo "  3. Create backend/.env with your Neon connection details:"
echo "       POSTGRES_HOST=ep-xxxx.<region>.aws.neon.tech"
echo "       POSTGRES_PORT=5432"
echo "       POSTGRES_USER=<neon user>"
echo "       POSTGRES_PASSWORD=<neon password>"
echo "       POSTGRES_DB=<neon db>"
echo "       GOOGLE_API_KEY=<your gemini key>"
echo "     (Neon requires SSL — add POSTGRES_SSLMODE=require if you wire it up)"
echo "  4. Run backend/deploy.sh on the VM"
echo ""
