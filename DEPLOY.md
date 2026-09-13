# 🚀 Panduan Deploy LMS ke GitHub & VPS

## 1. Persiapan GitHub

### 1.1 Buat Repository di GitHub
```bash
# Inisialisasi git (jika belum ada)
cd /Users/aminrois/lms
git init
git add .
git commit -m "chore: initial commit — LMS full stack with PostgreSQL"
```

### 1.2 Hubungkan ke GitHub
```bash
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

> **Penting:** Pastikan `.env` dan `server/.env` **tidak ter-commit**. File ini sudah ada di `.gitignore`.

---

## 2. Setup VPS

### 2.1 Prasyarat VPS (Ubuntu 22.04 LTS)
```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo apt install docker-compose-plugin -y

# Install Git
sudo apt install git -y
```

### 2.2 Clone Repository
```bash
cd /opt
sudo git clone https://github.com/USERNAME/REPO_NAME.git lms
sudo chown -R $USER:$USER /opt/lms
cd /opt/lms
```

---

## 3. Konfigurasi Production

### 3.1 Buat file `.env` dari template
```bash
cp .env.example .env
nano .env
```

Isi semua nilai yang perlu diganti:
```env
POSTGRES_DB=lmsdb
POSTGRES_USER=lmsuser
POSTGRES_PASSWORD=buat_password_kuat_random
DATABASE_URL=postgresql://lmsuser:buat_password_kuat_random@db:5432/lmsdb
JWT_SECRET=buat_jwt_secret_minimal_64_karakter_random
CORS_ORIGIN=https://lms.domainanda.com
VITE_API_BASE_URL=https://lms.domainanda.com/api/v1
```

> Generate JWT Secret: `openssl rand -base64 64`

### 3.2 (Opsional) Konfigurasi domain di Nginx
Edit `nginx/lms.conf`:
- Ganti `server_name _;` dengan `server_name lms.domainanda.com;`
- Untuk HTTPS, gunakan Certbot (lihat langkah 5)

---

## 4. Deploy dengan Docker Compose

### 4.1 Build & jalankan semua services
```bash
cd /opt/lms
docker compose build
docker compose up -d
```

### 4.2 Jalankan Prisma migration (pertama kali)
```bash
docker compose exec backend npx prisma db push
```

### 4.3 Cek status
```bash
docker compose ps
docker compose logs -f backend
```

### 4.4 Akses aplikasi
- Frontend: `http://IP_VPS` atau `http://lms.domainanda.com`
- Backend health: `http://IP_VPS/api/health`

---

## 5. Setup HTTPS dengan Let's Encrypt (Opsional tapi Dianjurkan)

```bash
# Install Certbot
sudo apt install certbot -y

# Stop Nginx sementara
docker compose stop frontend

# Generate sertifikat
sudo certbot certonly --standalone -d lms.domainanda.com

# Copy sertifikat ke direktori nginx
sudo cp /etc/letsencrypt/live/lms.domainanda.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/lms.domainanda.com/privkey.pem ./nginx/ssl/
```

Lalu update `nginx/lms.conf` untuk support HTTPS:
```nginx
server {
    listen 443 ssl;
    server_name lms.domainanda.com;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... sisa konfigurasi ...
}

server {
    listen 80;
    server_name lms.domainanda.com;
    return 301 https://$host$request_uri;
}
```

---

## 6. Update Aplikasi (Deploy Ulang)

```bash
cd /opt/lms
git pull origin main
docker compose build
docker compose up -d
```

---

## 7. Backup Database

```bash
# Backup
docker compose exec db pg_dump -U lmsuser lmsdb > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db psql -U lmsuser lmsdb < backup_20260912.sql
```

---

## 8. Monitoring

```bash
# Lihat log real-time
docker compose logs -f

# Status semua container
docker compose ps

# Resource usage
docker stats
```
