#!/bin/bash
# ============================================
# SHANDON ELITE - Status do Bot
# ============================================

cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║       SHANDON ELITE - STATUS DO BOT            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ ! -f bot.pid ]; then
    echo "Status: OFFLINE (bot.pid nao encontrado)"
    exit 1
fi

PID=$(cat bot.pid)

if ps -p $PID > /dev/null 2>&1; then
    echo "Status: ONLINE"
    echo "PID: $PID"
    echo "Uptime: $(ps -p $PID -o etime= 2>/dev/null || echo 'N/A')"
    echo ""
    echo "Ultimas 10 linhas do log:"
    echo "--------------------------"
    tail -10 bot.log 2>/dev/null || echo "Log nao disponivel"
else
    echo "Status: OFFLINE (processo $PID nao encontrado)"
    rm -f bot.pid
fi
