# COMO CRIAR SEU BOT NO TELEGRAM

## Passo 1: Criar o bot via BotFather

1. Abra o Telegram e busque: @BotFather
2. Envie: /newbot
3. Nome: Shandon Elite Bot
4. Username: shandon_elite_bot (ou similar)
5. Ele vai te dar um TOKEN. Copie!

## Passo 2: Configurar o token

Edite o arquivo .env na pasta do bot:
```
TELEGRAM_BOT_TOKEN=SEU_TOKEN_AQUI
```

## Passo 3: Rodar o bot

```bash
cd /data/data/com.termux/files/home/shandon-elite/scripts/telegram-bot
python bot.py
```

## Passo 4: Deixar rodando em background

```bash
nohup python bot.py > bot.log 2>&1 &
```

## COMANDOS DO BOT

/start - Iniciar o bot
/pesquisar [nome] - Buscar pessoa
/instagram [username] - Verificar Instagram
/facebook [username] - Verificar Facebook
/onlyfans [username] - Verificar OnlyFans
/tinder [username] - Verificar Tinder
/email [email] - Buscar por email
/telefone [numero] - Buscar por telefone
/status - Ver status do bot
/ajuda - Ver comandos
