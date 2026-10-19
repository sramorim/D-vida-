#!/usr/bin/env bash
# Shandon Elite — setup inicial na VM (Ubuntu 22.04+). Roda como root.
set -euo pipefail

echo "[1/4] Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

echo "[2/4] Instalando Docker + Compose..."
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
apt-get install -y -qq docker-compose-plugin >/dev/null 2>&1 || true
systemctl enable --now docker

echo "[3/4] Liberando a porta 80 (traffic do Cloudflare)..."
ufw allow 22/tcp >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

echo "[4/4] O código será enviado via SSH (rsync). Depois:"
echo "   cd deploy && cp .env.template .env && vim .env && docker compose up --build -d"
echo "IP desta máquina para a tela:"
hostname -I | awk '{print $1}'