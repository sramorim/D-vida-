#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo "  SHANDON ELITE — Script de Setup"
echo "============================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[AVISO]${NC} $1"; }
fail() { echo -e "${RED}[ERRO]${NC} $1"; }

echo "--- Verificando dependências do sistema ---"

if ! command -v node &> /dev/null; then
  fail "Node.js não encontrado. Instale Node.js 20+ primeiro."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Node.js $NODE_VERSION encontrado. Necessário 18+."
  exit 1
fi
ok "Node.js $(node -v)"

if ! command -v python3 &> /dev/null; then
  fail "Python3 não encontrado. Instale Python3 primeiro."
  exit 1
fi
ok "Python3 $(python3 --version 2>&1 | awk '{print $2}')"

if ! command -v pip3 &> /dev/null; then
  fail "pip3 não encontrado. Instale python3-pip primeiro."
  exit 1
fi
ok "pip3 disponível"

echo ""
echo "--- Instalando dependências Python ---"

echo "Instalando maigret..."
if pip3 install --quiet maigret 2>/dev/null; then
  ok "Maigret instalado"
else
  warn "Falha ao instalar Maigret (pode precisar de permissões)"
fi

echo "Instalando instaloader..."
if pip3 install --quiet instaloader 2>/dev/null; then
  ok "Instaloader instalado"
else
  warn "Falha ao instalar Instaloader"
fi

echo "Instalando holehe..."
if pip3 install --quiet holehe 2>/dev/null; then
  ok "Holehe instalado"
else
  warn "Falha ao instalar Holehe"
fi

echo ""
echo "--- Instalando dependências Node.js ---"
npm install
ok "Dependências Node.js instaladas"

echo ""
echo "--- Verificando instalações ---"

if command -v maigret &> /dev/null; then
  ok "Maigret: $(maigret --version 2>&1 | head -1)"
else
  warn "Maigret não encontrado no PATH — tentando via python3 -m"
fi

if python3 -c "import instaloader" 2>/dev/null; then
  ok "Instaloader: disponível via import"
else
  warn "Instaloader não encontrado via import"
fi

if command -v holehe &> /dev/null; then
  ok "Holehe: disponível"
else
  warn "Holehe não encontrado no PATH"
fi

echo ""
echo "--- Configurando variáveis de ambiente ---"

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  ok ".env.local criado a partir do .env.example"
else
  ok ".env.local já existe"
fi

echo ""
echo "============================================"
echo "  Setup completo!"
echo ""
echo "  Para iniciar em desenvolvimento:"
echo "    npm run dev"
echo ""
echo "  Para build e produção:"
echo "    npm run build && npm start"
echo ""
echo "  Para Docker:"
echo "    docker compose up -d"
echo "============================================"
