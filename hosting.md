# GCP Hosting Guide for ArchiveAI

This guide explains how to host the **ArchiveAI backend and database on Google Cloud Platform (GCP)** in a way that is:

- **cheap enough for prototypes and demos**
- **simple to manage**
- **good enough for light usage**
- **easy to improve later when you want to scale**

It is written specifically for this repository.

---

## 1. What this project needs

From the current codebase, the backend depends on the following:

- A **FastAPI backend** in `backend/` (entrypoint: `src.main:app`)
- A **PostgreSQL database** for:
  - chat history and session storage
  - vector embeddings (via **pgvector** extension)
- **Persistent local storage** for:
  - uploaded files (`UPLOAD_DIR`)
  - generated markdown files (`MARKDOWN_DIR`)
  - document structure JSON files (`STRUCTURE_DIR`)
- **Google Vertex AI / Gemini** for LLM + embeddings

Important details from this project:

- The backend uses PostgreSQL via these settings:
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
  - `POSTGRES_HOST`
  - `POSTGRES_PORT`
- Vectors are stored in PostgreSQL using pgvector (configured via `PGVECTOR_COLLECTION`)
- The backend stores local files in:
  - `UPLOAD_DIR` → uploaded source documents
  - `MARKDOWN_DIR` → extracted/generated markdown
  - `STRUCTURE_DIR` → Docling document structure JSON
- The backend expects:
  - `GOOGLE_CLOUD_PROJECT`
  - `GOOGLE_CLOUD_LOCATION`
- The backend API prefix is `/api/v1`
- Health endpoint is `/health`

Because this project uses **pgvector inside PostgreSQL**, all vector data lives in Cloud SQL alongside relational data — no separate vector database or local vector index is needed.

### Recommended prototype architecture

For a prototype/demo deployment, use:

- **Compute Engine VM** for the backend app
- **Cloud SQL for PostgreSQL** for the relational database
- **Vertex AI** for Gemini and embeddings
- Optional later:
  - domain name
  - HTTPS reverse proxy with Nginx
  - frontend hosted separately on Vercel or Firebase Hosting

This is the best fit because:

- your backend writes uploads, markdown, and structure files to disk locally
- pgvector stores embeddings inside Cloud SQL — no separate vector DB to manage
- setup is straightforward without redesigning storage for stateless hosting

---

## 2. Cheapest practical GCP setup

For demos and early prototypes, I recommend this:

### Option A — Recommended

- **1 small Ubuntu VM** for the backend + uploaded files + local artifacts
- **1 small Cloud SQL PostgreSQL instance** for chat/session data + pgvector embeddings

This gives you:

- cheap monthly cost compared with more complex infra
- managed PostgreSQL backups and easier DB administration
- enough stability for demos

### Option B — Cheapest possible, but less safe

- **1 Ubuntu VM** for backend
- **PostgreSQL installed on the same VM**

This is the absolute cheapest setup, but I do **not** recommend it if:

- you care about easy backups
- you want fewer operational risks
- you want cleaner separation between app and database

For your use case, **Option A is the sweet spot**.

---

## 3. Estimated cost expectation

Costs change by region and time, but for a lightweight prototype, the main cost drivers are:

- VM runtime
- Cloud SQL runtime
- disk size
- outbound network traffic
- Vertex AI usage

To keep cost low:

- choose a low-cost region like `us-central1`
- use a **small VM**
- use a **small PostgreSQL instance**
- keep disk sizes modest
- shut the VM down when you are not demoing, if acceptable
- keep uploaded documents small and clean old files periodically

A prototype stack usually stays relatively affordable compared with production-grade deployments, but **Vertex AI usage can become the unpredictable part** if many documents are embedded repeatedly.

---

## 4. Final architecture you should use

Use this setup:

1. **Frontend**
   - Host separately if you want, for example on Vercel
   - Point it to the GCP backend URL

2. **Backend**
   - Run FastAPI on a GCE Ubuntu VM
   - Use `uvicorn` behind `nginx` or expose it directly for early testing

3. **Database**
   - Use Cloud SQL PostgreSQL with the **pgvector** extension enabled
   - Stores chat history, session data, and vector embeddings all together

4. **Local persistent files on VM disk**
   - `./data/uploads`
   - `./data/markdown`
   - `./data/structures`

5. **AI services**
   - Use Vertex AI with the VM service account

---

## 5. Before you start

Make sure you have:

- a GCP account
- billing enabled
- a GCP project created
- permission to create:
  - Compute Engine VMs
  - Cloud SQL instances
  - service accounts
  - firewall rules
  - Vertex AI resources
- `gcloud` CLI installed locally
- this repository pushed to GitHub or available on your machine

You should also decide:

- the GCP project ID
- the region, preferably `us-central1`
- whether frontend will be hosted separately

---

## 6. Create or choose a GCP project

If you do not already have a project:

1. Open GCP Console
2. Create a new project
3. Give it a name like `archiveai-demo`
4. Note the **Project ID**

Example values used in this guide:

- **Project name:** `archiveai-demo`
- **Project ID:** `archiveai-demo-123456`
- **Region:** `us-central1`
- **Zone:** `us-central1-a`

Set your local CLI to that project:

```bash
gcloud config set project YOUR_PROJECT_ID
```

---

## 7. Enable required GCP APIs

Enable the services this project needs:

```bash
gcloud services enable compute.googleapis.com \
  sqladmin.googleapis.com \
  aiplatform.googleapis.com \
  iam.googleapis.com
```

What each one is for:

- `compute.googleapis.com` → VM hosting
- `sqladmin.googleapis.com` → Cloud SQL
- `aiplatform.googleapis.com` → Vertex AI / Gemini
- `iam.googleapis.com` → service accounts and IAM roles

---

## 8. Create the Cloud SQL PostgreSQL database

This project uses PostgreSQL for chat/session history, so create that first.

### Step 8.1 Create a PostgreSQL instance

Use a small instance appropriate for demos.

In the GCP Console:

1. Go to **Cloud SQL**
2. Click **Create Instance**
3. Choose **PostgreSQL**
4. Set:
   - Instance ID: `archiveai-postgres`
   - Password: choose a strong password
   - Region: `us-central1`
5. For machine size, choose a small shared-core option suitable for prototypes
6. Set storage to a modest amount such as 10–20 GB
7. Create the instance

### Step 8.2 Create the app database and user

Inside Cloud SQL:

1. Open your instance
2. Create a database:
   - Name: `archiveai_chat`
3. Create a user:
   - Username: `archiveai`
   - Password: use a strong password

Record these values safely:

- `POSTGRES_DB=archiveai_chat`
- `POSTGRES_USER=archiveai`
- `POSTGRES_PASSWORD=...`

**Important:** After creating the database, enable the `pgvector` extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This extension is required — the backend uses it to store and query document embeddings. Cloud SQL supports pgvector natively on PostgreSQL 15+.

### Step 8.3 Choose connectivity method

For prototype deployments, use **Private IP if you are comfortable with VPC setup**, otherwise use **Public IP with authorized access locked down to your VM**.

For simplicity, this guide assumes:

- **Cloud SQL public IP enabled**
- access restricted so only your VM can connect

Later, you can migrate to private IP.

---

## 9. Create the Compute Engine VM

This VM will run:

- FastAPI backend
- local file storage for uploads, markdown, and document structures

### Step 9.1 Pick VM size

For prototypes and demos, start with:

- OS: **Ubuntu 22.04 LTS**
- machine type: **e2-small** or **e2-medium**
- boot disk: **20–30 GB standard persistent disk**

Recommendation:

- start with **`e2-medium`** if document processing feels heavy
- use **`e2-small`** only if budget is the strongest concern

Doc processing, embeddings, and file parsing may feel tight on very small machines, so `e2-medium` is often the safer demo choice.

### Step 9.2 Create the VM

Example with `gcloud`:

```bash
gcloud compute instances create archiveai-backend \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --tags=archiveai-backend
```

### Step 9.3 Assign a service account to the VM

The backend uses Vertex AI. The cleanest approach is to let the VM authenticate using a service account.

Create a service account:

```bash
gcloud iam service-accounts create archiveai-backend-sa \
  --display-name="ArchiveAI Backend Service Account"
```

Grant it the minimum roles needed to start:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:archiveai-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

If you plan to connect through the Cloud SQL Auth Proxy, also grant:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:archiveai-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

Attach the service account to the VM. If creating from the console, select it during creation. If updating after creation, attach it from the VM settings in the console.

---

## 10. Open the necessary firewall ports

You only need a few ports.

### For early testing

- `22` for SSH
- `8000` if exposing uvicorn directly

### Better approach

- `22` for SSH
- `80` for HTTP
- `443` for HTTPS
- keep `8000` internal only

For a prototype, you can begin with `8000`, then later add Nginx.

Example firewall rule for temporary direct API access:

```bash
gcloud compute firewall-rules create archiveai-allow-8000 \
  --allow tcp:8000 \
  --target-tags=archiveai-backend \
  --description="Allow ArchiveAI backend on port 8000"
```

---

## 11. Connect to the VM and install dependencies

SSH into the VM:

```bash
gcloud compute ssh archiveai-backend --zone=us-central1-a
```

Then install system packages:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip git nginx
```

You may also need build tools for some Python packages:

```bash
sudo apt install -y build-essential
```

---

## 12. Copy the project to the VM

You have two common options.

### Option 1: Clone from GitHub

```bash
git clone YOUR_REPOSITORY_URL
cd ArchiveAI
```

### Option 2: Copy files manually

If the project is local only, copy it with `gcloud compute scp` or push it to GitHub first.

For simplicity and repeatability, **GitHub is better**.

---

## 13. Prepare the backend on the VM

Move into the backend directory:

```bash
cd ~/ArchiveAI/backend
```

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Upgrade pip and install dependencies:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 14. Create the backend environment file

This project already expects a `.env` file in `backend/`.

Create it:

```bash
nano ~/ArchiveAI/backend/.env
```

Use something like this:

```env
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1

GEMINI_MODEL=gemini-2.5-flash
GEMINI_VISION_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004

PGVECTOR_COLLECTION=documents

CHUNK_SIZE=1000
CHUNK_OVERLAP=100
SEARCH_K=8

MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=./data/uploads
MARKDOWN_DIR=./data/markdown
STRUCTURE_DIR=./data/structures

POSTGRES_USER=archiveai
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
POSTGRES_DB=archiveai_chat
POSTGRES_HOST=YOUR_CLOUD_SQL_IP_OR_HOST
POSTGRES_PORT=5432

CORS_ORIGINS=http://localhost:3000,http://YOUR_VM_EXTERNAL_IP:3000,https://YOUR_FRONTEND_DOMAIN
```

### Notes for this project

- `POSTGRES_PORT` should be **`5432`** for Cloud SQL PostgreSQL, not `5433`
  - `5433` is only used in your local Docker Compose mapping
- `PGVECTOR_COLLECTION` names the pgvector collection inside PostgreSQL (default: `documents`)
- `UPLOAD_DIR`, `MARKDOWN_DIR`, and `STRUCTURE_DIR` stay local on the VM
- Vector embeddings are stored in PostgreSQL via pgvector — no separate vector DB directory needed
- if your frontend is hosted elsewhere, add its real URL to `CORS_ORIGINS`

---

## 15. Create the local storage directories

This project writes files locally, so create those directories now:

```bash
mkdir -p ~/ArchiveAI/backend/data/uploads
mkdir -p ~/ArchiveAI/backend/data/markdown
mkdir -p ~/ArchiveAI/backend/data/structures
```

These hold:

- uploaded source documents
- markdown extracted/generated from documents
- document structure JSON files from Docling parsing

Vector embeddings are stored in PostgreSQL (pgvector), so no local vector directory is needed.

---

## 16. Test database connectivity

Before starting the backend, confirm PostgreSQL works.

If using Cloud SQL public IP:

- make sure the VM external IP is authorized in Cloud SQL networking settings
- or use the Cloud SQL Auth Proxy instead

For a quick test, install PostgreSQL client:

```bash
sudo apt install -y postgresql-client
```

Then test:

```bash
psql "postgresql://archiveai:YOUR_DB_PASSWORD@YOUR_CLOUD_SQL_IP:5432/archiveai_chat"
```

If it connects successfully, exit with:

```bash
\q
```

---

## 17. Start the backend manually first

Run the app from the backend directory:

```bash
cd ~/ArchiveAI/backend
source .venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Now test from your browser or terminal:

```bash
curl http://YOUR_VM_EXTERNAL_IP:8000/health
```

You should see JSON health output.

Also open Swagger docs:

```text
http://YOUR_VM_EXTERNAL_IP:8000/docs
```

If this works, your deployment is basically functional.

---

## 18. Run the backend as a systemd service

Do not rely on a manual terminal process for demos. Use `systemd`.

Create a service file:

```bash
sudo nano /etc/systemd/system/archiveai.service
```

Paste this:

```ini
[Unit]
Description=ArchiveAI FastAPI Backend
After=network.target

[Service]
User=$USER
WorkingDirectory=/home/YOUR_VM_USERNAME/ArchiveAI/backend
Environment="PATH=/home/YOUR_VM_USERNAME/ArchiveAI/backend/.venv/bin"
ExecStart=/home/YOUR_VM_USERNAME/ArchiveAI/backend/.venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Replace `YOUR_VM_USERNAME` with the actual Linux username.

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable archiveai
sudo systemctl start archiveai
```

Check status:

```bash
sudo systemctl status archiveai
```

Check logs:

```bash
journalctl -u archiveai -f
```

---

## 19. Put Nginx in front of the backend

For demos, Nginx makes the deployment cleaner and easier to evolve.

Create an Nginx config:

```bash
sudo nano /etc/nginx/sites-available/archiveai
```

Paste:

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 60M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/archiveai /etc/nginx/sites-enabled/archiveai
sudo nginx -t
sudo systemctl restart nginx
```

Now your backend should be accessible at:

```text
http://YOUR_VM_EXTERNAL_IP/
```

And docs at:

```text
http://YOUR_VM_EXTERNAL_IP/docs
```

---

## 20. Optional but recommended: add HTTPS

For public demos, HTTPS is better.

If you have a domain pointed at the VM:

1. Install Certbot
2. Request a Let’s Encrypt certificate
3. Configure Nginx automatically

Commands:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

If you do not have a domain yet, you can stay on HTTP temporarily for internal demos.

---

## 21. Configure Cloud SQL access safely

You have two ways to connect the backend to Cloud SQL.

### Option 1: Public IP + authorized networks

This is simpler for a prototype.

Steps:

1. Open Cloud SQL instance
2. Enable public IP
3. Add your VM external IP to authorized networks
4. Use that Cloud SQL IP as `POSTGRES_HOST`

Pros:

- simpler
- fast to set up

Cons:

- less elegant than private connectivity
- slightly more operational exposure if misconfigured

### Option 2: Cloud SQL Auth Proxy

This is cleaner and safer, and still reasonable for prototypes.

If you want the more reliable approach, install the Cloud SQL Auth Proxy on the VM and connect locally.

Then your backend can use:

```env
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
```

This is a good improvement if you expect to keep the prototype alive for a while.

---

## 22. Recommended environment values for this project

For this repository, these values make sense on GCP:

```env
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
GEMINI_VISION_MODEL=gemini-2.5-flash
GEMINI_EMBED_MODEL=text-embedding-004
PGVECTOR_COLLECTION=documents
CHUNK_SIZE=1000
CHUNK_OVERLAP=100
SEARCH_K=8
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=./data/uploads
MARKDOWN_DIR=./data/markdown
STRUCTURE_DIR=./data/structures
POSTGRES_USER=archiveai
POSTGRES_PASSWORD=YOUR_DB_PASSWORD
POSTGRES_DB=archiveai_chat
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

---

## 23. How frontend should connect to this backend

Your frontend is a Next.js app in `frontend/`.

You can host it separately, which is often easiest and cheapest:

- **Vercel** for the frontend
- **GCP VM** for the backend

Then point the frontend API base URL to:

```text
http://YOUR_VM_EXTERNAL_IP/api/v1
```

or preferably:

```text
https://api.yourdomain.com/api/v1
```

Make sure the backend `CORS_ORIGINS` includes the frontend domain.

---

## 24. How to deploy updates later

When you change backend code:

1. SSH into the VM
2. Pull latest code
3. Activate the virtualenv
4. Install any new dependencies
5. Restart the service

Example:

```bash
cd ~/ArchiveAI
git pull
cd backend
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart archiveai
```

---

## 25. Backups and persistence notes

This is very important for this project.

### What lives in PostgreSQL

- chat history
- session data
- **vector embeddings** (pgvector) — all indexed document chunks
- relational persistence handled by `chat_service`

### What lives on VM disk

- uploaded source documents
- markdown output
- document structure JSON files

That means:

- **Cloud SQL backups now cover everything important** — chat history, sessions, AND vector embeddings are all in PostgreSQL
- uploaded files, markdown artifacts, and structure files live on the VM disk
- if the VM disk is lost, you can re-upload and re-index documents from source files

### Minimum backup recommendation

- **Enable automated Cloud SQL backups** — this protects your chat history, sessions, and vector index all at once
- Periodically back up these directories from the VM if the source files matter:
  - `backend/data/uploads`
  - `backend/data/markdown`
  - `backend/data/structures`

You can later sync VM artifacts to a GCS bucket if needed.

---

## 26. Cost-saving tips specific to this project

To keep hosting cheap:

1. Use **one small VM** only
2. Use a **small Cloud SQL PostgreSQL instance** (pgvector runs inside it — no extra service)
3. Keep documents small during demos
4. Delete old uploads you no longer need
5. Reuse indexed documents instead of re-uploading repeatedly
6. Prefer `gemini-2.5-flash` for cheaper inference
7. Shut down the VM outside demo periods if uptime is not required
8. Avoid overprovisioning disk
9. Do not move to Kubernetes yet
10. Do not move to load balancers yet

### Biggest hidden cost risk

For this project, the likely hidden cost is **embedding/regeneration activity**, not just the VM itself.

If users keep uploading many large documents repeatedly, costs can rise from:

- document parsing work
- embeddings generation (Vertex AI charges per 1,000 characters embedded)
- repeated re-indexing
- large pgvector indexes increasing Cloud SQL storage usage

---

## 27. What not to do yet

For your current stage, avoid these unless you really need them:

- GKE / Kubernetes
- multi-zone setup
- autoscaling microservices
- separate vector database (pgvector in Cloud SQL is already sufficient)
- separate worker queues
- Cloud Run without redesigning storage

These add complexity without helping much for demos.

---

## 28. When you should upgrade this architecture

You should revisit the architecture when:

- many users are uploading documents at once
- the VM CPU or RAM becomes a bottleneck
- you need better uptime
- local disk storage becomes risky
- you want stateless deployments and faster rollbacks

At that point, a better architecture would be something like:

- Cloud Run or GKE for backend
- Cloud SQL for PostgreSQL (with pgvector — this already scales well)
- Cloud Storage for uploaded files, markdown artifacts, and structure files

But that is **not necessary yet** for your current prototype goal.

---

## 29. Recommended deployment checklist

Use this checklist when deploying:

- [ ] GCP project created
- [ ] Billing enabled
- [ ] Compute Engine API enabled
- [ ] Cloud SQL Admin API enabled
- [ ] Vertex AI API enabled
- [ ] Cloud SQL PostgreSQL created
- [ ] `pgvector` extension enabled (`CREATE EXTENSION IF NOT EXISTS vector`)
- [ ] DB name `archiveai_chat` created
- [ ] DB user `archiveai` created
- [ ] VM created
- [ ] VM service account configured
- [ ] `roles/aiplatform.user` granted
- [ ] backend code copied to VM
- [ ] Python venv created
- [ ] `pip install -r requirements.txt` completed
- [ ] `.env` created in `backend/`
- [ ] storage directories created (`data/uploads`, `data/markdown`, `data/structures`)
- [ ] backend starts successfully
- [ ] `/health` responds correctly (should show `"backend": "pgvector"`)
- [ ] systemd service enabled
- [ ] Nginx configured
- [ ] CORS updated for frontend
- [ ] Cloud SQL connectivity confirmed

---

## 30. My recommended final choice for ArchiveAI

For **ArchiveAI as it exists today**, my recommendation is:

- **Backend:** Google Compute Engine VM
- **Database:** Cloud SQL for PostgreSQL (with pgvector for embeddings)
- **AI:** Vertex AI
- **Frontend:** host separately, ideally Vercel
- **Persistence for prototype:** Cloud SQL for all relational + vector data; local VM disk for uploads, markdown, and structures

This is the best balance of:

- low cost
- low complexity
- compatibility with your current code (pgvector in PostgreSQL)
- Cloud SQL backups cover all critical data (chat + vectors)

---

## 31. Quick start summary

If you want the short version, do this:

1. Create a GCP project
2. Enable Compute Engine, Cloud SQL, Vertex AI APIs
3. Create a small Cloud SQL PostgreSQL instance
4. Enable the `pgvector` extension on the database
5. Create a small Ubuntu VM
6. Attach a service account with Vertex AI access
7. Clone this repo onto the VM
8. Install Python + dependencies
9. Create `backend/.env`
10. Point PostgreSQL config to Cloud SQL
11. Create `data/uploads`, `data/markdown`, and `data/structures` directories
12. Run `uvicorn src.main:app --host 0.0.0.0 --port 8000`
13. Test `/health` (should show `"backend": "pgvector"`)
14. Put it behind `systemd`
15. Add Nginx
16. Optionally add HTTPS

---

## 32. Future improvements you can add later

Once the prototype is stable, the next best improvements are:

1. move uploaded files, markdown artifacts, and structure files to **Google Cloud Storage**
2. use **Cloud SQL Auth Proxy** instead of public IP
3. add **HTTPS with a real domain**
4. add **basic authentication or API protection**
5. add scheduled backups for local upload/markdown/structure directories
6. pgvector in Cloud SQL already scales well — consider index tuning (IVFFlat/HNSW) before migrating to a separate vector DB

---

## 33. Important project-specific warning

This application stores **all critical data in PostgreSQL** (chat history, sessions, and pgvector embeddings).

Only transient artifacts live on the VM disk:

- uploaded source files
- generated markdown
- document structure JSON

So for a **prototype/demo**, this setup is perfectly reasonable — Cloud SQL backups protect everything that matters.

For **serious production usage**, you should eventually move file artifacts to Cloud Storage so the VM itself becomes stateless and replaceable.

---

## 34. Conclusion

For this repository, the most practical GCP hosting strategy is:

- **Compute Engine VM** for the backend and local file artifacts
- **Cloud SQL PostgreSQL** for relational data and pgvector embeddings
- **Vertex AI** for Gemini models and embeddings

It is cheap, simple, and works with your current code without major changes. All critical data (chat history, sessions, vectors) lives in Cloud SQL where automated backups protect it.

If you want, the next useful step after this guide would be one of these:

1. I can also write a **`backend/Dockerfile` + `deploy.sh`** for this GCP VM setup
2. I can write a **`systemd` service file and Nginx config** directly into the repo
3. I can help you create a **Cloud Run version later** after refactoring storage
