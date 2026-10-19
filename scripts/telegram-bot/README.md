# SHANDON ELITE - Telegram Bot

Bot pessoal OSINT para Telegram.

## COMO CONFIGURAR

### 1. Criar o bot no Telegram

1. Abra o Telegram
2. Busque: @BotFather
3. Envie: `/newbot`
4. Nome: `Shandon Elite Bot`
5. Username: `shandon_elite_bot` (ou similar)
6. Copie o TOKEN

### 2. Configurar o token

Edite o arquivo `.env`:
```bash
TELEGRAM_BOT_TOKEN=cole_seu_token_aqui
```

---

## OPÇÃO 1: Rodar no Termux (local)

**Iniciar:**
```bash
./iniciar.sh
```

**Rodar em background (Termux fica aberto):**
```bash
./background.sh
```

**Parar:**
```bash
./parar.sh
```

**Ver status:**
```bash
./status.sh
```

⚠️ Se fechar o Termux, o bot para.

---

## OPÇÃO 2: Rodar no Render (24/7, GRATUITO)

Melhor opção - roda 24/7 sem precisar do Termux.

### Passo 1: Criar conta no Render
1. Acesse: https://render.com
2. Crie uma conta gratuita

### Passo 2: Criar o Serviço
1. Clique em "New +"
2. Selecione "Worker"
3. Conecte seu GitHub
4. Selecione o repositorio `shandon-elite`
5. Na pasta: `scripts/telegram-bot`
6. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python bot.py`

### Passo 3: Configurar Variaveis
No painel do serviço, adicione:
- `TELEGRAM_BOT_TOKEN`: Seu token do BotFather
- `SHANDON_URL`: URL do Shandon Elite (ex: https://shandon-elite.onrender.com)

### Passo 4: Deploy
O Render vai fazer deploy automaticamente. O bot vai rodar 24/7!

---

## COMANDOS DO BOT

### Principais
- `/start` - Iniciar o bot
- `/ajuda` - Ver comandos
- `/pesquisar [nome]` - Buscar pessoa em 50+ redes
- `/status` - Ver status

### Redes Sociais
- `/instagram [user]` - Verificar Instagram
- `/facebook [user]` - Verificar Facebook
- `/tiktok [user]` - Verificar TikTok

### +18
- `/onlyfans [user]` - Verificar OnlyFans
- `/tinder [user]` - Verificar Tinder

### OSINT
- `/email [email]` - Buscar por email
- `/telefone [num]` - Buscar por telefone

## EXEMPLOS

```
/pesquisar Daniel Amorim
/instagram senhor_amorim
/onlyfans daniel_amorim
/email daniel@email.com
/tinder daniel_amorim
```

## ARQUIVOS

- `bot.py` - Codigo principal do bot
- `.env` - Configuracoes (token)
- `requirements.txt` - Dependencias Python
- `Procfile` - Para Render
- `render.yaml` - Config Render
- `iniciar.sh` - Iniciar bot (Termux)
- `background.sh` - Iniciar em background (Termux)
- `parar.sh` - Parar bot (Termux)
- `status.sh` - Ver status (Termux)

## REQUISITOS

- Python 3.8+
- python-telegram-bot
- aiohttp

## QUAL OPÇÃO ESCOLHER?

| Opção | Vantagem | Desvantagem |
|-------|----------|-------------|
| **Termux** | Facil, rapido | Precisa Termux aberto |
| **Render** | 24/7, gratis | Precisa criar conta |

**Recomendação:** Use o Render para o bot rodar 24/7 sem interrupcoes.
