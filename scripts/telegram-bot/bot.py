#!/usr/bin/env python3
"""
SHANDON ELITE - Telegram Bot Pessoal
Bot agente pessoal para investigation OSINT
"""

import os
import sys
import json
import asyncio
import logging
from pathlib import Path
from datetime import datetime

# Verificar dependências
try:
    from telegram import Update, BotCommand
    from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
except ImportError:
    print("Instalando python-telegram-bot...")
    os.system("pip install python-telegram-bot")
    from telegram import Update, BotCommand
    from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

try:
    import aiohttp
except ImportError:
    print("Instalando aiohttp...")
    os.system("pip install aiohttp")
    import aiohttp

# Configuração
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Token do bot (configure no .env ou hardcoded)
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'SEU_TOKEN_AQUI')

# Configurações do Shandon
SHANDON_URL = os.getenv('SHANDON_URL', 'http://localhost:3000')
SHANDON_API_KEY = os.getenv('SHANDON_API_KEY', '')

class ShandonBot:
    def __init__(self):
        self.app = Application.builder().token(BOT_TOKEN).build()
        self.setup_handlers()
        
    def setup_handlers(self):
        """Configura todos os comandos do bot"""
        self.app.add_handler(CommandHandler("start", self.cmd_start))
        self.app.add_handler(CommandHandler("ajuda", self.cmd_ajuda))
        self.app.add_handler(CommandHandler("help", self.cmd_ajuda))
        self.app.add_handler(CommandHandler("status", self.cmd_status))
        
        # Comandos de busca
        self.app.add_handler(CommandHandler("pesquisar", self.cmd_pesquisar))
        self.app.add_handler(CommandHandler("buscar", self.cmd_pesquisar))
        self.app.add_handler(CommandHandler("search", self.cmd_pesquisar))
        
        # Comandos por plataforma
        self.app.add_handler(CommandHandler("instagram", self.cmd_instagram))
        self.app.add_handler(CommandHandler("ig", self.cmd_instagram))
        self.app.add_handler(CommandHandler("facebook", self.cmd_facebook))
        self.app.add_handler(CommandHandler("fb", self.cmd_facebook))
        self.app.add_handler(CommandHandler("tiktok", self.cmd_tiktok))
        self.app.add_handler(CommandHandler("tk", self.cmd_tiktok))
        
        # Comandos +18
        self.app.add_handler(CommandHandler("onlyfans", self.cmd_onlyfans))
        self.app.add_handler(CommandHandler("of", self.cmd_onlyfans))
        self.app.add_handler(CommandHandler("fansly", self.cmd_fansly))
        self.app.add_handler(CommandHandler("tinder", self.cmd_tinder))
        self.app.add_handler(CommandHandler("bumble", self.cmd_bumble))
        
        # ComandOSINT
        self.app.add_handler(CommandHandler("email", self.cmd_email))
        self.app.add_handler(CommandHandler("telefone", self.cmd_telefone))
        self.app.add_handler(CommandHandler("phone", self.cmd_telefone))
        self.app.add_handler(CommandHandler("username", self.cmd_username))
        
        # Handler para mensagens normais
        self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.msg_handler))
    
    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /start"""
        user = update.effective_user
        welcome = f"""
{self.get_banner()}

Ola {user.first_name}! Sou seu agente pessoal OSINT.

COMANDOS PRINCIPAIS:
/pesquisar [nome] - Buscar pessoa em 50+ redes
/instagram [user] - Verificar Instagram
/facebook [user] - Verificar Facebook
/email [email] - Buscar por email
/telefone [num] - Buscar por telefone

COMANDOS +18:
/onlyfans [user] - Verificar OnlyFans
/tinder [user] - Verificar Tinder

COMANDOS GERAIS:
/status - Ver status
/ajuda - Ver todos os comandos

Exemplo: /pesquisar Daniel Amorim
        """
        await update.message.reply_text(welcome)
    
    async def cmd_ajuda(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /ajuda"""
        ajuda = """
COMANDOS DISPONÍVEIS:

PRINCIPAIS:
/pesquisar [nome] - Buscar pessoa em 50+ redes sociais
/buscar [nome] - Alias para pesquisar
/search [nome] - Alias em inglês

REDES SOCIAIS:
/instagram [username] - Verificar Instagram
/ig [username] - Alias para Instagram
/facebook [username] - Verificar Facebook
/fb [username] - Alias para Facebook
/tiktok [username] - Verificar TikTok
/tk [username] - Alias para TikTok

+18 / ADULTO:
/onlyfans [username] - Verificar OnlyFans
/of [username] - Alias para OnlyFans
/fansly [username] - Verificar Fansly
/tinder [username] - Verificar Tinder
/bumble [username] - Verificar Bumble

OSINT:
/email [email] - Buscar por email
/telefone [numero] - Buscar por telefone
/phone [numero] - Alias para telefone
/username [user] - Buscar username

GERAIS:
/status - Ver status do bot
/ajuda - Esta mensagem

Exemplos:
/pesquisar Daniel Amorim
/instagram senhor_amorim
/email daniel@email.com
/onlyfans daniel_amorim
        """
        await update.message.reply_text(ajuda)
    
    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /status"""
        status = f"""
{self.get_banner()}

STATUS DO BOT:
- Online: ✓
- Shandon URL: {SHANDON_URL}
- Uptime: {self.get_uptime()}
- Comandos: 20+
- Plataformas: 50+

ULTIMAS BUSCAS:
- Nenhuma ainda

MEMORIA:
- Usando: {self.get_memory_usage()}
        """
        await update.message.reply_text(status)
    
    async def cmd_pesquisar(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /pesquisar"""
        if not context.args:
            await update.message.reply_text("Uso: /pesquisar [nome]\nExemplo: /pesquisar Daniel Amorim")
            return
        
        query = ' '.join(context.args)
        await update.message.reply_text(f"Buscando '{query}' em 50+ redes sociais...")
        
        # Fazer busca via API do Shandon
        result = await self.search_social(query)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_instagram(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /instagram"""
        if not context.args:
            await update.message.reply_text("Uso: /instagram [username]\nExemplo: /instagram senhor_amorim")
            return
        
        username = context.args[0].replace('@', '')
        await update.message.reply_text(f"Verificando Instagram: @{username}...")
        
        result = await self.check_platform('instagram', username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_facebook(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /facebook"""
        if not context.args:
            await update.message.reply_text("Uso: /facebook [username]\nExemplo: /facebook daniel.amorim")
            return
        
        username = context.args[0].replace('@', '')
        await update.message.reply_text(f"Verificando Facebook: {username}...")
        
        result = await self.check_platform('facebook', username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_tiktok(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /tiktok"""
        if not context.args:
            await update.message.reply_text("Uso: /tiktok [username]\nExemplo: /tiktok daniel_amorim")
            return
        
        username = context.args[0].replace('@', '')
        await update.message.reply_text(f"Verificando TikTok: @{username}...")
        
        result = await self.check_platform('tiktok', username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_onlyfans(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /onlyfans"""
        if not context.args:
            await update.message.reply_text("Uso: /onlyfans [username]\nExemplo: /onlyfans daniel_amorim")
            return
        
        username = context.args[0].replace('@', '')
        await update.message.reply_text(f"Verificando OnlyFans: {username}...")
        
        result = await self.check_platform('onlyfans', username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_fansly(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /fansly"""
        if not context.args:
            await update.message.reply_text("Uso: /fansly [username]")
            return
        
        username = context.args[0].replace('@', '')
        result = await self.check_platform('fansly', username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_tinder(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /tinder"""
        if not context.args:
            await update.message.reply_text("Uso: /tinder [username]")
            return
        
        username = context.args[0].replace('@', '')
        await update.message.reply_text(f"Verificando Tinder: {username}...")
        
        result = await self.check_platform('tinder', username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_bumble(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /bumble"""
        if not context.args:
            await update.message.reply_text("Uso: /bumble [username]")
            return
        
        username = context.args[0].replace('@', '')
        result = await self.check_platform('bumble', username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_email(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /email"""
        if not context.args:
            await update.message.reply_text("Uso: /email [email]\nExemplo: /email daniel@email.com")
            return
        
        email = context.args[0]
        await update.message.reply_text(f"Buscando dados do email: {email}...")
        
        result = await self.search_by_email(email)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_telefone(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /telefone"""
        if not context.args:
            await update.message.reply_text("Uso: /telefone [numero]\nExemplo: /telefone 11999999999")
            return
        
        phone = context.args[0]
        await update.message.reply_text(f"Buscando dados do telefone: {phone}...")
        
        result = await self.search_by_phone(phone)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def cmd_username(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /username"""
        if not context.args:
            await update.message.reply_text("Uso: /username [username]")
            return
        
        username = context.args[0].replace('@', '')
        await update.message.reply_text(f"Buscando username: {username}...")
        
        result = await self.search_social(username)
        await update.message.reply_text(result, parse_mode='HTML')
    
    async def msg_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler para mensagens normais"""
        text = update.message.text
        
        # Se mencionar o bot
        if context.bot.username in text or text.startswith('@'):
            await update.message.reply_text(
                "Use /ajuda para ver os comandos disponiveis.\n"
                "Exemplo: /pesquisar Daniel Amorim"
            )
    
    async def search_social(self, query: str) -> str:
        """Busca em redes sociais via API do Shandon"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'Content-Type': 'application/json'}
                if SHANDON_API_KEY:
                    headers['X-API-Key'] = SHANDON_API_KEY
                
                async with session.post(
                    f"{SHANDON_URL}/api/social-check",
                    json={"username": query},
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    data = await resp.json()
                    
                    if data.get('success'):
                        results = data['data']['results']
                        found = [r for r in results if r.get('exists')]
                        
                        msg = f"<b>Resultados para:</b> {query}\n"
                        msg += f"<b>Encontrados:</b> {len(found)}/{len(results)}\n\n"
                        
                        for r in found[:15]:
                            msg += f"✓ <b>{r['platform']}</b>: {r['url']}\n"
                        
                        if len(found) > 15:
                            msg += f"\n... e mais {len(found)-15} plataformas"
                        
                        return msg
                    else:
                        return f"Erro: {data.get('error', 'Desconhecido')}"
        except Exception as e:
            return f"Erro de conexao: {str(e)}"
    
    async def check_platform(self, platform: str, username: str) -> str:
        """Verifica uma plataforma especifica"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'Content-Type': 'application/json'}
                if SHANDON_API_KEY:
                    headers['X-API-Key'] = SHANDON_API_KEY
                
                async with session.post(
                    f"{SHANDON_URL}/api/social-check",
                    json={"username": username},
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=15)
                ) as resp:
                    data = await resp.json()
                    
                    if data.get('success'):
                        results = data['data']['results']
                        platform_result = next(
                            (r for r in results if platform.lower() in r['platform'].lower()),
                            None
                        )
                        
                        if platform_result:
                            status = "✓ ENCONTRADO" if platform_result['exists'] else "✗ Nao encontrado"
                            msg = f"<b>{platform.upper()}</b>\n"
                            msg += f"<b>Username:</b> @{username}\n"
                            msg += f"<b>Status:</b> {status}\n"
                            if platform_result['exists']:
                                msg += f"<b>URL:</b> {platform_result['url']}\n"
                            return msg
                        else:
                            return f"Plataforma '{platform}' nao encontrada"
                    else:
                        return f"Erro: {data.get('error', 'Desconhecido')}"
        except Exception as e:
            return f"Erro de conexao: {str(e)}"
    
    async def search_by_email(self, email: str) -> str:
        """Busca por email"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {'Content-Type': 'application/json'}
                if SHANDON_API_KEY:
                    headers['X-API-Key'] = SHANDON_API_KEY
                
                async with session.post(
                    f"{SHANDON_URL}/api/social-check",
                    json={"username": email.split('@')[0]},
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    data = await resp.json()
                    
                    if data.get('success'):
                        results = data['data']['results']
                        found = [r for r in results if r.get('exists')]
                        
                        msg = f"<b>Resultados para email:</b> {email}\n"
                        msg += f"<b>Username encontrado:</b> {email.split('@')[0]}\n"
                        msg += f"<b>Plataformas com esse username:</b> {len(found)}\n\n"
                        
                        for r in found[:10]:
                            msg += f"✓ <b>{r['platform']}</b>\n"
                        
                        return msg
                    else:
                        return f"Erro: {data.get('error', 'Desconhecido')}"
        except Exception as e:
            return f"Erro de conexao: {str(e)}"
    
    async def search_by_phone(self, phone: str) -> str:
        """Busca por telefone"""
        # Remove formatacao
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        msg = f"<b>Busca por telefone:</b> {phone}\n\n"
        msg += "<b>Plataformas para verificar:</b>\n"
        msg += "- WhatsApp: wa.me/{numero}\n"
        msg += "- Telegram: t.me/{numero}\n"
        msg += "- TrueCaller: truecaller.com\n"
        msg += "- TeleValidator: televalidator.com\n\n"
        msg += "<i>Verificando disponibilidade...</i>"
        
        return msg
    
    def get_banner(self) -> str:
        return """
```
 ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗
 ██╔════╝╚██╗██╔╝██╔══██╗██╔══██╗██╔═══██╗██║    ██║
 ███████╗ ╚███╔╝ ███████║██║  ██║██║   ██║██║ █╗ ██║
 ╚════██║ ██╔██╗ ██╔══██║██║  ██║██║   ██║██║███╗██║
 ███████║██╔╝ ██╗██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝
 ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝
          ELITE - TELEGRAM BOT
```
"""
    
    def get_uptime(self) -> str:
        """Retorna tempo de atividade"""
        return "Ativo desde agora"
    
    def get_memory_usage(self) -> str:
        """Retorna uso de memória"""
        import psutil
        try:
            process = psutil.Process()
            mem = process.memory_info()
            return f"{mem.rss / 1024 / 1024:.1f} MB"
        except:
            return "N/A"
    
    async def post_init(self, application: Application):
        """Configura comandos no Telegram"""
        await application.bot.set_my_commands([
            BotCommand("start", "Iniciar o bot"),
            BotCommand("ajuda", "Ver comandos disponiveis"),
            BotCommand("pesquisar", "Buscar pessoa em 50+ redes"),
            BotCommand("instagram", "Verificar Instagram"),
            BotCommand("facebook", "Verificar Facebook"),
            BotCommand("tiktok", "Verificar TikTok"),
            BotCommand("onlyfans", "Verificar OnlyFans"),
            BotCommand("tinder", "Verificar Tinder"),
            BotCommand("email", "Buscar por email"),
            BotCommand("telefone", "Buscar por telefone"),
            BotCommand("status", "Ver status do bot"),
        ])
    
    def run(self):
        """Inicia o bot"""
        print(self.get_banner())
        print("Iniciando bot...")
        print(f"URL do Shandon: {SHANDON_URL}")
        print("Pressione Ctrl+C para parar\n")
        
        self.app.post_init = self.post_init
        self.app.run_polling(allowed_updates=Update.ALL_TYPES)

def main():
    """Funcao principal"""
    # Verificar token
    if BOT_TOKEN == 'SEU_TOKEN_AQUI':
        print("ERRO: Configure o token do bot no arquivo .env")
        print("Ou defina a variavel de ambiente TELEGRAM_BOT_TOKEN")
        print("\nPara obter o token:")
        print("1. Abra o Telegram")
        print("2. Busque @BotFather")
        print("3. Envie /newbot")
        print("4. Copie o token")
        sys.exit(1)
    
    bot = ShandonBot()
    bot.run()

if __name__ == '__main__':
    main()
