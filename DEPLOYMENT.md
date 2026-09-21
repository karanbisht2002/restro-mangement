# Deploying to AWS EC2

This application runs as one Node.js service. Express serves both the compiled React application and the `/api` endpoints. Nginx provides the public domain and HTTPS.

## DNS and AWS networking

1. Create an `A` record for `restro.bindasstech.com` pointing to the EC2 public IP or Elastic IP.
2. In the instance security group, allow inbound TCP ports `80` and `443` from anywhere.
3. Keep port `4000` closed to the internet. Nginx is the only public entry point.

## Install server packages

On Ubuntu, connect over SSH and install Node.js 22, Nginx, Git, and Certbot:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git certbot python3-certbot-nginx postgresql-client
```

## Deploy the application

```bash
sudo mkdir -p /var/www
sudo chown "$USER":"$USER" /var/www
cd /var/www
git clone <your-repository-url> restro-management
cd restro-management
npm ci
cp .env.example .env
```

Edit `.env` on the server. Set a real PostgreSQL `DATABASE_URL`, set `DATABASE_SSL=true` for RDS or other managed PostgreSQL providers that require TLS, and set real PayU credentials only when ready. Do not commit `.env`.

```bash
nano .env
npm run build
```

## Initialize the database

Run the migrations once against the PostgreSQL database configured in `.env`. This requires the `DATABASE_URL` value to be available in your shell.

```bash
set -a
source .env
set +a
for migration in database/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"; done
```

Do not repeat a migration that has already been applied to a production database.

## Configure the service and domain

Replace `ubuntu` in `deploy/restro-management.service` if the EC2 login user is different.

```bash
sudo cp deploy/restro-management.service /etc/systemd/system/restro-management.service
sudo cp deploy/nginx-restro.bindasstech.com.conf /etc/nginx/sites-available/restro.bindasstech.com
sudo ln -s /etc/nginx/sites-available/restro.bindasstech.com /etc/nginx/sites-enabled/restro.bindasstech.com
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl daemon-reload
sudo systemctl enable --now restro-management
sudo systemctl reload nginx
```

## Enable HTTPS

Run this only after the DNS record resolves to the EC2 instance:

```bash
sudo certbot --nginx -d restro.bindasstech.com --redirect
```

## Verify

```bash
curl http://127.0.0.1:4000/api/health
sudo systemctl status restro-management
sudo journalctl -u restro-management -f
```

Open `https://restro.bindasstech.com` after Certbot succeeds.

## Updating a deployment

```bash
cd /var/www/restro-management
git pull
npm ci
npm run build
sudo systemctl restart restro-management
```
