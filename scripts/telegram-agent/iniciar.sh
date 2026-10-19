#!/bin/bash
# Iniciar OpenCode no Telegram
cd "$(dirname "$0")"
source .env

if [ "$TELEGRAM_BOT_TOKEN" = "SEU_TOKEN_AQUI" ]; then
    echo "❌ Configure TELEGRAM_BOT_TOKEN no .env"
    echo ""
    echo "1. Abra Telegram"
    echo "2. Busque @BotFather"
    echo "3. Envie /newbot"
    echo "4. Copie o token para .env"
    exit 1
fi

pip install -q python-telegram-bot 2>/dev/null
python opencode.py
