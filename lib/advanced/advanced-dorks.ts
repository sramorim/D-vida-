export interface DorkTemplate {
  name: string
  description: string
  dork: string
  url: string
}

const DORK_CATEGORIES = {
  email: {
    name: 'Email Exposure',
    templates: [
      { name: 'Email in documents', description: 'Find email addresses in public documents', suffix: 'filetype:pdf OR filetype:doc OR filetype:docx OR filetype:xlsx' },
      { name: 'Email in forums', description: 'Find email discussions on forums', suffix: 'inurl:forum OR inurl:thread OR inurl:topic' },
      { name: 'Email on GitHub', description: 'Find email addresses exposed on GitHub', suffix: 'site:github.com "email" OR "mailto" OR "@"' },
      { name: 'Email in configs', description: 'Find email in configuration files', suffix: 'filetype:yml OR filetype:yaml OR filetype:json OR filetype:env' },
      { name: 'Email in logs', description: 'Find email addresses in log files', suffix: 'filetype:log OR filetype:txt "email"' }
    ]
  },
  phone: {
    name: 'Phone Number Exposure',
    templates: [
      { name: 'Phone in documents', description: 'Find phone numbers in public documents', suffix: 'filetype:pdf OR filetype:doc "phone" OR "tel" OR "call"' },
      { name: 'Phone on websites', description: 'Find phone numbers on websites', suffix: 'intext:"phone" OR intext:"telephone" OR intext:"mobile"' },
      { name: 'Phone in directories', description: 'Find phone numbers in online directories', suffix: 'inurl:directory OR inurl:listing OR inurl:contacts' }
    ]
  },
  social: {
    name: 'Social Media Exposure',
    templates: [
      { name: 'Social profiles', description: 'Find social media profiles', suffix: 'site:facebook.com OR site:twitter.com OR site:instagram.com OR site:linkedin.com' },
      { name: 'Social posts', description: 'Find specific social media posts', suffix: 'site:twitter.com OR site:reddit.com "mentions" OR "quotes" OR "discusses"' },
      { name: 'Social images', description: 'Find images on social platforms', suffix: 'site:pinterest.com OR site:flickr.com filetype:jpg OR filetype:png' }
    ]
  },
  financial: {
    name: 'Financial Data Exposure',
    templates: [
      { name: 'Financial docs', description: 'Find financial documents', suffix: 'filetype:pdf "invoice" OR "receipt" OR "financial" OR "bank"' },
      { name: 'Payment info', description: 'Find exposed payment information', suffix: '"credit card" OR "payment" OR "transaction" filetype:csv OR filetype:xlsx' },
      { name: 'Crypto wallets', description: 'Find cryptocurrency wallet addresses', suffix: '"bitcoin" OR "ethereum" OR "wallet" "address"' }
    ]
  },
  technical: {
    name: 'Technical Information',
    templates: [
      { name: 'API keys', description: 'Find exposed API keys', suffix: '"api_key" OR "apikey" OR "api-key" OR "secret" filetype:env OR filetype:yml OR filetype:json' },
      { name: 'Credentials', description: 'Find exposed credentials', suffix: '"username" OR "password" OR "login" filetype:txt OR filetype:log OR filetype:cfg' },
      { name: 'Source code', description: 'Find exposed source code', suffix: 'site:github.com OR site:gitlab.com "private" OR "secret" OR "internal"' },
      { name: 'Database dumps', description: 'Find database dumps or exports', suffix: 'filetype:sql OR filetype:bak OR filetype:dump "database" OR "export"' },
      { name: 'Config files', description: 'Find exposed configuration files', suffix: 'filetype:env OR filetype:config OR filetype:ini OR filetype:conf' }
    ]
  },
  personal: {
    name: 'Personal Information',
    templates: [
      { name: 'Resume/CV', description: 'Find resume or CV documents', suffix: 'filetype:pdf OR filetype:doc "resume" OR "CV" OR "curriculum"' },
      { name: 'Address', description: 'Find physical addresses', suffix: '"address" OR "street" OR "city" OR "zip" "born" OR "lives"' },
      { name: 'Family info', description: 'Find family or personal connections', suffix: '"family" OR "relative" OR "spouse" OR "children" OR "parents"' }
    ]
  }
}

function encodeDork(dork: string): string {
  return dork.replace(/ /g, '+').replace(/"/g, '%22').replace(/:/g, '%3A')
}

function generateSearchUrl(dork: string, target: string): string {
  const fullDork = `"${target}" ${dork}`
  return `https://www.google.com/search?q=${encodeDork(fullDork)}`
}

function generateGeneralDorks(target: string): DorkTemplate[] {
  const generalTemplates = [
    { name: 'Basic target search', description: 'General search for the target', suffix: '' },
    { name: 'Exact match', description: 'Exact match search for the target', suffix: '' },
    { name: 'Related domains', description: 'Find related domains and websites', suffix: 'site:*' }
  ]

  return generalTemplates.map(template => {
    const dork = template.suffix
      ? `"${target}" ${template.suffix}`
      : `"${target}"`
    return {
      name: template.name,
      description: template.description,
      dork,
      url: generateSearchUrl(template.suffix, target)
    }
  })
}

export function generateAdvancedDorks(target: string): DorkTemplate[] {
  if (!target || target.trim().length === 0) {
    throw new Error('Target is required')
  }

  const trimmedTarget = target.trim()
  const allDorks: DorkTemplate[] = []

  allDorks.push(...generateGeneralDorks(trimmedTarget))

  Object.values(DORK_CATEGORIES).forEach(category => {
    category.templates.forEach(template => {
      const dork = `"${trimmedTarget}" ${template.suffix}`
      allDorks.push({
        name: `${category.name}: ${template.name}`,
        description: template.description,
        dork,
        url: generateSearchUrl(template.suffix, trimmedTarget)
      })
    })
  })

  allDorks.push(
    {
      name: 'Negative search',
      description: 'Exclude common irrelevant results',
      dork: `"${trimmedTarget}" -site:facebook.com -site:twitter.com -site:linkedin.com`,
      url: generateSearchUrl('-site:facebook.com -site:twitter.com -site:linkedin.com', trimmedTarget)
    },
    {
      name: 'Recent results',
      description: 'Find recent mentions',
      dork: `"${trimmedTarget}" after:2024-01-01`,
      url: generateSearchUrl('after:2024-01-01', trimmedTarget)
    },
    {
      name: 'Cached versions',
      description: 'Find cached versions of pages',
      dork: `cache:${trimmedTarget}`,
      url: generateSearchUrl(`cache:${trimmedTarget}`, trimmedTarget)
    }
  )

  return allDorks
}
