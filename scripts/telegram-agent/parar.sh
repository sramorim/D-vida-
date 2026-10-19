#!/bin/bash
# Parar OpenCode
cd "$(dirname "$0")"

if [ ! -f agent.pid ]; then
    echo "❌ OpenCode nao esta rodando"
    exit 1
fi

PID=$(cat agent.pid)
if ps -p $PID > /dev/null 2>&1; then
    kill $PID
    rm agent.pid
    echo "✅ OpenCode parado!"
else
    rm agent.pid
    echo "❌ Processo nao encontrado"
fi
