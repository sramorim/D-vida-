export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatIntent {
  keywords: string[]
  patterns: RegExp[]
  response: string
  followUp?: string
}

export const KNOWLEDGE_BASE = {
  project: {
    name: "SHANDON ELITE",
    what: "SHANDON ELITE é uma plataforma OSINT (Open Source Intelligence) para investigação digital ética. É um motor de busca avançado que agrega ferramentas de coleta de informações públicas da internet em uma única interface.",
    who: "Criada por Daniel Amorim (@Sr__Amorim).",
    purpose: "Ajuda a encontrar informações públicas sobre pessoas, domínios e serviços na internet de forma ética e legal. Pode ser usado para auditoria de segurança, investigação de fraudes, verificação de identidade e pesquisa digital.",
    price: "O plano básico é gratuito (Free). O plano premium (PRO) dá acesso a ferramentas avançadas, monitamento, scan estendido e funcionalidades exclusivas.",
    tech: "Feito com Next.js, TypeScript e Tailwind CSS. Usa deploy na Vercel.",
    freeTier: "O plano gratuito permite busca básica de usernames, verificação de redes sociais, breach check, phone OSINT e ferramentas essenciais.",
    premiumTier: "O plano premium desbloqueia: scan estendido (50+ sites), Instagram/ Facebook/TikTok avançado com comentários e top likers, monitoramento Dark Web, engine de correlação, radar de monitoramento, Google Dorks avançados, scan de portas, subdomains, SSL tracker e muito mais.",
  },

  tools: {
    username_enum: {
      name: "Username Enumerator",
      what: "Verifica se um username existe em 119+ sites simultaneamente.",
      how: "Digite o nome de usuário desejado e clique em 'Buscar'. O sistema verifica em tempo real se a pessoa tem conta em cada site.",
      result: "Cada resultado mostra: nome do site, status (encontrado em verde ou não encontrado em vermelho), e link direto para o perfil quando disponível.",
      freeLimit: "No plano gratuito, mostra até 5 resultados. Premium mostra todos.",
    },
    password_leak: {
      name: "Password Leak Checker",
      what: "Verifica se uma senha apareceu em vazamentos de dados conhecidos.",
      how: "Digite uma senha. O sistema calcula o hash SHA-1 e verifica no banco de dados do Have I Been Pwned contra bilhões de senhas vazadas. A senha NUNCA é enviada ao servidor - o hash é calculado localmente.",
      result: "Mostra quantas vezes a senha foi vazada e o nível de risco: Nenhum (verde), Baixo, Médio, Alto ou Crítico (vermelho).",
      riskLevels: "Nenhum = 0 ocorrências. Baixo = menos de 10. Médio = 10-999. Alto = 1.000-99.999. Crítico = 100.000+.",
    },
    breach_check: {
      name: "Breach Check (Have I Been Pwned)",
      what: "Verifica se um email foi comprometido em vazamentos de dados conhecidos.",
      how: "Digite o email. O sistema consulta a API do Have I Been Pwned e mostra todas as violações onde o email apareceu.",
      result: "Lista cada vazamento com: nome do serviço, data do vazamento, quantidade de contas afetadas, tipo de dados expostos, e se é verificado.",
      dataClasses: "Tipos de dados expostos podem incluir: emails, senhas, nomes, endereços, telefones, datas de nascimento, CPFs, cartões de crédito, etc.",
    },
    instagram: {
      name: "Instagram Investigation",
      what: "Investiga perfis do Instagram coletando informações públicas detalhadas.",
      how: "Digite o username do Instagram. O sistema usa o Instaloader para extrair dados públicos do perfil.",
      result: "Mostra: nome completo, bio, seguidores, seguindo, posts, se é verificado, se é privado, URL do perfil, URL da foto de perfil.",
      premium: "Premium desbloqueia: modo estendido (até 100 posts), comentários, top likers, análise de engajamento.",
      freeLimit: "Plano gratuito: até 12 posts públicos, modo público apenas.",
    },
    facebook: {
      name: "Facebook Investigation",
      what: "Investiga perfis e páginas do Facebook.",
      how: "Digite o username ou URL do perfil. O sistema coleta informações públicas disponíveis.",
      result: "Mostra: informações básicas do perfil, posts públicos, interações.",
      premium: "Premium: modo estendido, amigos, curtidas, likes.",
    },
    tiktok: {
      name: "TikTok Investigation",
      what: "Investiga perfis do TikTok coletando informações e vídeos.",
      how: "Digite o username do TikTok. O sistema analisa o perfil público.",
      result: "Mostra: bio, seguidores, curtidas totais, vídeos.",
      premium: "Premium: comentários, top vídeos, análise estendida.",
    },
    phone_osint: {
      name: "Phone OSINT",
      what: "Investiga números de telefone coletando informações públicas.",
      how: "Digite o número com código do país (ex: +5511999999999). O sistema identifica operadora, tipo de linha, país e redes sociais vinculadas.",
      result: "Mostra: país, operadora, tipo de linha (móvel/fixo), se tem WhatsApp, redes sociais encontradas.",
    },
    social_check: {
      name: "Social Media Check",
      what: "Verifica a existência de um username em múltiplas redes sociais.",
      how: "Digite o username. O sistema verifica Instagram, Facebook, Twitter/X, TikTok, YouTube, LinkedIn, Pinterest, Reddit, Snapchat, Threads, GitHub, Spotify e mais.",
      result: "Lista cada plataforma com status (encontrado/não encontrado) e link direto.",
    },
    domain_intel: {
      name: "Domain Intelligence",
      what: "Análise completa de um domínio: WHOIS, DNS, tecnologias e headers HTTP.",
      how: "Digite o domínio (ex: example.com). O sistema coleta informações detalhadas.",
      result: "Mostra: registrante, data de criação, data de expiração, nameservers, registros DNS, tecnologias utilizadas, headers HTTP, informações SSL.",
    },
    ip_intel: {
      name: "IP Intelligence",
      what: "Análise detalhada de endereços IP: geolocalização, ISP, proxy, hosting.",
      how: "Digite o endereço IP. O sistema identifica localização, provedor, ASN e flags de segurança.",
      result: "Mostra: país, região, cidade, coordenadas, timezone, ISP, organização, ASN, se é proxy/hosting/mobile.",
    },
    subdomain_finder: {
      name: "Subdomain Finder",
      what: "Encontra subdomínios de um domínio usando enumeração DNS.",
      how: "Digite o domínio. O sistema testa centenas de subdomínios comuns (www, mail, api, admin, etc).",
      result: "Lista subdomínios encontrados com IP associado e tempo de resposta.",
    },
    ssl_tracker: {
      name: "SSL Certificate Tracker",
      what: "Rastreia histórico de certificados SSL de um domínio via CT Logs.",
      how: "Digite o domínio. O sistema consulta logs de transparência de certificados.",
      result: "Mostra: total de certificados, subdomínios únicos, emissores, timeline de emissões, data de expiração mais recente.",
    },
    port_scanner: {
      name: "Port Scanner",
      what: "Verifica portas abertas em um host.",
      how: "Digite o host (IP ou domínio). O sistema verifica portas comuns (21, 22, 80, 443, etc).",
      result: "Lista portas abertas/fechadas com serviço associado e tempo de resposta.",
    },
    google_dorks: {
      name: "Google Dorks",
      what: "Gera consultas Google Dorking para encontrar informações específicas.",
      how: "Escolha uma categoria (site-specific, file-type,敏感信息) e insira o alvo. O sistema gera a query otimizada.",
      result: "Mostra: nome do dork, descrição, query gerada, link direto para busca no Google.",
      categories: "site-specific (LinkedIn, GitHub, Twitter, etc), file-type (PDFs, docs), exposed-data, sensitive-info.",
    },
    image_forensics: {
      name: "Image Forensics",
      what: "Análise forense de imagens: metadados EXIF, GPS, câmera.",
      how: "Forneça a URL de uma imagem. O sistema extrai metadados EXIF completos.",
      result: "Mostra: coordenadas GPS (se disponíveis), câmera (marca, modelo, lente), software, datas (captura, modificação, digitalização), todos os metadados.",
    },
    email_header: {
      name: "Email Header Analyzer",
      what: "Analisa headers de email para rastrear origem e caminho.",
      how: "Cole o header completo do email. O sistema decodifica todos os campos.",
      result: "Mostra: remetente, destinatários, CC, data, Message-ID, X-Mailer, caminho de recebimento (hop by hop), IP de origem, servidor de origem, resultados de autenticação (SPF, DKIM, DMARC).",
    },
    exposed_db: {
      name: "Exposed Database Finder",
      what: "Verifica se um host tem bancos de dados expostos publicamente.",
      how: "Digite o host. O sistema verifica Firebase, MongoDB, Elasticsearch e outros serviços comuns.",
      result: "Mostra: tipo de banco, porta, resposta, versão, nível de risco.",
    },
    telegram_osint: {
      name: "Telegram OSINT",
      what: "Investiga perfis do Telegram coletando informações públicas.",
      how: "Digite o username do Telegram (sem @). O sistema acessa t.me/{username} e extrai dados.",
      result: "Mostra: nome de exibição, bio, avatar, URL do perfil, se o perfil existe.",
    },
    wayback_check: {
      name: "Wayback Machine Check",
      what: "Verifica snapshots de uma URL no Internet Archive Wayback Machine.",
      how: "Digite a URL. O sistema consulta o arquivo da web e lista versões salvas.",
      result: "Mostra: total de snapshots, primeiro e mais recente, lista de snapshots com data, status e tipo MIME.",
    },
    crypto_check: {
      name: "Crypto Address Checker",
      what: "Análise de endereços de criptomoedas (Bitcoin, Ethereum).",
      how: "Digite o endereço da carteira. O sistema identifica a blockchain e consulta informações públicas.",
      result: "Mostra: blockchain, saldo, transações, primeiro/último visto, flags de risco.",
    },
    correlation_engine: {
      name: "Correlation Engine",
      what: "Cruza múltiplas fontes de dados para encontrar conexões entre informações.",
      how: "Forneça múltiplos inputs (email, username, telefone, domínio). O sistema busca correlações entre eles.",
      result: "Mostra: matches encontrados, campos correlacionados, fontes, nível de confiança, resumo.",
    },
    bulk_scanner: {
      name: "Bulk Scanner",
      what: "Escanea múltiplos alvos de uma vez (emails, usernames, domínios, telefones).",
      how: "Insira uma lista de alvos. O sistema processa cada um e gera um relatório consolidado.",
      result: "Mostra: total, completados, erros, resumo por alvo.",
    },
    radar: {
      name: "Radar (Monitoramento)",
      what: "Monitora mudanças e alertas sobre perfis e informações rastreadas.",
      how: "Configure monitoramento para alvos específicos. O sistema vigia mudanças e envia alertas.",
      premium: "Exclusivo do plano Premium.",
    },
    darkweb: {
      name: "Dark Web Monitor",
      what: "Monitora a dark web por vazamentos e informações sobre o alvo.",
      how: "Configure monitoramento. O sistema busca em fontes de dark web indexadas.",
      premium: "Exclusivo do plano Premium.",
    },
    snapshot: {
      name: "Snapshot & Comparação",
      what: "Tira snapshots de perfis e compara alterações ao longo do tempo.",
      how: "Salve um snapshot de um perfil (Instagram/Facebook). Depois salve outro e compare as diferenças.",
      result: "Mostra: campos alterados, valores antes/depois, diferença de seguidores, novos/perdidos.",
    },
    advanced_dashboard: {
      name: "Advanced Dashboard",
      what: "Dashboard avançado com múltiplas ferramentas integradas e visualização de dados.",
      premium: "Exclusivo do plano Premium.",
    },
    presence_summary: {
      name: "Presence Summary",
      what: "Resumo consolidado da presença digital de um alvo em todas as plataformas.",
      how: "Digite o username. O sistema gera um relatório consolidado de presença.",
      result: "Mostra: plataformas com conta, plataformas sem conta, score geral, resumo executivo.",
    },
    timeline: {
      name: "Timeline",
      what: "Cria uma linha do tempo de eventos e descobertas sobre o alvo.",
      how: "Após executar buscas, o sistema pode gerar uma timeline cronológica.",
      result: "Mostra: eventos ordenados por data, categorias (social, breach, domain, email, phone), descrição e fonte.",
    },
    settings: {
      name: "Configurações",
      what: "Configurações da conta, preferências e gerenciamento de plano.",
      how: "Acesse o menu de configurações para gerenciar sua conta.",
    },
    plans: {
      name: "Planos",
      what: "Informações sobre os planos Free e Premium do SHANDON ELITE.",
      details: "Free: ferramentas essenciais, scan limitado. Premium: todas as ferramentas desbloqueadas, monitoramento, scan estendido.",
    },
  },

  results: {
    score: "O score é de 0 a 100. Quanto maior, mais confiança de que o perfil encontrado é da mesma pessoa. Acima de 80 = alta confiança. 50-80 = média. Abaixo de 50 = baixa.",
    found: "Verde (Encontrado) = a pessoa tem conta naquele site. Isso indica presença ativa na plataforma.",
    not_found: "Vermelho (Não encontrado) = não foi detectada conta naquele site. Pode significar que a pessoa não tem conta ou que usou um username diferente.",
    green: "Verde indica sucesso, presença confirmada ou risco baixo.",
    red: "Vermelho indica ausência, falha ou risco alto.",
    amber: "Amarelo/laranja indica aviso ou atenção.",
    risk: "Níveis de risco: Nenhum (sem vazamento), Baixo (poucos registros), Médio (vazamento moderado), Alto (vazamento significativo), Crítico (vazamento massivo).",
    loading: "A animação de carregamento indica que o scan está em andamento. Pode levar alguns segundos dependendo do número de sites verificados.",
    apiError: "Se ocorrer erro de API, pode ser rate limit (muitas requisições) ou problema de conexão. Aguarde e tente novamente.",
  },

  concepts: {
    osint: "OSINT significa Open Source Intelligence - Inteligência de Fontes Abertas. São informações públicas disponíveis na internet que podem ser coletadas e analisadas legalmente.",
    footprint: "Footprint digital é o rastro que uma pessoa deixa na internet - posts, perfis, comentários, check-ins, registros WHOIS, etc.",
    breach: "Um vazamento (breach) ocorre quando dados de usuários são expostos publicamente ou vendidos na dark web. Pode incluir emails, senhas, dados pessoais.",
    dorking: "Google Dorking é o uso de operadores avançados do Google para encontrar informações específicas que normalmente não apareceriam em buscas comuns.",
    exif: "Metadados EXIF são informações embutidas em imagens como: data/hora da foto, modelo da câmera, coordenadas GPS, software usado.",
    whois: "WHOIS é um protocolo que permite consultar informações de registro de domínios: proprietário, datas, nameservers, contato.",
    dns: "DNS (Domain Name System) é o sistema que traduz nomes de domínio em endereços IP. Registros incluem A, AAAA, MX, CNAME, TXT, etc.",
    ctLog: "Certificate Transparency Logs são registros públicos de todos os certificados SSL emitidos, permitindo rastrear histórico de um domínio.",
    hibp: "Have I Been Pwned (HIBP) é um serviço criado por Troy Hunt que indexa vazamentos de dados e permite verificar se seu email/senha foi comprometido.",
    pwned: "Pwned é slang de 'owned' (possuído). No contexto HIBP, significa que seus dados foram encontrados em um vazamento.",
    sha1: "SHA-1 é uma função de hash criptográfica. No Password Leak Checker, a senha é convertida em hash SHA-1 e apenas o prefixo é enviado ao servidor para privacidade.",
    firebase: "Firebase é uma plataforma do Google para hospedar apps. Se configurada incorretamente, dados podem ficar expostos publicamente.",
    elasticsearch: "Elasticsearch é um motor de busca. Se exposto publicamente, pode vazar dados de websites e aplicações.",
    mongodb: "MongoDB é um banco de dados NoSQL. Se exposto sem autenticação, qualquer pessoa pode acessar os dados.",
  },

  navigation: {
    mainModules: "Os módulos principais são: Username Scan, Instagram, Facebook, TikTok, Telefone, Email, Imagem, Domínios, Vazamentos, Documentos.",
    advancedModules: "Módulos avançados (Premium): Dark Web, Correlation Engine, Bulk Scanner, Google Dorks, Image Forensics, Email Header, Subdomain Finder, SSL Tracker, Port Scanner, Exposed DB, Crypto Check, Wayback, Radar.",
    howToScan: "1. Escolha o módulo desejado. 2. Digite o alvo (username, email, etc). 3. Clique em 'Buscar' ou pressione Enter. 4. Aguarde os resultados. 5. Analise os dados apresentados.",
    howToNavigate: "Use o menu lateral (hamburger) para acessar os módulos. Na versão mobile, o menu fica acessível pelo ícone de três linhas no canto superior.",
  },

  badges: {
    free: "Badge '100% Grátis' indica que o SHANDON ELITE é uma ferramenta gratuita. O plano básico não requer pagamento.",
    pro: "Badge 'PRO' indica acesso premium com todas as ferramentas desbloqueadas.",
    found: "Ícone verde = perfil encontrado, presença confirmada.",
    notFound: "Ícone vermelho = perfil não encontrado.",
    warning: "Ícone amarelo = aviso ou atenção necessária.",
  },
}
