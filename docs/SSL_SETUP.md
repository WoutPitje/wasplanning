# SSL Certificate Setup Guide

## Overview

This guide explains how to set up SSL certificates for your WasPlanning deployment with any domain.

## Prerequisites

- Domain name pointing to your server
- Server accessible on ports 80 and 443
- Docker deployment running

## Option 1: Let's Encrypt (Recommended)

### Automatic Setup with Certbot

1. **Install Certbot**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install epel-release
sudo yum install certbot python3-certbot-nginx
```

2. **Stop Nginx temporarily** (to allow Certbot to bind to port 80):
```bash
docker-compose -f docker-compose.prod.yml stop nginx
```

3. **Obtain certificates** for your domains:
```bash
# Replace variables with your actual domain configuration
source .env.production

sudo certbot certonly --standalone \
  -d ${API_SUBDOMAIN}.${BASE_DOMAIN} \
  -d ${APP_SUBDOMAIN}.${BASE_DOMAIN} \
  -d ${STORAGE_SUBDOMAIN}.${BASE_DOMAIN} \
  -d ${MONITOR_SUBDOMAIN}.${BASE_DOMAIN} \
  --email ${SSL_EMAIL} \
  --agree-tos \
  --no-eff-email
```

4. **Start Nginx**:
```bash
docker-compose -f docker-compose.prod.yml start nginx
```

### Automatic Renewal

1. **Test renewal**:
```bash
sudo certbot renew --dry-run
```

2. **Set up automatic renewal** (cron job):
```bash
# Add to root's crontab
sudo crontab -e

# Add this line
0 3 * * * certbot renew --quiet --post-hook "cd /opt/wasplanning && docker-compose -f docker-compose.prod.yml restart nginx"
```

## Option 2: Docker-based Certbot

For a fully containerized solution:

1. **Add Certbot service** to `docker-compose.prod.yml`:
```yaml
  certbot:
    image: certbot/certbot
    container_name: wasplanning_certbot
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www/certbot:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
```

2. **Initial certificate generation**:
```bash
# First time setup
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d ${API_SUBDOMAIN}.${BASE_DOMAIN} \
  -d ${APP_SUBDOMAIN}.${BASE_DOMAIN} \
  --email ${SSL_EMAIL} \
  --agree-tos \
  --no-eff-email
```

## Option 3: Custom SSL Certificates

If you have your own SSL certificates:

1. **Create certificate directory**:
```bash
sudo mkdir -p /etc/letsencrypt/live/${API_SUBDOMAIN}.${BASE_DOMAIN}
sudo mkdir -p /etc/letsencrypt/live/${APP_SUBDOMAIN}.${BASE_DOMAIN}
sudo mkdir -p /etc/letsencrypt/live/${STORAGE_SUBDOMAIN}.${BASE_DOMAIN}
```

2. **Copy your certificates**:
```bash
# For each subdomain
sudo cp your-cert.pem /etc/letsencrypt/live/${SUBDOMAIN}.${BASE_DOMAIN}/fullchain.pem
sudo cp your-key.pem /etc/letsencrypt/live/${SUBDOMAIN}.${BASE_DOMAIN}/privkey.pem
```

3. **Set proper permissions**:
```bash
sudo chmod 600 /etc/letsencrypt/live/*/privkey.pem
sudo chmod 644 /etc/letsencrypt/live/*/fullchain.pem
```

## Wildcard Certificates

For wildcard certificates covering all subdomains:

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.${BASE_DOMAIN}" \
  -d ${BASE_DOMAIN} \
  --email ${SSL_EMAIL} \
  --agree-tos
```

Note: This requires DNS validation and manual DNS TXT record creation.

## Troubleshooting

### Certificate Not Found

If nginx fails to start with certificate errors:

1. **Check certificate paths**:
```bash
ls -la /etc/letsencrypt/live/
```

2. **Verify environment variables**:
```bash
source .env.production
echo "API: ${API_SUBDOMAIN}.${BASE_DOMAIN}"
echo "App: ${APP_SUBDOMAIN}.${BASE_DOMAIN}"
```

3. **Check nginx error logs**:
```bash
docker-compose -f docker-compose.prod.yml logs nginx
```

### Rate Limits

Let's Encrypt has rate limits:
- 50 certificates per registered domain per week
- 5 duplicate certificates per week

Use `--staging` flag for testing:
```bash
sudo certbot certonly --staging --standalone -d ${API_SUBDOMAIN}.${BASE_DOMAIN}
```

### Permission Issues

Ensure Docker can read certificates:
```bash
# Check Docker has access
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/
```

## Security Best Practices

1. **Use strong DH parameters**:
```bash
openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

2. **Enable OCSP stapling** (already configured in nginx)

3. **Regular certificate monitoring**:
```bash
# Check expiration
echo | openssl s_client -servername ${API_SUBDOMAIN}.${BASE_DOMAIN} -connect ${API_SUBDOMAIN}.${BASE_DOMAIN}:443 2>/dev/null | openssl x509 -noout -dates
```

4. **Set up monitoring alerts** for certificate expiration

## Testing SSL Configuration

1. **Test with SSL Labs**:
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter your domain
   - Aim for A+ rating

2. **Test with curl**:
```bash
curl -I https://${API_SUBDOMAIN}.${BASE_DOMAIN}/health
curl -I https://${APP_SUBDOMAIN}.${BASE_DOMAIN}/health
```

3. **Check certificate details**:
```bash
openssl s_client -connect ${API_SUBDOMAIN}.${BASE_DOMAIN}:443 -servername ${API_SUBDOMAIN}.${BASE_DOMAIN} < /dev/null
```

## Certificate Backup

Always backup your certificates:

```bash
# Backup Let's Encrypt directory
sudo tar -czf letsencrypt-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/

# Store securely (e.g., encrypted S3 bucket)
aws s3 cp letsencrypt-backup-*.tar.gz s3://your-backup-bucket/ssl/ --sse
```