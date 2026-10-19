# Relatório — Shandon Elite

**Data:** 27/09/2026
**Origem:** screenshots Android + OCR + leitura do código
**Estado:** correções feitas e validadas localmente. **Push e deploy não foram feitos** (ver "O que falta").

---

## 1. Resumo

O site estava com 4 problemas independentes, e **o principal não era o que parecia**.

| # | Problema | Gravidade |
|---|----------|-----------|
| 1 | Tela de Investigação Anônima falhava com "Falha na conexão" | Alta — tela inutilizável |
| 2 | Busca por nome não existia (tratava nome como username) | Alta — funcionalidade pedida, ausente |
| 3 | Senha do painel admin exposta no JavaScript do navegador | Crítica — qualquer pessoa lia a senha |
| 4 | Rotas do menu prometiam dados que não eram entregues | Média — enganava o usuário |

---

## 2. O que estava quebrado (com evidência)

### 2.1 "Falha na conexão" na Investigação Anônima

**Evidência:** `Screenshot_20260927-104652.png` (OCR: "Falha na conexão").

**Cadeia da falha:**

1. Os componentes usavam uma constante `CF_API_BASE` cujo padrão era `https://senhoramorim.com.br`.
2. Esse servidor **não tem as rotas** que a tela chamava. Testado em produção:
   - `POST /api/username-enum` → **404 com corpo vazio**
   - 10 das 12 ferramentas da tela → **404**
3. O componente fazia `await res.json()` no corpo vazio → `SyntaxError` → "Falha na conexão".

**O que NÃO era o problema:** CORS. O preflight de `senhoramorim.com.br` responde
corretamente com `Access-Control-Allow-Origin`. A causa era a ausência das rotas,
não política de origem.

Ferramentas que quebravam: `username-enum`, `breach-check`, `ip-intel`,
`domain-intel`, `image-forensics`, `social-check`, `telegram-osint`,
`wayback-check`, `subdomain-finder`, `ssl-tracker`, `search/username`,
`instagram/public`.

### 2.2 O deploy está desatualizado

- `origin/main` está em `2044cc9`.
- A correção anterior (`e2260d1`, bloqueio de plataforma) **está só no celular** —
  nunca foi para o GitHub.

Ou seja: mesmo o que já estava consertado não estava no ar. Confirmado pelo
`screenshot_20260927-105642.png`.

### 2.3 Senha do admin no navegador

O painel comparava a senha contra `NEXT_PUBLIC_ADMIN_KEY` **dentro do cliente**.
O prefixo `NEXT_PUBLIC_` faz o Next.js escrever o valor no bundle JavaScript.
Basta abrir o DevTools e ler a senha. A tela também guardava a sessão em
`sessionStorage` com o mesmo valor da senha.

Não havia servidor envolvido nessa autenticação.

### 2.4 Menu prometendo o que não existia

| Item do menu | Prometia | Entregava |
|---|---|---|
| Perfil Público (Instagram) | "Bio, posts, dados públicos" | Uma busca de username genérica |
| Seguidores | "Até 30 perfis" | A mesma busca de username |
| Snapshots | "Comparar estado do perfil" | A mesma busca de username |

Três itens que prometiam três coisas diferentes renderizavam o mesmo componente,
que nem era de Instagram. E o `components/sh-instagram-profundo.tsx` — a peça que
realmente buscaria o perfil — estava **fora do repositório, sem ligação com o
menu**, e com tipos incompatíveis com a rota que chamava.

---

## 3. O que foi feito

### 3.1 Cliente de API (`lib/api-client.ts`, novo)

- Chama a **própria origem** primeiro. `senhoramorim.com.br` só é usado se
  `NEXT_PUBLIC_SHANDON_API_BASE` for configurada de propósito.
- Falha de rede ou HTTP ≠ 200 cai no destino secundário, se houver.
- Corpo vazio ou HTML inválido não vira mais `SyntaxError`: vira erro legível.
- Timeout de 45 s.

### 3.2 Componentes ligados ao cliente novo

`sh-anon-investigation`, `sh-universal-search`, `sh-phone-osint`,
`sh-crypto-check`, `sh-whatsapp-lookup`, `sh-instagram-profundo`.

### 3.3 Busca por nome completo (novo)

- `lib/name-to-usernames.ts` — gera candidatos a partir do nome: `primeiro.ultimo`,
  `primeiro.sobrenome`, `primeiro_sobrenome`, `sobrenome.primeiro`, `inicial.sobrenome`,
  etc. Remove acentos e conectivos ("de", "da", "do"). Cada candidato sai com a
  **regra usada** e a **confiança** (70–88).
- `app/api/search/name/route.ts` — mede cada candidato em ~25 sites, providers
  sociais e Central do Instagram, e agrupa por plataforma.

**Limite honesto, exibido na tela:** nome não prova identidade. A tela mostra
qual username foi testado, com que regra e qual confiança. Usuários genéricos
(`amorimdaniel`, `damorim`) acerto mais plataformas por acaso — por isso a
confiança deles é menor.

### 3.4 Admin no servidor

- `app/api/admin/verify` — compara com `SHANDON_ADMIN_KEY` (segredo do servidor),
  comparação em tempo constante, trava de 5 tentativas. Sem a variável
  configurada o painel **fica fechado** (503), em vez de aceitar qualquer senha.
- `app/api/admin/session` — responde quem está logado.
- `app/api/admin/logout` — limpa o cookie httpOnly.
- `middleware.ts` — exige cookie admin válido em `/api/admin/*`, exceto
  `verify` e `logout`.
- `NEXT_PUBLIC_ADMIN_KEY` removida do código de propósito.

Fluxo testado de ponta a ponta: senha errada → 401 · senha certa → cookie ·
sessão → 200 · logout → sessão → 401.

### 3.5 Instagram e menu

- `sh-instagram-profundo.tsx` reescrito para a forma real da resposta da rota,
  ligado ao menu. Passa a mostrar também **e-mail, telefone e cidade** que a rota
  trazia e a tela ignorava.
- "Seguidores" e "Snapshots" marcados como não implementados, com descrição
  honesta, em vez de fingir que funcionam.
- `sh-private-module` apontava para o item desativado; agora aponta para
  "Comparação", que é a tela que realmente existe.

### 3.6 Navegação

- `?view=` na URL: menu e links externos abrem a ferramenta certa ao carregar.
  Antes o clique de link externo só trocava o estado em memória e a página
  nascia no dashboard.

### 3.7 Bugs de dados encontrados durante a validação

- **Veredito contraditório** na busca por nome: o resultado saía
  `exists: true, status: found` carregando no `extra` o veredito antigo do
  http-checker (`verdict: unavailable, motivo: timeout`). Corrigido: o `extra`
  é trocado, não mesclado, e registra qual motor confirmou.
- **Sujeira nos testes:** a limpeza apagava `data/snapshots/_test`, caminho que
  nenhum teste usa — os testes gravavam em `data/snapshots/<plataforma>/<user>`.
  Cada execução deixava ~145 arquivos. Agora 0.

---

## 4. Validação

| Checagem | Antes | Depois |
|---|---|---|
| Testes | 122 passando | **162 passando**, 0 falhando |
| `tsc --noEmit` | ok | **ok** |
| `eslint .` | 17 avisos | **0 erros, 17 avisos** (mesmos de antes) |
| Build de produção | — | **ok** (66/66 páginas, 0 erros) |
| Arquivos de lixo em `data/` por execução | ~145 | **0** |

Testes novos: 14 para o gerador de usernames, 26 para classificação de
plataforma bloqueada (não confundir bloqueio com "não existe").

Rotas novas confirmadas no build de produção:
`/api/admin/verify`, `/api/admin/session`, `/api/admin/logout`, `/api/search/name`.

**Testado contra servidor rodando:**
- `POST /api/username-enum` → 200 com resultados reais (era 404)
- `POST /api/search/name` → 200, 6 candidatos, 9 plataformas, aviso presente
- `GET /api/instagram/public` → 200 com dados reais
- Admin: verify/session/logout no fluxo completo

Detalhe do build: apareceu o aviso `[SHANDON] JWT_SECRET não definido — tokens
JWT inseguros`. É o build local sem `.env`. **Defina `JWT_SECRET` em produção.**


---

## 5. O que ficou pendente

### 5.1 Precisa de você (bloqueio real)

**O deploy está quebrado desde 26/09.** Os 3 últimos runs do workflow
`deploy-cloudflare.yml` falharam, todos com o mesmo erro: o wrangler não está
autenticado no CI. Os segredos `CLOUDFLARE_API_TOKEN` e
`CLOUDFLARE_ACCOUNT_ID` não existem no repositório
(`gh secret list` volta vazio).

Isso explica por que `e2260d1` nunca chegou ao ar: o código estava correto, o
que não funcionava era a publicação.

**Corrigi no código** (`src/worker.ts`): as variáveis cadastradas no painel do
Cloudflare chegam ao **Worker**, mas não passavam para o **container** — que é
quem roda o Next.js e quem lê `process.env.SHANDON_ADMIN_KEY`. Sem esse repasse,
configurar a senha do admin no painel não teria efeito e o painel continuaria
respondendo 503. Agora o container recebe todas as variáveis declaradas em
`src/env.d.ts`.

**O que ficou faltando não dá para fazer deste aparelho:**
o wrangler não roda em Android arm64 (`workerd` não tem binário para esta
plataforma). E o CI não tem as credenciais.

Quando você voltar, o caminho é:

**1.** Dar o push (eu já deixei os commits prontos e autenticados aqui):
```bash
cd ~/shandon-elite
git push origin main
```

**2.** Criar o token da Cloudflare e guardar os dois segredos:
- Cloudflare → My Profile → API Tokens → Create Token
  (template "Edit Cloudflare Workers", permissões de Workers Scripts + Account)
- No GitHub: Settings → Secrets and variables → **Actions** → *New repository
  secret*:
  - `CLOUDFLARE_API_TOKEN` = o token
  - `CLOUDFLARE_ACCOUNT_ID` = o ID da conta (aparece na mesma tela do token)

> Place no nível do **repositório**, não do ambiente `Production`. O workflow
> não declara `environment:`, então segredos de ambiente não seriam lidos.

**3.** Disparar de novo em *Actions → Deploy to Cloudflare → Run workflow*.

**4.** Antes disso, no Cloudflare (Workers & Pages → shandon-elite →
Settings → Variables and Secrets), defina:

| Variável | Tipo | Motivo |
|---|---|---|
| `SHANDON_ADMIN_KEY` | Secret | Senha do painel admin. Sem ela o painel fica fechado (por segurança). |
| `JWT_SECRET` | Secret | **Importante:** sem ela o app assina tokens com a string pública `INSECURE-FALLBACK-CHANGE-ME`, e qualquer pessoa forja token de premium. |
| `SHANDON_API_KEY` | Secret | **Vazio deixa as 28 rotas abertas para qualquer pessoa.** |
| `SHANDON_ADMIN_EMAILS` | Text | Opcional. Só carimba o e-mail no token. |

> A senha antiga do admin era pública — **troque a senha do admin**,
> mesmo que só você usasse. Ela estava no JavaScript da página.



### 5.2 Melhorias que não fiz (para depois)

- **`/api/search/name` leva ~35 s.** 6 candidatos × ~25 sites. Está dentro do
  limite de 60 s, mas é lento. Dá para paralelizar os candidatos ou baixar para
  4 sem perder qualidade.
- **`lib/username-enum.ts` faz só HEAD.** Páginas genéricas com HTTP 200 (o
  Telegram é o caso clássico) ainda podem virar falso positivo, porque sem corpo
  não dá para saber se é perfil ou página de erro.
- **Aviso do Next.js no build:** a convenção `middleware.ts` está depreciada em
  favor de `proxy.ts`. Ainda funciona.
- **`components/sh-instagram.tsx`** ficou sem uso (o item de menu que o usava
  virou `ShInstagramProfundo`). Pode apagar se quiser.
- `npm run build` falha no celular (Turbopack não existe para arm64). Criei
  `npm run build:webpack` e `npm run dev:webpack` para isso.

---

## 6. Arquivos

**Novos**
```
lib/api-client.ts
lib/name-to-usernames.ts
app/api/search/name/route.ts
app/api/admin/verify/route.ts
app/api/admin/session/route.ts
app/api/admin/logout/route.ts
components/sh-instagram-profundo.tsx
tests/name-to-usernames.test.ts
tests/bot-protection.test.ts
```

**Alterados**
```
middleware.ts                     .env.example   README.md   package.json
app/page.tsx                      app/premium/page.tsx
components/sh-menu.tsx            components/sh-private-module.tsx
components/admin/sh-admin-panel.tsx
components/sh-anon-investigation.tsx   components/sh-universal-search.tsx
components/sh-phone-osint.tsx          components/sh-crypto-check.tsx
components/sh-whatsapp-lookup.tsx      lib/cfapi.ts
lib/username-enum.ts                    tests/snapshot.test.ts
```
