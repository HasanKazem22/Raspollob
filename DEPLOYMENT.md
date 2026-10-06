# Deployment (CI/CD)

One repository, two branches, automatic deploys to one VPS.

| Branch    | What happens on push                                   | Site                                   |
|-----------|--------------------------------------------------------|----------------------------------------|
| `develop` | Checks run → images built → **staging** updated        | `https://staging.raspollob.com`        |
| `main`    | Checks run → images built → **production** updated     | `https://raspollob.com`                |
| Pull request into either | Checks only (nothing deployed)          | —                                      |

**Checks** = backend build + all tests (against a throwaway database), frontend type-check + production build.
If any check fails, nothing is deployed.

## Daily workflow

```bash
git checkout develop
# ...work...
git add -A && git commit -m "Add product sizes"
git push                    # → staging updates in ~5 minutes
```

When staging looks good, open a **Pull Request `develop` → `main`** on GitHub and merge it. Production updates automatically.

## How a release works

```
push ─► GitHub Actions ─► tests pass ─► build Docker images ─► push to ghcr.io
                                                            └► SSH to VPS: docker compose pull && up -d
                                                               └► waits until the site answers, else the run fails
```

On the VPS each environment runs two containers (`server` = Spring Boot, `gui` = Next.js) behind Nginx.
Uploaded product photos are kept in a Docker volume, so they survive every deploy.

```
Internet ─► Nginx (80/443) ─┬─ /api/*, /uploads/* ─► server container (127.0.0.1:8085 | staging 8086)
                            └─ everything else    ─► gui container    (127.0.0.1:3000 | staging 3001)
```

---

## One-time setup

### 1. Put the code on GitHub

1. Create an **empty private** repository on GitHub, e.g. `raspollob` (no README, no .gitignore).
2. From this folder:

```bash
git remote add origin https://github.com/<you>/raspollob.git
git push -u origin main
git push -u origin develop
```

3. **Settings → Branches → Add rule** for `main`:
   - Require a pull request before merging
   - Require status checks to pass: *Backend · build & test*, *Frontend · type-check & build*

### 2. Prepare the VPS (Ubuntu 22.04/24.04)

```bash
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sudo sh

# A deploy user that may run Docker
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy

# Folders for both environments
sudo mkdir -p /opt/raspollob/production /opt/raspollob/staging
sudo chown -R deploy:deploy /opt/raspollob

# Nginx + free HTTPS
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 3. SSH key for GitHub Actions

On your own computer:

```bash
ssh-keygen -t ed25519 -f raspollob-deploy -C "github-actions" -N ""
```

- Put the **public** key (`raspollob-deploy.pub`) on the VPS in `/home/deploy/.ssh/authorized_keys`.
- The **private** key (`raspollob-deploy`) goes into GitHub as a secret (next step). Then delete both local copies.

### 4. GitHub secrets and environments

**Settings → Secrets and variables → Actions → New repository secret:**

| Secret         | Value                                   |
|----------------|-----------------------------------------|
| `VPS_HOST`     | VPS IP address or hostname              |
| `VPS_USER`     | `deploy`                                |
| `VPS_SSH_KEY`  | Full contents of the private key file   |
| `VPS_PORT`     | SSH port (only if not 22)               |

**Settings → Environments:** create `production` and `staging`.
In each, add a variable `APP_URL` (e.g. `https://raspollob.com`).
Optional: on `production`, add yourself under *Required reviewers* to approve every live release.

### 5. Environment files on the VPS

Copy `deploy/env.example` to both folders and fill them in:

```bash
nano /opt/raspollob/production/.env   # APP_ENV=production, IMAGE_TAG=main,    GUI_PORT=3000, SERVER_PORT=8085
nano /opt/raspollob/staging/.env      # APP_ENV=staging,    IMAGE_TAG=develop, GUI_PORT=3001, SERVER_PORT=8086
chmod 600 /opt/raspollob/*/.env
```

- Use a **separate database for staging**: in Neon, create a branch (e.g. `staging`) and use its connection details.
- Generate a **new JWT secret** for each environment: `openssl rand -base64 48`.

### 6. Nginx and HTTPS

1. Point your domain's DNS (`raspollob.com`, `www`, `staging`) to the VPS IP.
2. Then:

```bash
sudo cp deploy/nginx/raspollob-proxy.conf /etc/nginx/snippets/
sudo cp deploy/nginx/raspollob.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/raspollob.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d raspollob.com -d www.raspollob.com -d staging.raspollob.com
```

(Edit the domain names in `raspollob.conf` first if yours are different.)

### 7. First deploy

Push to `develop` (or run the workflow manually from the **Actions** tab). Watch it in **Actions → CI/CD**.

---

## Everyday operations (on the VPS)

```bash
cd /opt/raspollob/production
docker compose ps                     # status
docker compose logs -f server         # live backend logs
docker compose restart server         # restart backend
```

**Roll back** to an earlier release: find the commit id in GitHub, then

```bash
cd /opt/raspollob/production
IMAGE_TAG=<commit-id> docker compose up -d
```

## Local development (unchanged)

- Backend: secrets live in `server/.env` (git-ignored). Run from the `server` folder: `./mvnw spring-boot:run`
- Frontend: `cd gui && npm run dev` (talks to `http://localhost:8085`)

## Security notes

- No passwords or keys are stored in the repository; `.env` files are git-ignored.
- Before going live, change the password of the seeded admin account (`admin123`).
