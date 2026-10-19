#!/bin/bash
# ============================================
# SHANDON ELITE - Parar Bot
# ============================================

cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       SHANDON ELITE - PARAR BOT                ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ ! -f bot.pid ]; then
    echo "Bot nao esta rodando (arquivo bot.pid nao encontrado)"
    exit 1
fi

PID=$(cat bot.pid)

if ps -p $PID > /dev/null 2>&1; then
    echo "Parando bot (PID: $PID)..."
    kill $PID
    sleep 2
    
    if ps -p $PID > /dev/null 2>&1; then
        echo "Forcando parada..."
        kill -9 $PID
    fi
    
    rm -f bot.pid
    echo "Bot parado com sucesso!"
else
    echo "Bot nao esta rodando (PID: $PID)"
    rm -f bot.pid
fi
