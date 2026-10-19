#!/usr/bin/env python3
"""
AGENTE PESSOAL - Telegram Bot
Seu assistente pessoal no Telegram - como o opencode, mas no Telegram!
"""

import os
import sys
import json
import asyncio
import logging
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / '.env')
except ImportError:
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

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

# Token do bot
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'SEU_TOKEN_AQUI')

# Configurações
WORK_DIR = os.getenv('WORK_DIR', '/data/data/com.termux/files/home')
OPENCODE_API = os.getenv('OPENCODE_API', '')  # Se usar API externa

class PersonalAgent:
    def __init__(self):
        self.app = Application.builder().token(BOT_TOKEN).build()
        self.setup_handlers()
        self.command_history = []
        
    def setup_handlers(self):
        """Configura todos os handlers"""
        # Comandos principais
        self.app.add_handler(CommandHandler("start", self.cmd_start))
        self.app.add_handler(CommandHandler("ajuda", self.cmd_ajuda))
        self.app.add_handler(CommandHandler("help", self.cmd_ajuda))
        
        # Comandos de sistema
        self.app.add_handler(CommandHandler("abrir", self.cmd_abrir))
        self.app.add_handler(CommandHandler("abre", self.cmd_abrir))
        self.app.add_handler(CommandHandler("abrir_termux", self.cmd_abrir_termux))
        self.app.add_handler(CommandHandler("status", self.cmd_status))
        self.app.add_handler(CommandHandler(" pwd", self.cmd_pwd))
        self.app.add_handler(CommandHandler("ls", self.cmd_ls))
        self.app.add_handler(CommandHandler("cd", self.cmd_cd))
        
        # Comandos de projeto
        self.app.add_handler(CommandHandler("editar", self.cmd_editar))
        self.app.add_handler(CommandHandler("edit", self.cmd_editar))
        self.app.add_handler(CommandHandler("ler", self.cmd_ler))
        self.app.add_handler(CommandHandler("read", self.cmd_ler))
        self.app.add_handler(CommandHandler("listar", self.cmd_listar))
        
        # Comandos Git
        self.app.add_handler(CommandHandler("git", self.cmd_git))
        self.app.add_handler(CommandHandler("commit", self.cmd_commit))
        self.app.add_handler(CommandHandler("push", self.cmd_push))
        self.app.add_handler(CommandHandler("status_git", self.cmd_status_git))
        
        # Comandos OSINT
        self.app.add_handler(CommandHandler("pesquisar", self.cmd_pesquisar))
        self.app.add_handler(CommandHandler("buscar", self.cmd_pesquisar))
        
        # Comandos utilitários
        self.app.add_handler(CommandHandler("hora", self.cmd_hora))
        self.app.add_handler(CommandHandler("data", self.cmd_hora))
        self.app.add_handler(CommandHandler("calcular", self.cmd_calcular))
        self.app.add_handler(CommandHandler("calc", self.cmd_calcular))
        
        # Handler para mensagens (texto normal)
        self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.msg_handler))
        
        # Handler para fotos
        self.app.add_handler(MessageHandler(filters.PHOTO, self.photo_handler))
        
        # Handler para documentos
        self.app.add_handler(MessageHandler(filters.Document.ALL, self.doc_handler))
    
    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /start"""
        user = update.effective_user
        welcome = f"""
{self.get_banner()}

Ola {user.first_name}! Sou seu agente pessoal.

Sou como o opencode, mas no Telegram!

COMANDOS PRINCIPAIS:
/abrir [pasta] - Abrir pasta no Termux
/editar [arquivo] - Editar arquivo
/ler [arquivo] - Ler arquivo
/git [comando] - Comandos Git
/pesquisar [algo] - Pesquisar na web
/status - Ver status

COMANDOS RAPIDOS:
/pwd - Pasta atual
/ls - Listar arquivos
/hora - Hora atual
/calc [expressao] - Calculadora

Tambem respondo mensagens normais!
Me mande qualquer coisa que eu ajudo.

Exemplo: /abrir shandon-elite
        """
        await update.message.reply_text(welcome)
    
    async def cmd_ajuda(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /ajuda"""
        ajuda = f"""
{self.get_banner()}

COMANDOS DISPONÍVEIS:

SISTEMA:
/abrir [pasta] - Abrir pasta no Termux
/abre [pasta] - Alias para abrir
/status - Ver status do sistema
/pwd - Pasta atual
/ls - Listar arquivos
/cd [pasta] - Mudar de pasta

ARQUIVOS:
/editar [arquivo] - Editar arquivo
/ler [arquivo] - Ler arquivo
/listar [pasta] - Listar conteudo

GIT:
/git [comando] - Comando Git
/commit [mensagem] - Fazer commit
/push - Fazer push
/status_git - Ver status do Git

UTILITARIOS:
/pesquisar [algo] - Pesquisar na web
/buscar [algo] - Alias para pesquisar
/hora - Hora e data atual
/calc [expressao] - Calculadora

TAMBM FUNCIONA:
- Me mande texto normal que eu respondo
- Me mande foto que eu analiso
- Me mande arquivo que eu leio

Exemplos:
/abrir shandon-elite
/editar app/page.tsx
/git status
/pesquisar como fazer bolo
/calc 2 + 2 * 3
        """
        await update.message.reply_text(ajuda)
    
    async def cmd_abrir(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /abrir - Abre uma pasta"""
        if not context.args:
            await update.message.reply_text("Uso: /abrir [pasta]\nExemplo: /abrir shandon-elite")
            return
        
        pasta = context.args[0]
        caminho = os.path.join(WORK_DIR, pasta)
        
        if not os.path.exists(caminho):
            await update.message.reply_text(f"Pasta nao encontrada: {pasta}")
            return
        
        # Listar conteudo
        try:
            itens = os.listdir(caminho)
            msg = f"📁 **{pasta}**\n\n"
            
            # Separar pastas e arquivos
            pastas = [i for i in itens if os.path.isdir(os.path.join(caminho, i))]
            arquivos = [i for i in itens if os.path.isfile(os.path.join(caminho, i))]
            
            if pastas:
                msg += "📁 **Pastas:**\n"
                for p in sorted(pastas)[:10]:
                    msg += f"  • {p}/\n"
                if len(pastas) > 10:
                    msg += f"  ... e mais {len(pastas)-10}\n"
            
            if arquivos:
                msg += "\n📄 **Arquivos:**\n"
                for a in sorted(arquivos)[:10]:
                    msg += f"  • {a}\n"
                if len(arquivos) > 10:
                    msg += f"  ... e mais {len(arquivos)-10}\n"
            
            msg += f"\n📂 Caminho: `{caminho}`"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro ao abrir pasta: {str(e)}")
    
    async def cmd_abrir_termux(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /abrir_termux - Abre o Termux"""
        await update.message.reply_text(
            "📱 Para abrir o Termux:\n\n"
            "1. Toque no icone do Termux\n"
            "2. Ou use o atalho:\n"
            "   `am start -n com.termux/.HomeActivity`\n\n"
            "Ou me mande um comando que eu executo!"
        )
    
    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /status"""
        try:
            # Info do sistema
            result = subprocess.run(
                ['uname', '-a'],
                capture_output=True, text=True, timeout=5
            )
            uname = result.stdout.strip()
            
            # Uptime
            result = subprocess.run(
                ['uptime', '-p'],
                capture_output=True, text=True, timeout=5
            )
            uptime = result.stdout.strip()
            
            # Espaco em disco
            result = subprocess.run(
                ['df', '-h', '/data'],
                capture_output=True, text=True, timeout=5
            )
            disk = result.stdout.strip().split('\n')[1] if result.stdout else "N/A"
            
            msg = f"""
{self.get_banner()}

**STATUS DO SISTEMA:**

🖥️ **Sistema:** {uname}
⏱️ **Uptime:** {uptime}
💾 **Disco:** {disk}

📂 **Pasta atual:** `{WORK_DIR}`
🤖 **Status:** Online e pronto!

Use /abrir [pasta] para navegar.
            """
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro ao obter status: {str(e)}")
    
    async def cmd_pwd(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /pwd"""
        await update.message.reply_text(f"📂 Pasta atual:\n`{WORK_DIR}`", parse_mode='Markdown')
    
    async def cmd_ls(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /ls"""
        try:
            pasta = context.args[0] if context.args else WORK_DIR
            itens = os.listdir(pasta)
            
            msg = f"📁 **{os.path.basename(pasta) or pasta}:**\n\n"
            for item in sorted(itens)[:20]:
                caminho = os.path.join(pasta, item)
                if os.path.isdir(caminho):
                    msg += f"📁 {item}/\n"
                else:
                    msg += f"📄 {item}\n"
            
            if len(itens) > 20:
                msg += f"\n... e mais {len(itens)-20} itens"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro: {str(e)}")
    
    async def cmd_cd(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /cd"""
        global WORK_DIR
        if not context.args:
            await update.message.reply_text(f"Pasta atual: `{WORK_DIR}`", parse_mode='Markdown')
            return
        
        pasta = context.args[0]
        
        if pasta == '..':
            WORK_DIR = os.path.dirname(WORK_DIR)
        elif pasta.startswith('/'):
            WORK_DIR = pasta
        else:
            WORK_DIR = os.path.join(WORK_DIR, pasta)
        
        if not os.path.exists(WORK_DIR):
            WORK_DIR = os.path.dirname(WORK_DIR)
            await update.message.reply_text(f"Pasta nao encontrada. Mantendo: `{WORK_DIR}`", parse_mode='Markdown')
            return
        
        await update.message.reply_text(f"Mudou para: `{WORK_DIR}`", parse_mode='Markdown')
    
    async def cmd_editar(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /editar"""
        if not context.args:
            await update.message.reply_text("Uso: /editar [arquivo]\nExemplo: /editar app/page.tsx")
            return
        
        arquivo = context.args[0]
        caminho = os.path.join(WORK_DIR, arquivo)
        
        if not os.path.exists(caminho):
            await update.message.reply_text(f"Arquivo nao encontrado: {arquivo}")
            return
        
        try:
            with open(caminho, 'r', encoding='utf-8', errors='ignore') as f:
                conteudo = f.read()
            
            # Limitar tamanho
            if len(conteudo) > 3000:
                conteudo = conteudo[:3000] + "\n\n... (truncado)"
            
            msg = f"📄 **{arquivo}**\n\n```\n{conteudo}\n```\n\n📝 Para editar, me mande:\n`editar {arquivo} [novo conteudo]`"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro ao ler arquivo: {str(e)}")
    
    async def cmd_ler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /ler"""
        if not context.args:
            await update.message.reply_text("Uso: /ler [arquivo]\nExemplo: /ler README.md")
            return
        
        arquivo = context.args[0]
        caminho = os.path.join(WORK_DIR, arquivo)
        
        if not os.path.exists(caminho):
            await update.message.reply_text(f"Arquivo nao encontrado: {arquivo}")
            return
        
        try:
            with open(caminho, 'r', encoding='utf-8', errors='ignore') as f:
                conteudo = f.read()
            
            if len(conteudo) > 3000:
                conteudo = conteudo[:3000] + "\n\n... (truncado)"
            
            msg = f"📄 **{arquivo}**\n\n```\n{conteudo}\n```"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro: {str(e)}")
    
    async def cmd_listar(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /listar"""
        pasta = context.args[0] if context.args else WORK_DIR
        await self.cmd_ls(update, context)
    
    async def cmd_git(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /git"""
        if not context.args:
            await update.message.reply_text(
                "Uso: /git [comando]\n\n"
                "Exemplos:\n"
                "/git status\n"
                "/git log\n"
                "/git diff\n"
                "/git pull"
            )
            return
        
        comando = ' '.join(context.args)
        
        try:
            result = subprocess.run(
                ['git'] + context.args,
                capture_output=True, text=True, timeout=30,
                cwd=WORK_DIR
            )
            
            msg = f"🔧 **git {comando}**\n\n"
            
            if result.stdout:
                msg += f"```\n{result.stdout[:2000]}\n```"
            if result.stderr:
                msg += f"\n⚠️ **stderr:**\n```\n{result.stderr[:1000]}\n```"
            if result.returncode == 0:
                msg += "\n✅ Sucesso!"
            else:
                msg += f"\n❌ Erro (codigo: {result.returncode})"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except subprocess.TimeoutExpired:
            await update.message.reply_text("⏰ Comando demorou muito (>30s)")
        except Exception as e:
            await update.message.reply_text(f"Erro: {str(e)}")
    
    async def cmd_commit(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /commit"""
        if not context.args:
            await update.message.reply_text("Uso: /commit [mensagem]")
            return
        
        mensagem = ' '.join(context.args)
        
        try:
            # git add .
            subprocess.run(['git', 'add', '.'], capture_output=True, cwd=WORK_DIR)
            
            # git commit
            result = subprocess.run(
                ['git', 'commit', '-m', mensagem],
                capture_output=True, text=True, timeout=30,
                cwd=WORK_DIR
            )
            
            msg = f"📝 **Commit:** {mensagem}\n\n"
            if result.stdout:
                msg += f"```\n{result.stdout[:1500]}\n```"
            if result.returncode == 0:
                msg += "\n✅ Commit realizado!"
            else:
                msg += f"\n❌ Erro: {result.stderr[:500]}"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro: {str(e)}")
    
    async def cmd_push(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /push"""
        try:
            result = subprocess.run(
                ['git', 'push'],
                capture_output=True, text=True, timeout=60,
                cwd=WORK_DIR
            )
            
            msg = "🚀 **Git Push**\n\n"
            if result.stdout:
                msg += f"```\n{result.stdout[:1500]}\n```"
            if result.stderr:
                msg += f"```\n{result.stderr[:1000]}\n```"
            if result.returncode == 0:
                msg += "\n✅ Push realizado!"
            else:
                msg += f"\n❌ Erro"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro: {str(e)}")
    
    async def cmd_status_git(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /status_git"""
        try:
            result = subprocess.run(
                ['git', 'status'],
                capture_output=True, text=True, timeout=15,
                cwd=WORK_DIR
            )
            
            msg = f"📊 **Git Status**\n\n```\n{result.stdout[:2000]}\n```"
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"Erro: {str(e)}")
    
    async def cmd_pesquisar(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /pesquisar"""
        if not context.args:
            await update.message.reply_text("Uso: /pesquisar [algo]\nExemplo: /pesquisar como fazer bolo")
            return
        
        query = ' '.join(context.args)
        
        # Por enquanto, apenas confirma
        msg = f"🔍 **Pesquisando:** {query}\n\n"
        msg += "🌐 Abrindo navegador...\n\n"
        msg += f"🔗 Google: https://www.google.com/search?q={query.replace(' ', '+')}\n"
        msg += f"🔗 YouTube: https://www.youtube.com/results?search_query={query.replace(' ', '+')}\n"
        msg += f"🔗 GitHub: https://github.com/search?q={query.replace(' ', '+')}"
        
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    async def cmd_hora(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /hora"""
        agora = datetime.now()
        msg = f"🕐 **Hora atual:**\n\n"
        msg += f"📅 Data: {agora.strftime('%d/%m/%Y')}\n"
        msg += f"⏰ Hora: {agora.strftime('%H:%M:%S')}\n"
        msg += f"📆 Dia: {agora.strftime('%A')}"
        
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    async def cmd_calcular(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Comando /calc"""
        if not context.args:
            await update.message.reply_text("Uso: /calc [expressao]\nExemplo: /calc 2 + 2 * 3")
            return
        
        expr = ' '.join(context.args)
        
        try:
            # Avaliar expressao (com seguranca)
            allowed_chars = set('0123456789+-*/.() ')
            if not all(c in allowed_chars for c in expr):
                await update.message.reply_text("❌ Expressao invalida")
                return
            
            resultado = eval(expr)
            msg = f"🧮 **Calculadora:**\n\n`{expr}` = **{resultado}**"
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ Erro ao calcular: {str(e)}")
    
    async def msg_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler para mensagens normais"""
        text = update.message.text
        
        # Verificar se e um comando de edicao
        if text.lower().startswith('editar '):
            parts = text[7:].split(' ', 1)
            if len(parts) == 2:
                arquivo, conteudo = parts
                caminho = os.path.join(WORK_DIR, arquivo)
                
                try:
                    with open(caminho, 'w', encoding='utf-8') as f:
                        f.write(conteudo)
                    await update.message.reply_text(f"✅ Arquivo salvo: {arquivo}")
                except Exception as e:
                    await update.message.reply_text(f"❌ Erro ao salvar: {str(e)}")
                return
        
        # Se mencionar o bot ou responder
        if context.bot.username in text or text.startswith('@'):
            await update.message.reply_text(
                "Use /ajuda para ver os comandos.\n"
                "Ou me mande qualquer mensagem que eu respondo!"
            )
            return
        
        # Resposta generica (pode integrar com IA)
        responses = [
            "Interessante! Me conta mais.",
            "Entendi! Posso ajudar com isso?",
            "Hmm, deixa eu ver...\n\nUse /ajuda para ver o que posso fazer!",
            "Legal! Quer que eu faça algo específico?",
            "OK! Estou aqui se precisar.\n\nUse /status para ver o sistema.",
        ]
        
        import random
        response = random.choice(responses)
        await update.message.reply_text(response)
    
    async def photo_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler para fotos"""
        photo = update.message.photo[-1]
        caption = update.message.caption or "Sem legenda"
        
        msg = f"📸 **Foto recebida!**\n\n"
        msg += f"📏 Tamanho: {photo.width}x{photo.height}\n"
        msg += f"📝 Legenda: {caption}\n\n"
        msg += "Analise de imagem em breve!"
        
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    async def doc_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handler para documentos"""
        doc = update.message.document
        file_name = doc.file_name or "arquivo"
        file_size = doc.file_size or 0
        
        msg = f"📄 **Arquivo recebido!**\n\n"
        msg += f"📁 Nome: {file_name}\n"
        msg += f"📏 Tamanho: {file_size/1024:.1f} KB\n\n"
        msg += "Use /ler [nome] para ler o conteudo."
        
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    def get_banner(self) -> str:
        return """
```
╔══════════════════════════════════════╗
║     AGENTE PESSOAL - TELEGRAM       ║
║         Seu assistente IA           ║
╚══════════════════════════════════════╝
```
"""
    
    async def post_init(self, application: Application):
        """Configura comandos"""
        await application.bot.set_my_commands([
            BotCommand("start", "Iniciar agente"),
            BotCommand("ajuda", "Ver comandos"),
            BotCommand("abrir", "Abrir pasta"),
            BotCommand("editar", "Editar arquivo"),
            BotCommand("ler", "Ler arquivo"),
            BotCommand("git", "Comandos Git"),
            BotCommand("pesquisar", "Pesquisar na web"),
            BotCommand("status", "Ver status"),
            BotCommand("hora", "Hora atual"),
            BotCommand("calc", "Calculadora"),
        ])
    
    def run(self):
        """Inicia o agente"""
        print(self.get_banner())
        print("Iniciando agente pessoal...")
        print("Pressione Ctrl+C para parar\n")
        
        self.app.post_init = self.post_init
        self.app.run_polling(allowed_updates=Update.ALL_TYPES)

def main():
    """Funcao principal"""
    if BOT_TOKEN == 'SEU_TOKEN_AQUI':
        print("ERRO: Configure o TELEGRAM_BOT_TOKEN")
        print("\nPara obter o token:")
        print("1. Abra o Telegram")
        print("2. Busque @BotFather")
        print("3. Envie /newbot")
        print("4. Copie o token")
        sys.exit(1)
    
    agent = PersonalAgent()
    agent.run()

if __name__ == '__main__':
    main()
