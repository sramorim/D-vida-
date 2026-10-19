import { KNOWLEDGE_BASE } from './knowledge-base'

function normalize(text: string): string {
  return text.toLowerCase().trim()
}

function containsAny(text: string, keywords: string[]): boolean {
  const lower = normalize(text)
  return keywords.some(k => lower.includes(k))
}

function matchesPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(normalize(text)))
}

const GREETINGS = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi', 'hey', 'e aí', 'eai', 'fala', 'salve', 'opa']

const OFFTOPIC_KEYWORDS = [
  'receita de', 'como cozinhar', 'previsão do tempo', 'horóscopo', 'esportes',
  'futebol', 'jogo do', 'cinema', 'filme', 'série', 'música para ouvir',
  'onde comprar', 'preço do iphone', 'notícias de hoje', 'cotação do dólar',
  'traduzir', 'calcular', 'quanto é', 'gebra', 'matemática',
  'clima', 'tempo em', 'tempo hoje',
  'chef', 'culinária', 'restaurante',
  'jogos online', 'baixar jogo', 'download',
]

export function getResponse(userMessage: string, context?: { lastResults?: unknown }): string {
  const msg = normalize(userMessage)

  // Greetings
  if (matchesPattern(msg, GREETINGS.map(g => new RegExp(`^\\s*${g}[\\s!.,]*$`)))) {
    return "Olá! 😊 Sou o assistente do SHANDON ELITE. Posso ajudar com dúvidas sobre o projeto, explicar ferramentas ou analisar resultados. Como posso ajudar?"
  }

  // Off-topic check
  if (containsAny(msg, OFFTOPIC_KEYWORDS)) {
    return "Desculpe, só posso ajudar com dúvidas sobre o projeto **SHANDON ELITE**. Posso explicar ferramentas, resultados, conceitos de OSINT ou ajudar a navegar na plataforma. Como posso ajudar?"
  }

  // Project overview questions
  if (matchesPattern(msg, [
    /o que (é|e) (o |a |o|a )?shandon/i,
    /o que (é|e) isso/i,
    /o que (é|e) essa (ferramenta|plataforma|app)/i,
    /me explica (o que é|a plataforma)/i,
    /me conte sobre o projeto/i,
    /sobre o (projeto|shandon)/i,
    /para que serve/i,
    /qual o (objetivo|propósito|purpose)/i,
    /o que (eu )?faço com/i,
  ])) {
    return `**SHANDON ELITE** é uma plataforma OSINT (Open Source Intelligence) para investigação digital ética.\n\n${KNOWLEDGE_BASE.project.what}\n\n**Criado por:** ${KNOWLEDGE_BASE.project.who}\n\n**Objetivo:** ${KNOWLEDGE_BASE.project.purpose}\n\nQuer saber sobre alguma ferramenta específica?`
  }

  // Who created
  if (matchesPattern(msg, [
    /quem (criou|fez|desenvolveu|é o dono)/i,
    /quem é (daniel|sr.?amorim)/i,
    /autor|criador|dev|desenvolvedor/i,
  ])) {
    return `O SHANDON ELITE foi criado por **Daniel Amorim** (${KNOWLEDGE_BASE.project.who}).\n\nÉ uma plataforma OSINT gratuita para investigação digital ética.`
  }

  // Pricing / Plans
  if (matchesPattern(msg, [
    /preço|plano|assinatura|premium|pro|free|grátis|gratis|pago|custa/i,
    /quanto (custa|é)/i,
    /como (assinar|ganhar premium|virar pro)/i,
    /upgrade|upar|desbloquear/i,
  ])) {
    return `**Planos do SHANDON ELITE:**\n\n**🆓 Free (Gratuito):**\n• Scan básico de usernames (até 5 resultados)\n• Instagram/Facebook/TikTok modo público\n• Phone OSINT básico\n• Social Media Check\n• Password Leak Check\n• Breach Check\n\n**⚡ Premium (PRO):**\n• Scan estendido (50+ sites)\n• Instagram/Facebook/TikTok avançado\n• Comentários e Top Likers\n• Dark Web Monitor\n• Correlation Engine\n• Google Dorks avançados\n• Subdomain Finder\n• SSL Tracker\n• Port Scanner\n• Image Forensics\n• Email Header Analyzer\n• Exposed DB Finder\n• Crypto Check\n• Radar de monitoramento\n• Dashboard avançado\n\nQuer saber mais sobre alguma ferramenta específica?`
  }

  // Username Enumerator
  if (matchesPattern(msg, [
    /username (enum|enumerator|scan|busca|verific)/i,
    /enumerate.*username/i,
    /verificar.*username/i,
    /username.*existe/i,
    /scan.*sites/i,
    /buscar.*username/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.username_enum
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n**Limite Free:** ${t.freeLimit}\n\nBasta ir na aba de módulos, selecionar "Username Scan", digitar o nome e clicar em Buscar!`
  }

  // Password Leak
  if (matchesPattern(msg, [
    /password.*leak/i,
    /senha.*vazamento/i,
    /verificar.*senha/i,
    /minha senha.*vazou/i,
    /senhas vazad/i,
    /pwned.*password/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.password_leak
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n**Níveis de risco:**\n• 🟢 Nenhum: 0 ocorrências\n• 🟡 Baixo: menos de 10\n• 🟠 Médio: 10-999\n• 🔴 Alto: 1.000-99.999\n• 🔴 Crítico: 100.000+\n\n**Segurança:** Sua senha NUNCA é enviada ao servidor. O hash SHA-1 é calculado no navegador.`
  }

  // Breach Check
  if (matchesPattern(msg, [
    /breach.*check/i,
    /email.*vazamento/i,
    /email.*comprometido/i,
    /email.*vazou/i,
    /have i been/i,
    /vazamento.*email/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.breach_check
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n**Tipos de dados expostos:** ${t.dataClasses}`
  }

  // Instagram
  if (matchesPattern(msg, [
    /instagram/i,
    /insta/i,
    /perfil.*insta/i,
    /stories/i,
    /seguidores.*insta/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.instagram
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n**Modo Free:** ${t.freeLimit}\n**Premium:** ${t.premium}`
  }

  // Facebook
  if (matchesPattern(msg, [
    /facebook/i,
    /fb/i,
    /perfil.*facebook/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.facebook
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n**Premium:** ${t.premium}`
  }

  // TikTok
  if (matchesPattern(msg, [
    /tiktok/i,
    /tik tok/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.tiktok
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n**Premium:** ${t.premium}`
  }

  // Phone OSINT
  if (matchesPattern(msg, [
    /phone/i,
    /telefone/i,
    /número.*telefone/i,
    /celular/i,
    /whatsapp.*number/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.phone_osint
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Social Check
  if (matchesPattern(msg, [
    /social.*check/i,
    /social.*media/i,
    /redes.*sociais/i,
    /verificar.*redes/i,
    /múltiplas.*plataforma/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.social_check
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Domain Intel
  if (matchesPattern(msg, [
    /domain.*intel/i,
    /domínio/i,
    /dominio/i,
    /whois/i,
    /dns/i,
    /análise.*domínio/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.domain_intel
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // IP Intel
  if (matchesPattern(msg, [
    /ip.*intel/i,
    /geolocal/i,
    /endereço ip/i,
    /ip.*address/i,
    /rastrear.*ip/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.ip_intel
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Subdomain
  if (matchesPattern(msg, [
    /subdomain/i,
    /subdomínio/i,
    /subdominio/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.subdomain_finder
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // SSL
  if (matchesPattern(msg, [
    /ssl/i,
    /certificado/i,
    /certificate/i,
    /https.*cert/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.ssl_tracker
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Port Scanner
  if (matchesPattern(msg, [
    /port.*scan/i,
    /scan.*port/i,
    /portas abertas/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.port_scanner
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Google Dorks
  if (matchesPattern(msg, [
    /google.*dork/i,
    /dork/i,
    /busca.*avançada/i,
    /pesquisa.*google/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.google_dorks
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n**Categorias:** ${t.categories}`
  }

  // Image Forensics
  if (matchesPattern(msg, [
    /image.*forensic/i,
    /forensic.*image/i,
    /metadado.*imagem/i,
    /exif/i,
    /imagem.*foto/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.image_forensics
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Email Header
  if (matchesPattern(msg, [
    /email.*header/i,
    /header.*email/i,
    /cabeçalho.*email/i,
    /analisar.*email/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.email_header
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Exposed DB
  if (matchesPattern(msg, [
    /exposed.*db/i,
    /banco.*exposto/i,
    /firebase.*exposto/i,
    /mongodb.*exposto/i,
    /elasticsearch.*exposto/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.exposed_db
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Telegram
  if (matchesPattern(msg, [
    /telegram/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.telegram_osint
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Wayback
  if (matchesPattern(msg, [
    /wayback/i,
    /archive/i,
    /internet archive/i,
    /snapshot.*url/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.wayback_check
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Crypto Check
  if (matchesPattern(msg, [
    /crypto/i,
    /bitcoin/i,
    /ethereum/i,
    /blockchain/i,
    /carteira.*crypto/i,
    /wallet/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.crypto_check
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Correlation Engine
  if (matchesPattern(msg, [
    /correlat/i,
    /engine.*correl/i,
    /cruzar.*dados/i,
    /conexão.*fontes/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.correlation_engine
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n⚡ Disponível no plano Premium.`
  }

  // Bulk Scanner
  if (matchesPattern(msg, [
    /bulk.*scan/i,
    /scanner.*bulk/i,
    /múltiplos.*alvos/i,
    /lista.*alvos/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.bulk_scanner
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}\n\n⚡ Disponível no plano Premium.`
  }

  // Dark Web
  if (matchesPattern(msg, [
    /dark.*web/i,
    /deep.*web/i,
    /darkweb/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.darkweb
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n⚡ **${t.premium}**`
  }

  // Radar
  if (matchesPattern(msg, [
    /radar/i,
    /monitoramento/i,
    /alerta/i,
    /monitor.*perfil/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.radar
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n⚡ **${t.premium}**`
  }

  // Snapshot / Comparison
  if (matchesPattern(msg, [
    /snapshot/i,
    /comparar.*perfis/i,
    /comparação/i,
    /diferença/i,
    /antes.*depois/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.snapshot
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Presence Summary
  if (matchesPattern(msg, [
    /presence/i,
    /resumo.*presença/i,
    /presença.*digital/i,
    /perfil.*resumo/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.presence_summary
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // Timeline
  if (matchesPattern(msg, [
    /timeline/i,
    /linha do tempo/i,
    /cronolog/i,
  ])) {
    const t = KNOWLEDGE_BASE.tools.timeline
    return `**${t.name}**\n\n**O que faz:** ${t.what}\n\n**Como usar:** ${t.how}\n\n**Resultados:** ${t.result}`
  }

  // OSINT concepts
  if (matchesPattern(msg, [
    /o que é osint/i,
    /o que significa osint/i,
    /open source intelligence/i,
    /inteligência.*fontes abertas/i,
  ])) {
    return `**OSINT** = **O**pen **S**ource **Int**elligence\n\n${KNOWLEDGE_BASE.concepts.osint}\n\nExemplos de fontes OSINT:\n• Redes sociais (perfis públicos)\n• Registros WHOIS de domínios\n• Logs de certificados SSL\n• Vazamentos de dados (HIBP)\n• Arquivo da Internet (Wayback)\n• Imagens com metadados EXIF\n• Registros DNS públicos\n• Headers de email`
  }

  // What is footprint
  if (matchesPattern(msg, [
    /footprint/i,
    /rastro.*digital/i,
    /pegada.*digital/i,
  ])) {
    return `**Footprint Digital**\n\n${KNOWLEDGE_BASE.concepts.footprint}\n\nO SHANDON ELITE ajuda a mapear o footprint digital de uma pessoa verificando múltiplas plataformas e fontes de dados.`
  }

  // What is breach
  if (matchesPattern(msg, [
    /o que é.*breach/i,
    /o que.*vazamento.*dados/i,
    /data breach/i,
  ])) {
    return `**Data Breach (Vazamento de Dados)**\n\n${KNOWLEDGE_BASE.concepts.breach}\n\nO SHANDON ELITE verifica se seu email/senha apareceu em vazamentos conhecidos usando a API do Have I Been Pwned.`
  }

  // What is dorking
  if (matchesPattern(msg, [
    /o que.*dork/i,
    /google dork/i,
    /dorking/i,
  ])) {
    return `**Google Dorking**\n\n${KNOWLEDGE_BASE.concepts.dorking}\n\nO SHANDON ELITE gera consultas Dork prontas para diferentes categorias: LinkedIn, GitHub, Twitter, Facebook, arquivos expostos, etc.`
  }

  // What is EXIF
  if (matchesPattern(msg, [
    /o que é.*exif/i,
    /metadado/i,
    /metadata.*imagem/i,
  ])) {
    return `**Metadados EXIF**\n\n${KNOWLEDGE_BASE.concepts.exif}\n\nO módulo Image Forensics do SHANDON ELITE extrai todos esses metadados de imagens URLs.`
  }

  // How to navigate / use
  if (matchesPattern(msg, [
    /como.*usar/i,
    /como.*navegar/i,
    /como.*começar/i,
    /como.*funciona/i,
    /tutorial/i,
    /guia/i,
    /ajuda.*usar/i,
  ])) {
    return `**Como usar o SHANDON ELITE:**\n\n${KNOWLEDGE_BASE.navigation.howToScan}\n\n**Módulos Principais:**\n${KNOWLEDGE_BASE.navigation.mainModules}\n\n**Módulos Avançados (Premium):**\n${KNOWLEDGE_BASE.navigation.advancedModules}\n\nPrecisa de ajuda com algum módulo específico?`
  }

  // Result explanation
  if (matchesPattern(msg, [
    /explicar.*resultado/i,
    /analisar.*resultado/i,
    /o que.*significa.*resultado/i,
    /entender.*resultado/i,
    /como.*ler.*resultado/i,
    /interpretar/i,
  ])) {
    return `**Como interpretar os resultados:**\n\n• **Score 0-100:** Quanto maior, mais confiança. Acima de 80 = alta. 50-80 = média. Abaixo de 50 = baixa.\n\n• **Verde (Encontrado):** Perfil detectado na plataforma.\n\n• **Vermelho (Não encontrado):** Perfil não detectado.\n\n• **Níveis de risco (vazamentos):**\n  🟢 Nenhum | 🟡 Baixo | 🟠 Médio | 🔴 Alto | 🔴 Crítico\n\n• **Loading:** Scan em andamento, aguarde.\n\nPrecisa de ajuda com algum resultado específico?`
  }

  // Rate limit / errors
  if (matchesPattern(msg, [
    /erro/i,
    /não funciona/i,
    /não carrega/i,
    /timeout/i,
    /rate.*limit/i,
    /muitas.*requisição/i,
  ])) {
    return `**Solução de problemas:**\n\n• **Timeout:** Aguarde alguns segundos e tente novamente. A conexão pode estar lenta.\n\n• **Rate Limit:** Se você fez muitas buscas seguidas, aguarde 1-2 minutos antes de tentar novamente.\n\n• **Erro de API:** Verifique se o alvo está correto. Tente outro formato (ex: username sem @).\n\n• **Scan não carrega:** Atualize a página (F5) e tente novamente.\n\nSe o problema persistir, pode ser uma instabilidade temporária. Tente novamente em alguns minutos.`
  }

  // What tools are available
  if (matchesPattern(msg, [
    /ferramentas.*disponíveis/i,
    /quais.*ferramentas/i,
    /o que.*posso fazer/i,
    /quais.*módulos/i,
    /recursos/i,
    /funcionalidades/i,
  ])) {
    return `**Ferramentas do SHANDON ELITE:**\n\n**🆓 Free:**\n• Username Enumerator (119+ sites)\n• Password Leak Check\n• Breach Check (HIBP)\n• Social Media Check\n• Instagram/Facebook/TikTok (modo público)\n• Phone OSINT\n• Telegram OSINT\n\n**⚡ Premium (PRO):**\n• Subdomain Finder\n• SSL Certificate Tracker\n• Port Scanner\n• Google Dorks avançados\n• Image Forensics (EXIF)\n• Email Header Analyzer\n• Exposed DB Finder\n• Crypto Address Check\n• Correlation Engine\n• Bulk Scanner\n• Dark Web Monitor\n• Radar de monitoramento\n• Snapshot & Comparação\n• Dashboard avançado\n• Timeline\n\nQuer detalhes de alguma ferramenta?`
  }

  // Score explanation
  if (matchesPattern(msg, [
    /score/i,
    /pontuação/i,
    /confiança/i,
  ])) {
    return `**Score de Confiança (0-100)**\n\n${KNOWLEDGE_BASE.results.score}\n\n• **80-100:** Alta confiança - quase certeza de que é a mesma pessoa\n• **50-79:** Média confiança - provável mas não confirmado\n• **0-49:** Baixa confiança - pode ser coincidência\n\nO score é calculado com base em quantos sites o username foi encontrado e a consistência dos dados.`
  }

  // What does green/red mean
  if (matchesPattern(msg, [
    /verde.*significa/i,
    /vermelho.*significa/i,
    /o que.*verde/i,
    /o que.*vermelho/i,
    /ícone.*verde/i,
    /ícone.*vermelho/i,
  ])) {
    return `**Significado das cores:**\n\n🟢 **Verde:** Sucesso, presença confirmada, risco baixo, perfil encontrado\n\n🔴 **Vermelho:** Ausência, falha, risco alto, perfil não encontrado\n\n🟡 **Amarelo/Laranja:** Aviso, atenção necessária, risco médio`
  }

  // How to check username
  if (matchesPattern(msg, [
    /como.*verificar.*pessoa/i,
    /como.*saber.*alguém/i,
    /como.*encontrar.*pessoa/i,
    /como.*investigar.*pessoa/i,
  ])) {
    return `**Como investigar uma pessoa:**\n\n1. **Username Scan** - Verifique o username em 119+ sites\n2. **Social Check** - Veja em quais redes sociais tem conta\n3. **Instagram/Facebook/TikTok** - Analise os perfis encontrados\n4. **Phone OSINT** - Se tiver o telefone, busque informações\n5. **Breach Check** - Veja se o email apareceu em vazamentos\n6. **Presence Summary** - Resumo consolidado de toda a presença digital\n\nComece pelo Username Scan ou Social Check!`
  }

  // Navigation help
  if (matchesPattern(msg, [
    /menu/i,
    /onde.*encontro/i,
    /onde.*ficam/i,
    /acessar.*módulo/i,
    /abrir.*módulo/i,
  ])) {
    return `**Como acessar os módulos:**\n\n1. Clique no ícone de **menu** (☰) no canto superior\n2. Os módulos aparecem organizados por categoria\n3. Clique no módulo desejado para abri-lo\n4. Na **mobile**, o menu fica acessível pelo ícone de três linhas\n\n**Dica:** Use a busca rápida no menu para encontrar módulos específicos.`
  }

  // Default: ask for clarification
  return "Não tenho certeza do que você está perguntando. Posso ajudar com:\n\n• **O que é o SHANDON ELITE**\n• **Explicar alguma ferramenta** (Username Scan, Breach Check, Instagram, etc)\n• **Como usar a plataforma**\n• **Interpretar resultados**\n• **Conceitos de OSINT**\n• **Planos e preços**\n\nDigite sua dúvida e farei o melhor para ajudar!"
}
