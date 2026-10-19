# SHANDON ELITE — Nuvem própria (Oracle Cloud Free Tier)

Versão em português, passo a passo, pra quem não é da área técnica.

## Por quê
A hospedagem atual (Render, plano grátis) faz o app "dormir" depois de 15 min sem
visitas e tem limite de memória/CPU. Encaminhando para sua própria máquina no Oracle
Cloud Free Tier o app fica **acordado 24h**, **sem dormir**, **sem limite**, **grátis
pra sempre** (4 núcleos ARM / 24 GB RAM / 200 GB disco).

## Etapa A — Criar a conta Oracle (10 min — só você pode, é com seus dados)
1. Acesse https://signup.cloud.oracle.com e clique em **Start for free**.
2. Preencha com SEUS dados (nome, e-mail real, país **Brasil**).
3. Na parte de cartão: **informa um cartão de crédito só para VERIFICAÇÃO. NÃO é
   cobrado nada** — o Free Tier é realmente grátis e não gera faturas. (Se não tiver
   cartão, dá pra tentar um cartão pré-pago ou débito internacional; sem cartão, a
   Oracle não libera a conta.)
4. Confirme o e-mail e o código por SMS (vai pedir seu celular).
5. Escolha a **região São Paulo (Brazil East 1, "GRU")** — mais perto de você.
6. Pronto. Espere uns minutos pela "ordem de serviço" que chega por e-mail.

## Etapa B — Criar a máquina virtual (VM) grátis
1. Entre no console (cloud.oracle.com) → **Compute → Instances → Create instance**.
2. Nome: `shandon-vps`. Imagem: **Ubuntu 22.04 (Canonical)**.
3. Shape: aba **"Ampere"** → selecione **VM.Standard.A1.Flex** com **4 OCPU / 24 GB**.
   (Se aparecer "out of capacity", troque a máquina pra aq: aguarde alguns minutos e
   tente de novo — é normal no tier grátis.)
4. Em **Add SSH keys**: marque **Paste public keys** e cole a chave pública abaixo
   (é a mesma que você cola em qualquer tela de SSH):
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILYWv9ekCtu+TRVsqAvfI5Lgl9z0qTUkzdGZ7BcQ7h6C shandon-elite-vps
   ```
5. Clique **Create** e aguarde a instância ficar **"Running"**.
6. Anote o **IP público** dela e me mande aqui.

## Etapa C — Ambiente variável (.env)
Depois que a VM estiver no ar, preciso dos valores do **.env** que o app usa.
Pra não correr com segredo, EU gero senhas novas fortes nas variáveis
(SHANDON_API_KEY, JWT_SECRET, NEXT_PUBLIC_ADMIN_KEY); você só me informa se
algum desses valores JÁ é usado em outro lugar (ex.: bot do Telegram) pra eu
reaproveitar. A variável da RapidAPI (WHATSAPP) você me confirma se já tem a chave,
senão deixamos preparada e ligamos depois.

## Etapa D — DNS sem mudança
O endereço continua `https://elite.senhoramorim.com.br`. Vou apontar esse registro
do Cloudflare pro IP da sua VM (o Cloudflare continua na frente, escondendo teu IP e
dando HTTPS de graça). Nenhuma pessoa percebe mudança — mesmo link, agora sem dormir.

## Comandos operacionais (para mim)
- Subir tudo: `docker compose up --build -d`
- Ver logs: `docker compose logs -f`
- Reiniciar: `docker compose restart`
- Atualizar depois de novo código no repo: enviar novamente via rsync + `docker compose up --build -d`