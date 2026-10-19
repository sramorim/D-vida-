#!/bin/bash
# ============================================
# SHANDON ELITE - Bot em Background
# ============================================

cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       SHANDON ELITE - BOT BACKGROUND           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Verificar se ja esta rodando
if [ -f bot.pid ]; then
    PID=$(cat bot.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Bot ja esta rodando! (PID: $PID)"
        echo "Para parar: ./parar.sh"
        exit 1
    fi
fi

# Verificar .env
if [ ! -f .env ]; then
    echo "Arquivo .env nao encontrado!"
    exit 1
fi

source .env
if [ "$TELEGRAM_BOT_TOKEN" = "SEU_TOKEN_AQUI" ] || [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Configure o TELEGRAM_BOT_TOKEN no .env"
    exit 1
fi

# Instalar dependencias
pip install -q python-telegram-bot aiohttp 2>/dev/null

# Iniciar em background
echo "Iniciando bot em background..."
nohup python bot.py > bot.log 2>&1 &
PID=$!
echo $PID > bot.pid

echo "Bot iniciado! (PID: $PID)"
echo "Log: tail -f bot.log"
echo "Parar: ./parar.sh"
