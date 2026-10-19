#!/usr/bin/env python3
"""
OPENCODE TELEGRAM - Seu agente pessoal no Telegram
Exatamente como o opencode, mas no Telegram!
"""

import os
import sys
import json
import asyncio
import logging
import subprocess
from pathlib import Path
from datetime import datetime

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

try:
    from telegram import Update, BotCommand
    from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
except ImportError:
    os.system("pip install python-telegram-bot")
    from telegram import Update, BotCommand
    from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'SEU_TOKEN_AQUI')
WORK_DIR = os.getenv('WORK_DIR', '/data/data/com.termux/files/home')

# Configuracoes do projeto
PROJECTS = {
    'shandon': '/data/data/com.termux/files/home/shandon-elite',
    'ig': '/data/data/com.termux/files/home/instagram_monitor',
    'igmonitor': '/data/data/com.termux/files/home/instagram_monitor',
}

class OpenCodeBot:
    """Seu agente pessoal - exatamente como o opencode"""
    
    def __init__(self):
        self.app = Application.builder().token(BOT_TOKEN).build()
        self.current_dir = WORK_DIR
        self.setup_handlers()
    
    def setup_handlers(self):
        # Comandos principais
        self.app.add_handler(CommandHandler("start", self.cmd_start))
        self.app.add_handler(CommandHandler("ajuda", self.cmd_help))
        self.app.add_handler(CommandHandler("help", self.cmd_help))
        
        # Navegacao
        self.app.add_handler(CommandHandler("pwd", self.cmd_pwd))
        self.app.add_handler(CommandHandler("ls", self.cmd_ls))
        self.app.add_handler(CommandHandler("cd", self.cmd_cd))
        self.app.add_handler(CommandHandler("abrir", self.cmd_open))
        self.app.add_handler(CommandHandler("abre", self.cmd_open))
        
        # Arquivos
        self.app.add_handler(CommandHandler("ler", self.cmd_read))
        self.app.add_handler(CommandHandler("read", self.cmd_read))
        self.app.add_handler(CommandHandler("editar", self.cmd_edit))
        self.app.add_handler(CommandHandler("edit", self.cmd_edit))
        self.app.add_handler(CommandHandler("escrever", self.cmd_write))
        self.app.add_handler(CommandHandler("write", self.cmd_write))
        
        # Git
        self.app.add_handler(CommandHandler("git", self.cmd_git))
        self.app.add_handler(CommandHandler("commit", self.cmd_commit))
        self.app.add_handler(CommandHandler("push", self.cmd_push))
        self.app.add_handler(CommandHandler("pull", self.cmd_pull))
        self.app.add_handler(CommandHandler("status_git", self.cmd_git_status))
        
        # Projetos rapidos
        self.app.add_handler(CommandHandler("shandon", self.cmd_project_shandon))
        self.app.add_handler(CommandHandler("ig", self.cmd_project_ig))
        self.app.add_handler(CommandHandler("projetos", self.cmd_projects))
        
        # OSINT
        self.app.add_handler(CommandHandler("pesquisar", self.cmd_search))
        self.app.add_handler(CommandHandler("buscar", self.cmd_search))
        self.app.add_handler(CommandHandler("google", self.cmd_google))
        
        # Sistema
        self.app.add_handler(CommandHandler("status", self.cmd_status))
        self.app.add_handler(CommandHandler("hora", self.cmd_time))
        self.app.add_handler(CommandHandler("executar", self.cmd_exec))
        self.app.add_handler(CommandHandler("run", self.cmd_exec))
        
        # Handler para mensagens
        self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.msg_handler))
        self.app.add_handler(MessageHandler(filters.PHOTO, self.photo_handler))
    
    # ========== COMANDOS PRINCIPAIS ==========
    
    async def cmd_start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user = update.effective_user
        msg = f"""
```
╔════════════════════════════════════════════════════╗
║                                                  ║
║   ░██████╗░█████╗░██╗░░░██╗██╗██████╗░████████╗ ║
║   ██╔════╝██╔══██╗██║░░░██║██║██╔══██╗╚══██╔══╝ ║
║   ╚█████╗░██║░░╚═╝██║░░░██║██║██████╔╝░░░██║░░░ ║
║   ░╚═══██╗██║░░██╗██║░░░██║██║██╔══██╗░░░██║░░░ ║
║   ██████╔╝╚█████╔╝╚██████╔╝██║██║░░██║░░░██║░░░ ║
║   ╚═════╝░░╚════╝░░╚═════╝╚═╝╚═╝░░╚═╝░░░╚═╝░░░ ║
║                                                  ║
║          AGENTE PESSOAL - TELEGRAM               ║
║                                                  ║
╚════════════════════════════════════════════════════╝
```

Ola {user.first_name}! Sou o OpenCode.

Sou exatamente o agente que voce tem no Termux,
mas agora aqui no Telegram!

COMO EU FUNCIONO:
- Me mande qualquer mensagem que eu respondo
- Use comandos para acoes rapidas
- Eu leio, edito, crio arquivos
- Executo comandos no sistema
- Trabalho com seus projetos

COMANDOS RAPIDOS:
/projetos - Ver seus projetos
/shandon - Abrir projeto Shandon
/ig - Abrir projeto Instagram Monitor
/status - Ver status do sistema
/pesquisar [algo] - Pesquisar na web

EXEMPLOS:
/shandon
/ler README.md
/git status
/pesquisar como fazer bolo
/executar ls -la

Mande qualquer coisa que eu ajudo! 🚀
"""
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    async def cmd_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        msg = """
╔════════════════════════════════════════════════════╗
║              GUIA DE COMANDOS                     ║
╚════════════════════════════════════════════════════╝

📂 NAVEGACAO:
/pwd - Pasta atual
/ls - Listar arquivos
/cd [pasta] - Mudar de pasta
/abrir [pasta] - Abrir e ver conteudo

📄 ARQUIVOS:
/ler [arquivo] - Ler arquivo
/editar [arquivo] [conteudo] - Editar arquivo
/escrever [arquivo] [conteudo] - Criar arquivo

🔧 GIT:
/git [comando] - Comando Git
/commit [msg] - Git add + commit
/push - Git push
/pull - Git pull
/status_git - Git status

📁 PROJETOS:
/projetos - Listar projetos
/shandon - Abrir Shandon Elite
/ig - Abrir Instagram Monitor

🔍 PESQUISA:
/pesquisar [algo] - Pesquisar
/buscar [algo] - Pesquisar
/google [algo] - Google

⚙️ SISTEMA:
/status - Status do sistema
/hora - Hora atual
/executar [cmd] - Executar comando

💬 TAMBEM FUNCIONA:
- Me mande texto normal
- Me mande fotos que eu analiso
- Me mande arquivos que eu leio

EXEMPLO COMPLETO:
1. /shandon (abre o projeto)
2. /ls (ve os arquivos)
3. /ler package.json (le o arquivo)
4. /git status (ve status do git)
5. /commit "feat: nova funcionalidade"
6. /push (envia pro GitHub)
"""
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    # ========== NAVEGACAO ==========
    
    async def cmd_pwd(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(f"📂 `{self.current_dir}`", parse_mode='Markdown')
    
    async def cmd_ls(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        try:
            pasta = context.args[0] if context.args else self.current_dir
            itens = os.listdir(pasta)
            
            msg = f"📁 **{os.path.basename(pasta) or pasta}:**\n\n"
            
            pastas = sorted([i for i in itens if os.path.isdir(os.path.join(pasta, i))])
            arquivos = sorted([i for i in itens if os.path.isfile(os.path.join(pasta, i))])
            
            for p in pastas[:15]:
                msg += f"📁 `{p}/`\n"
            for a in arquivos[:10]:
                msg += f"📄 `{a}`\n"
            
            total = len(pastas) + len(arquivos)
            if total > 25:
                msg += f"\n... e mais {total-25} itens"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_cd(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text(f"📂 Atual: `{self.current_dir}`", parse_mode='Markdown')
            return
        
        pasta = context.args[0]
        
        if pasta == '..':
            self.current_dir = os.path.dirname(self.current_dir)
        elif pasta.startswith('/'):
            self.current_dir = pasta
        else:
            self.current_dir = os.path.join(self.current_dir, pasta)
        
        if not os.path.exists(self.current_dir):
            self.current_dir = os.path.dirname(self.current_dir)
            await update.message.reply_text(f"❌ Pasta nao existe. Mantendo: `{self.current_dir}`", parse_mode='Markdown')
            return
        
        await update.message.reply_text(f"📂 Agora em: `{self.current_dir}`", parse_mode='Markdown')
    
    async def cmd_open(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Uso: /abrir [pasta]\nExemplo: /abrir shandon")
            return
        
        pasta = context.args[0]
        
        # Verificar se e um projeto conhecido
        if pasta.lower() in PROJECTS:
            self.current_dir = PROJECTS[pasta.lower()]
            pasta = self.current_dir
        
        if not os.path.exists(pasta):
            await update.message.reply_text(f"❌ Pasta nao encontrada: {pasta}")
            return
        
        try:
            itens = os.listdir(pasta)
            msg = f"📁 **{os.path.basename(pasta)}**\n\n"
            
            pastas = sorted([i for i in itens if os.path.isdir(os.path.join(pasta, i))])[:10]
            arquivos = sorted([i for i in itens if os.path.isfile(os.path.join(pasta, i))])[:10]
            
            for p in pastas:
                msg += f"📁 `{p}/`\n"
            for a in arquivos:
                msg += f"📄 `{a}`\n"
            
            msg += f"\n📂 `{pasta}`"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    # ========== ARQUIVOS ==========
    
    async def cmd_read(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Uso: /ler [arquivo]\nExemplo: /ler README.md")
            return
        
        arquivo = context.args[0]
        caminho = os.path.join(self.current_dir, arquivo)
        
        if not os.path.exists(caminho):
            await update.message.reply_text(f"❌ Arquivo nao encontrado: {arquivo}")
            return
        
        try:
            with open(caminho, 'r', encoding='utf-8', errors='ignore') as f:
                conteudo = f.read()
            
            if len(conteudo) > 3000:
                conteudo = conteudo[:3000] + "\n\n... (truncado)"
            
            msg = f"📄 **{arquivo}**\n\n```\n{conteudo}\n```"
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_edit(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if len(context.args) < 2:
            await update.message.reply_text("Uso: /editar [arquivo] [conteudo]\nExemplo: /editar arquivo.txt novo conteudo")
            return
        
        arquivo = context.args[0]
        conteudo = ' '.join(context.args[1:])
        caminho = os.path.join(self.current_dir, arquivo)
        
        try:
            with open(caminho, 'w', encoding='utf-8') as f:
                f.write(conteudo)
            await update.message.reply_text(f"✅ Salvo: `{arquivo}`", parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_write(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await self.cmd_edit(update, context)
    
    # ========== GIT ==========
    
    async def cmd_git(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Uso: /git [comando]\nExemplo: /git status")
            return
        
        try:
            result = subprocess.run(
                ['git'] + context.args,
                capture_output=True, text=True, timeout=30,
                cwd=self.current_dir
            )
            
            msg = f"🔧 `git {' '.join(context.args)}`\n\n"
            if result.stdout:
                msg += f"```\n{result.stdout[:2000]}\n```"
            if result.stderr:
                msg += f"\n⚠️ {result.stderr[:500]}"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_commit(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Uso: /commit [mensagem]")
            return
        
        msg = ' '.join(context.args)
        
        try:
            subprocess.run(['git', 'add', '.'], capture_output=True, cwd=self.current_dir)
            result = subprocess.run(
                ['git', 'commit', '-m', msg],
                capture_output=True, text=True, timeout=30,
                cwd=self.current_dir
            )
            
            await update.message.reply_text(f"✅ Commit: {msg}\n\n{result.stdout[:1000]}", parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_push(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        try:
            result = subprocess.run(['git', 'push'], capture_output=True, text=True, timeout=60, cwd=self.current_dir)
            await update.message.reply_text(f"🚀 Push!\n\n{result.stdout[:1000]}\n{result.stderr[:500]}", parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_pull(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        try:
            result = subprocess.run(['git', 'pull'], capture_output=True, text=True, timeout=60, cwd=self.current_dir)
            await update.message.reply_text(f"📥 Pull!\n\n{result.stdout[:1000]}", parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_git_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        try:
            result = subprocess.run(['git', 'status'], capture_output=True, text=True, timeout=15, cwd=self.current_dir)
            await update.message.reply_text(f"📊 **Git Status:**\n\n```\n{result.stdout[:2000]}\n```", parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    # ========== PROJETOS ==========
    
    async def cmd_projects(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        msg = """
📁 **SEUS PROJETOS:**

/shandon - **Shandon Elite**
  → OSINT Dashboard
  → GitHub: sramorim/shandon-elite

/ig - **Instagram Monitor**
  → Monitoramento Instagram
  → GitHub: (seu repositorio)

**Outros projetos:**
"""
        for nome, caminho in PROJECTS.items():
            if os.path.exists(caminho):
                msg += f"\n• `{nome}` → `{caminho}`"
        
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    async def cmd_project_shandon(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        self.current_dir = PROJECTS['shandon']
        await self.cmd_open(update, context)
    
    async def cmd_project_ig(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        self.current_dir = PROJECTS['ig']
        await self.cmd_open(update, context)
    
    # ========== SISTEMA ==========
    
    async def cmd_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        try:
            result = subprocess.run(['uname', '-a'], capture_output=True, text=True, timeout=5)
            uptime = subprocess.run(['uptime', '-p'], capture_output=True, text=True, timeout=5)
            
            msg = f"""
```
╔════════════════════════════════════════════════════╗
║              STATUS DO SISTEMA                    ║
╚════════════════════════════════════════════════════╝
```

🖥️ `{result.stdout.strip()}`
⏱️ `{uptime.stdout.strip()}`

📂 **Pasta atual:** `{self.current_dir}`
🤖 **Status:** Online!

Use `/projetos` para ver seus projetos.
"""
            await update.message.reply_text(msg, parse_mode='Markdown')
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    async def cmd_time(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        agora = datetime.now()
        msg = f"🕐 **{agora.strftime('%H:%M:%S')}**\n📅 {agora.strftime('%d/%m/%Y')}"
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    async def cmd_exec(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Uso: /executar [comando]\nExemplo: /executar ls -la")
            return
        
        cmd = ' '.join(context.args)
        
        try:
            result = subprocess.run(
                cmd, shell=True,
                capture_output=True, text=True, timeout=30,
                cwd=self.current_dir
            )
            
            msg = f"⚡ `{cmd}`\n\n"
            if result.stdout:
                msg += f"```\n{result.stdout[:2000]}\n```"
            if result.stderr:
                msg += f"\n⚠️ {result.stderr[:500]}"
            
            await update.message.reply_text(msg, parse_mode='Markdown')
        except subprocess.TimeoutExpired:
            await update.message.reply_text("⏰ Comando demorou muito (>30s)")
        except Exception as e:
            await update.message.reply_text(f"❌ {str(e)}")
    
    # ========== PESQUISA ==========
    
    async def cmd_search(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        if not context.args:
            await update.message.reply_text("Uso: /pesquisar [algo]")
            return
        
        query = ' '.join(context.args)
        msg = f"🔍 **{query}**\n\n"
        msg += f"🔗 [Google](https://www.google.com/search?q={query.replace(' ', '+')})\n"
        msg += f"🔗 [YouTube](https://www.youtube.com/results?search_query={query.replace(' ', '+')})\n"
        msg += f"🔗 [GitHub](https://github.com/search?q={query.replace(' ', '+')})"
        
        await update.message.reply_text(msg, parse_mode='Markdown')
    
    async def cmd_google(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await self.cmd_search(update, context)
    
    # ========== HANDLERS DE MENSAGEM ==========
    
    async def msg_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        text = update.message.text.lower()
        
        # Comandos rapidos em texto
        if text.startswith('abrir ') or text.startswith('abre '):
            pasta = text.split(' ', 1)[1]
            context.args = [pasta]
            await self.cmd_open(update, context)
            return
        
        if text.startswith('ler '):
            arquivo = text.split(' ', 1)[1]
            context.args = [arquivo]
            await self.cmd_read(update, context)
            return
        
        if text.startswith('editar '):
            parts = text.split(' ', 2)
            if len(parts) >= 3:
                context.args = [parts[1], parts[2]]
                await self.cmd_edit(update, context)
                return
        
        if text.startswith('git '):
            cmd = text.split(' ', 1)[1]
            context.args = cmd.split()
            await self.cmd_git(update, context)
            return
        
        if text.startswith('executar ') or text.startswith('run '):
            cmd = text.split(' ', 1)[1]
            context.args = [cmd]
            await self.cmd_exec(update, context)
            return
        
        # Respostas智能
        if 'ola' in text or 'oi' in text or 'hello' in text:
            await update.message.reply_text("Ola! Sou o OpenCode. Como posso ajudar?\n\nUse /ajuda para ver os comandos.")
            return
        
        if 'obrigad' in text:
            await update.message.reply_text("De nada! Estou aqui se precisar. 🚀")
            return
        
        if 'status' in text:
            context.args = []
            await self.cmd_status(update, context)
            return
        
        # Se mencionar projeto
        if 'shandon' in text:
            context.args = []
            await self.cmd_project_shandon(update, context)
            return
        
        if 'instagram' in text or 'ig monitor' in text:
            context.args = []
            await self.cmd_project_ig(update, context)
            return
        
        # Resposta generica
        await update.message.reply_text(
            f"Entendi! Posso ajudar com isso.\n\n"
            f"Mensagem recebida: `{update.message.text[:50]}...`\n\n"
            f"Use /ajuda para ver o que posso fazer!",
            parse_mode='Markdown'
        )
    
    async def photo_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text("📸 Foto recebida! Analise de imagem em breve.")
    
    # ========== INICIALIZACAO ==========
    
    async def post_init(self, application: Application):
        await application.bot.set_my_commands([
            BotCommand("start", "Iniciar agente"),
            BotCommand("ajuda", "Ver comandos"),
            BotCommand("projetos", "Ver projetos"),
            BotCommand("shandon", "Abrir Shandon"),
            BotCommand("ig", "Abrir Instagram Monitor"),
            BotCommand("status", "Status do sistema"),
            BotCommand("git", "Comandos Git"),
            BotCommand("pesquisar", "Pesquisar na web"),
        ])
    
    def run(self):
        print("""
```
╔════════════════════════════════════════════════════╗
║                                                  ║
║   ░██████╗░█████╗░██╗░░░██╗██╗██████╗░████████╗ ║
║   ██╔════╝██╔══██╗██║░░░██║██║██╔══██╗╚══██╔══╝ ║
║   ╚█████╗░██║░░╚═╝██║░░░██║██║██████╔╝░░░██║░░░ ║
║   ░╚═══██╗██║░░██╗██║░░░██║██║██╔══██╗░░░██║░░░ ║
║   ██████╔╝╚█████╔╝╚██████╔╝██║██║░░██║░░░██║░░░ ║
║   ╚═════╝░░╚════╝░░╚═════╝╚═╝╚═╝░░╚═╝░░░╚═╝░░░ ║
║                                                  ║
║          INICIANDO NO TELEGRAM...                 ║
║                                                  ║
╚════════════════════════════════════════════════════╝
```
        """)
        
        self.app.post_init = self.post_init
        self.app.run_polling(allowed_updates=Update.ALL_TYPES)

def main():
    if BOT_TOKEN == 'SEU_TOKEN_AQUI':
        print("❌ Configure TELEGRAM_BOT_TOKEN no .env")
        print("\n1. Abra Telegram")
        print("2. Busque @BotFather")
        print("3. Envie /newbot")
        print("4. Copie o token para .env")
        sys.exit(1)
    
    bot = OpenCodeBot()
    bot.run()

if __name__ == '__main__':
    main()
