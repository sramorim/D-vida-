#!/bin/bash
# OpenCode em background
cd "$(dirname "$0")"
source .env

if [ "$TELEGRAM_BOT_TOKEN" = "SEU_TOKEN_AQUI" ]; then
    echo "❌ Configure TELEGRAM_BOT_TOKEN"
    exit 1
fi

if [ -f agent.pid ]; then
    PID=$(cat agent.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ OpenCode ja rodando! (PID: $PID)"
        exit 1
    fi
fi

pip install -q python-telegram-bot 2>/dev/null
nohup python opencode.py > agent.log 2>&1 &
echo $! > agent.pid
echo "✅ OpenCode iniciado! (PID: $!)"
echo "📱 Telegram: abra e busque seu bot"
echo "📄 Log: tail -f agent.log"
