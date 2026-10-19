# SHANDON ELITE

Plataforma OSINT profissional para investigação e inteligência digital.

## Sobre

O **SHANDON ELITE** é uma plataforma de inteligência digital profissional que oferece ferramentas de OSINT (Open Source Intelligence) para investigação de usernames, e-mails, telefones, IPs, domínios, redes sociais, vazamentos e mais.

**Desenvolvido por:** Daniel Amorim  
**Versão:** 2.0  
**Licença:** Proprietária

## Funcionalidades

### Módulos OSINT
- Username Enumeration (119+ plataformas)
- Password Leak Check
- Social Media Check
- Google Dorks
- Subdomain Finder
- Wayback Machine Check
- SSL Certificate Tracker
- Port Scanner
- Email Header Analysis
- Telegram OSINT
- IP Intelligence
- Domain Intelligence
- Breach Check
- Phone OSINT
- Crypto Check
- Exposed Database Search
- Image Forensics

### Redes Sociais
- Instagram (público + autenticado)
- Facebook
- TikTok
- Telegram

### Módulos Premium
- Dark Web Dashboard
- Advanced Dorks
- Bulk Scanner
- Email Trace
- Metadata Extractor
- Wayback Pro
- SSL History
- Correlation Engine
- Timeline

### Segurança
- Autenticação JWT
- Rate Limiting
- Security Headers
- CORS configurado

## Tecnologias

- **Frontend:** Next.js 16, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Banco de Dados:** JSON file (migando para SQLite)
- **Autenticação:** JWT (jose), cookies httpOnly
- **Mobile:** Capacitor (Android)
- **Deploy:** Render.com (Docker)
- **CI/CD:** GitHub Actions

## Instalação

```bash
# Clonar repositório
git clone https://github.com/sramorim/shandon-elite.git
cd shandon-elite

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar em produção
npm start
```

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `JWT_SECRET` | Segredo para tokens JWT | Sim (produção) |
| `SHANDON_API_KEY` | Chave de API das rotas. **Vazio deixa as 27 rotas abertas** | Sim (produção) |
| `SHANDON_ADMIN_KEY` | Senha do painel `/admin`. Fica só no servidor | Sim (para usar o admin) |
| `SHANDON_ADMIN_EMAILS` | E-mails liberados como admin, separados por vírgula | Sim (para usar o admin) |
| `ALLOWED_ORIGIN` | Origin permitida para CORS | Sim |
| `RATE_LIMIT_WINDOW_MS` | Janela de rate limiting (ms) | Não |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo de requisições por janela | Não |
| `PORT` | Porta do servidor | Não |
| `NODE_ENV` | Ambiente (production/development) | Sim |
| `NEXT_PUBLIC_SHANDON_API_BASE` | Base alternativa para o **navegador**. Deixe vazio para usar a própria origem | Não |
| `CENTRAL_API_BASE` | Base da Central Amorim, usada no servidor só pelo Instagram | Não (tem padrão) |

> `NEXT_PUBLIC_ADMIN_KEY` foi removida de propósito. O prefixo `NEXT_PUBLIC_`
> embute o valor no bundle do navegador, então a senha do painel ficava
> legível no DevTools por qualquer pessoa. Use `SHANDON_ADMIN_KEY`.


## Estrutura do Projeto

```
shandon-elite/
├── app/                    # Next.js App Router
│   ├── api/               # Rotas de API (50 endpoints)
│   ├── admin/             # Painel administrativo
│   ├── login/             # Página de login
│   ├── register/          # Página de registro
│   ├── premium/           # Área premium
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React (81 arquivos)
├── lib/                   # Bibliotecas e utilitários (61 arquivos)
├── providers/             # Context providers
├── public/                # Assets estáticos
├── tests/                 # Testes (7 arquivos)
├── data/                  # Dados (JSON file)
├── android/               # Projeto Android (Capacitor)
├── docker-compose.yml     # Docker Compose
├── Dockerfile             # Dockerfile multi-stage
├── render.yaml            # Configuração Render.com
├── capacitor.config.ts    # Configuração Capacitor
└── package.json           # Dependências
```

## Deploy

### Render.com (Recomendado)

1. Conectar repositório ao Render
2. Configurar variáveis de ambiente
3. Deploy automático a cada push

### Docker

```bash
# Build da imagem
docker build -t shandon-elite .

# Executar
docker run -p 3000:3000 --env-file .env shandon-elite
```

### Android (APK)

```bash
# Build do APK via GitHub Actions
# Ou manualmente:
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

## API

### Autenticação

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha123"}'

# Registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Usuário","email":"user@example.com","password":"senha123"}'
```

### OSINT

Todas as rotas abaixo exigem `Authorization: Bearer $SHANDON_API_KEY` (ou o
header `X-API-Key`) quando `SHANDON_API_KEY` estiver configurada. Com a variável
vazia a API fica **aberta para qualquer pessoa** — não use assim em produção.

```bash
AUTH="Authorization: Bearer $SHANDON_API_KEY"

# Username Enumeration
curl -X POST http://localhost:3000/api/username-enum \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"username":"usuario"}'

# IP Intelligence
curl -X POST http://localhost:3000/api/ip-intel \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"ip":"8.8.8.8"}'

# Breach Check
curl -X POST http://localhost:3000/api/breach-check \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"email":"user@example.com"}'

# Busca por nome completo (gera usernames candidatos e mede em ~25 sites cada)
curl -X POST http://localhost:3000/api/search/name \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d '{"name":"Fulano de Tal"}'
```

## Testes

```bash
# Executar todos os testes
npm test

# Testes verbosos
npm run test:verbose
```

## Segurança

- Autenticação JWT com cookies httpOnly
- Rate limiting configurável
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- CORS restrito
- Validação de entrada em todas as APIs

## Roadmap

- [ ] Banco de dados real (SQLite/PostgreSQL)
- [ ] Gateway de pagamento (Mercado Pago)
- [ ] Deploy automático via GitHub Actions
- [ ] Monitoramento de erros (Sentry)
- [ ] Testes E2E
- [ ] Documentação da API (Swagger/OpenAPI)
- [ ] Modo offline para ferramentas básicas

## Contribuições

Contribuições são bem-vindas! Abra uma issue ou pull request.

## Contato

- **Desenvolvedor:** Daniel Amorim
- **Instagram:** @Sr__Amorim
- **GitHub:** https://github.com/sramorim

---

**SHANDON ELITE v2.0** — Public Intelligence Platform
