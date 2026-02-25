# GitHub Secrets Configuration

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

## Required Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxx` |
| `NEXTAUTH_SECRET` | Random string for JWT encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your site's URL | `https://help.venturehome.com` |
| `ALLOWED_DOMAIN` | Domain restriction for sign-in | `venturehome.com` |
| `VM_HOST` | GCP VM IP address | `34.139.8.36` |
| `VM_USER` | SSH username | `goodspeed` or `ubuntu` |
| `VM_SSH_KEY` | Private SSH key for deployment | Full private key content |

## Setup Steps

### 1. Generate SSH Key for Deployment

On your local machine:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
# Don't set a passphrase (or use empty)
```

### 2. Add Public Key to VM

```bash
ssh-copy-id -i ~/.ssh/github_actions.pub user@34.139.8.36
```

### 3. Add Private Key to GitHub

Copy the private key:
```bash
cat ~/.ssh/github_actions
```

Paste into GitHub secret `VM_SSH_KEY` (the entire content including `-----BEGIN OPENSSH PRIVATE KEY-----`)

### 4. Google OAuth Setup

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://help.venturehome.com/api/auth/callback/google`
4. Copy Client ID and Secret to GitHub secrets

### 5. Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy output to GitHub secret `NEXTAUTH_SECRET`

## Manual Deployment (First Time)

If you prefer to set up manually first:

```bash
ssh your-vm
sudo mkdir -p /opt/agora-studio
sudo chown $USER:$USER /opt/agora-studio
cd /opt/agora-studio
git clone https://github.com/VentureHomeSolarLLC/agora-studio.git .
cd site
npm install

# Create env file
nano .env.local
# Add all environment variables

npm run build
npm install -g pm2
pm2 start npm --name "agora-studio" -- start
pm2 save
pm2 startup
```
