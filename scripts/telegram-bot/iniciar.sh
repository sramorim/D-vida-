#!/bin/bash
# ============================================
# SHANDON ELITE - Iniciar Bot Telegram
# ============================================

cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       SHANDON ELITE - TELEGRAM BOT             ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "Arquivo .env nao encontrado!"
    echo "Copie .env.example para .env e configure o token."
    exit 1
fi

# Verificar se token esta configurado
source .env
if [ "$TELEGRAM_BOT_TOKEN" = "SEU_TOKEN_AQUI" ] || [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "Configure o TELEGRAM_BOT_TOKEN no arquivo .env"
    echo ""
    echo "Para obter o token:"
    echo "1. Abra o Telegram"
    echo "2. Busque @BotFather"
    echo "3. Envie /newbot"
    echo "4. Copie o token para o .env"
    exit 1
fi

# Verificar dependencias
echo "Verificando dependencias..."
pip install -q python-telegram-bot aiohttp 2>/dev/null

# Iniciar bot
echo "Iniciando bot..."
echo "Pressione Ctrl+C para parar"
echo ""
python bot.py
