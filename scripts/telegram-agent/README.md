# OPENCODE TELEGRAM

Seu agente pessoal no Telegram - exatamente como o opencode!

## COMO CONFIGURAR

### 1. Criar bot no Telegram

1. Abra Telegram
2. Busque: **@BotFather**
3. Envie: `/newbot`
4. Nome: **OpenCode Bot**
5. Username: **opencode_seu_nome** (ou similar)
6. Copie o TOKEN

### 2. Configurar

Edite o arquivo `.env`:
```
TELEGRAM_BOT_TOKEN=cole_token_aqui
```

### 3. Rodar

```bash
# Modo normal
./iniciar.sh

# Modo background (recomendado)
./background.sh
```

## COMO USAR

Abra o Telegram e busque seu bot. Mande `/start`!

### Comandos Principais

| Comando | O que faz |
|---------|-----------|
| `/start` | Iniciar |
| `/ajuda` | Ver comandos |
| `/shandon` | Abrir Shandon |
| `/ig` | Abrir Instagram Monitor |
| `/projetos` | Ver todos projetos |
| `/status` | Status do sistema |

### Navegacao

| Comando | O que faz |
|---------|-----------|
| `/pwd` | Pasta atual |
| `/ls` | Listar arquivos |
| `/cd [pasta]` | Mudar de pasta |
| `/abrir [pasta]` | Abrir pasta |

### Arquivos

| Comando | O que faz |
|---------|-----------|
| `/ler [arquivo]` | Ler arquivo |
| `/editar [arq] [txt]` | Editar arquivo |

### Git

| Comando | O que faz |
|---------|-----------|
| `/git status` | Status git |
| `/commit [msg]` | Fazer commit |
| `/push` | Enviar pro GitHub |

### Pesquisa

| Comando | O que faz |
|---------|-----------|
| `/pesquisar [algo]` | Pesquisar |
| `/google [algo]` | Google |

## EXEMPLOS

```
/shandon
/ler README.md
/git status
/commit "feat: nova coisa"
/push
/pesquisar como fazer bolo
/executar ls -la
```

## TAMBEM FUNCIONA

- Mande texto normal que eu respondo
- Mande fotos que eu analiso
- Mande arquivos que eu leio

## ARQUIVOS

- `opencode.py` - O agente
- `.env` - Configuracao
- `iniciar.sh` - Rodar
- `background.sh` - Rodar em background
- `parar.sh` - Parar

## COMPARACAO

| | Termux | Telegram |
|--|--------|----------|
| Onde roda | Celular | Nuvem/24h |
| Acesso | Abrir app | Mandar msg |
| Pratico | Mais ou menos | Muito! |

## DICAS

1. Use `/shandon` para ir direto pro projeto
2. Mande "git status" que eu executo
3. Mande "ler arquivo" que eu leio
4. Use `/projetos` para ver tudo
