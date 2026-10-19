export interface DorkTemplate {
  name: string;
  description: string;
  category: string;
  dork: string;
  url: string;
}

interface DorkDefinition {
  name: string;
  description: string;
  category: string;
  template: string;
}

const DORK_DEFINITIONS: DorkDefinition[] = [
  // Site-specific
  { name: 'LinkedIn Profile', description: 'Find LinkedIn profiles for a target', category: 'site-specific', template: 'site:linkedin.com/in "{target}"' },
  { name: 'LinkedIn Company', description: 'Find LinkedIn company pages', category: 'site-specific', template: 'site:linkedin.com/company "{target}"' },
  { name: 'GitHub User', description: 'Find GitHub user profiles', category: 'site-specific', template: 'site:github.com "{target}"' },
  { name: 'GitHub Repos', description: 'Find GitHub repositories', category: 'site-specific', template: 'site:github.com "{target}" in:name,description' },
  { name: 'Twitter/X Profile', description: 'Find Twitter/X profiles', category: 'site-specific', template: 'site:twitter.com "{target}" OR site:x.com "{target}"' },
  { name: 'Instagram Profile', description: 'Find Instagram profiles', category: 'site-specific', template: 'site:instagram.com "{target}"' },
  { name: 'Facebook Profile', description: 'Find Facebook profiles', category: 'site-specific', template: 'site:facebook.com "{target}"' },
  { name: 'Facebook Pages', description: 'Find Facebook pages', category: 'site-specific', template: 'site:facebook.com/pages "{target}"' },
  { name: 'Reddit User', description: 'Find Reddit user profiles', category: 'site-specific', template: 'site:reddit.com/user "{target}"' },
  { name: 'Reddit Posts', description: 'Find Reddit posts by user', category: 'site-specific', template: 'site:reddit.com "{target}"' },
  { name: 'YouTube Channel', description: 'Find YouTube channels', category: 'site-specific', template: 'site:youtube.com "{target}"' },
  { name: 'YouTube Videos', description: 'Find YouTube videos mentioning target', category: 'site-specific', template: 'site:youtube.com "{target}" inurl:watch' },
  { name: 'TikTok Profile', description: 'Find TikTok profiles', category: 'site-specific', template: 'site:tiktok.com "@{target}"' },
  { name: 'Pinterest Profile', description: 'Find Pinterest profiles', category: 'site-specific', template: 'site:pinterest.com "{target}"' },
  { name: 'Medium Profile', description: 'Find Medium profiles', category: 'site-specific', template: 'site:medium.com "@{target}"' },
  { name: 'Medium Articles', description: 'Find Medium articles by target', category: 'site-specific', template: 'site:medium.com "{target}" inurl:@{target}' },
  { name: 'Dev.to Profile', description: 'Find Dev.to profiles', category: 'site-specific', template: 'site:dev.to "{target}"' },
  { name: 'Stack Overflow', description: 'Find Stack Overflow profiles', category: 'site-specific', template: 'site:stackoverflow.com/users "{target}"' },
  { name: 'HackerNews', description: 'Find HackerNews profiles', category: 'site-specific', template: 'site:news.ycombinator.com "{target}"' },
  { name: 'Keybase', description: 'Find Keybase profiles', category: 'site-specific', template: 'site:keybase.io "{target}"' },
  { name: 'Telegram', description: 'Find Telegram profiles', category: 'site-specific', template: 'site:t.me "{target}"' },
  { name: 'Twitch', description: 'Find Twitch profiles', category: 'site-specific', template: 'site:twitch.tv "{target}"' },
  { name: 'Spotify', description: 'Find Spotify profiles', category: 'site-specific', template: 'site:open.spotify.com/user "{target}"' },
  { name: 'SoundCloud', description: 'Find SoundCloud profiles', category: 'site-specific', template: 'site:soundcloud.com "{target}"' },
  { name: 'Behance', description: 'Find Behance profiles', category: 'site-specific', template: 'site:behance.net "{target}"' },
  { name: 'Dribbble', description: 'Find Dribbble profiles', category: 'site-specific', template: 'site:dribbble.com "{target}"' },
  { name: 'Steam', description: 'Find Steam profiles', category: 'site-specific', template: 'site:steamcommunity.com "{target}"' },
  { name: 'Gravatar', description: 'Find Gravatar profiles', category: 'site-specific', template: 'site:gravatar.com "{target}"' },
  { name: 'About.me', description: 'Find About.me profiles', category: 'site-specific', template: 'site:about.me "{target}"' },
  { name: 'Linktree', description: 'Find Linktree pages', category: 'site-specific', template: 'site:linktr.ee "{target}"' },

  // Filetype
  { name: 'PDF Files', description: 'Find PDF files mentioning target', category: 'filetype', template: 'filetype:pdf "{target}"' },
  { name: 'Word Documents', description: 'Find Word documents mentioning target', category: 'filetype', template: 'filetype:doc "{target}" OR filetype:docx "{target}"' },
  { name: 'Excel Spreadsheets', description: 'Find Excel files mentioning target', category: 'filetype', template: 'filetype:xls "{target}" OR filetype:xlsx "{target}"' },
  { name: 'PowerPoint', description: 'Find PowerPoint files mentioning target', category: 'filetype', template: 'filetype:ppt "{target}" OR filetype:pptx "{target}"' },
  { name: 'CSV Files', description: 'Find CSV files mentioning target', category: 'filetype', template: 'filetype:csv "{target}"' },
  { name: 'Text Files', description: 'Find text files mentioning target', category: 'filetype', template: 'filetype:txt "{target}"' },
  { name: 'HTML Files', description: 'Find HTML files mentioning target', category: 'filetype', template: 'filetype:html "{target}"' },
  { name: 'XML Files', description: 'Find XML files mentioning target', category: 'filetype', template: 'filetype:xml "{target}"' },
  { name: 'JSON Files', description: 'Find JSON files mentioning target', category: 'filetype', template: 'filetype:json "{target}"' },
  { name: 'SQL Files', description: 'Find SQL files mentioning target', category: 'filetype', template: 'filetype:sql "{target}"' },
  { name: 'Log Files', description: 'Find log files mentioning target', category: 'filetype', template: 'filetype:log "{target}"' },
  { name: 'Config Files', description: 'Find config files mentioning target', category: 'filetype', template: 'filetype:conf "{target}" OR filetype:cfg "{target}"' },
  { name: 'Backup Files', description: 'Find backup files mentioning target', category: 'filetype', template: 'filetype:bak "{target}" OR filetype:backup "{target}"' },

  // Intitle
  { name: 'Intitle Login', description: 'Find login pages', category: 'intitle', template: 'intitle:"login" "{target}"' },
  { name: 'Intitle Admin', description: 'Find admin pages', category: 'intitle', template: 'intitle:"admin" "{target}"' },
  { name: 'Intitle Dashboard', description: 'Find dashboard pages', category: 'intitle', template: 'intitle:"dashboard" "{target}"' },
  { name: 'Intitle Index Of', description: 'Find directory listings', category: 'intitle', template: 'intitle:"index of" "{target}"' },
  { name: 'Intitle Error', description: 'Find error pages', category: 'intitle', template: 'intitle:"error" "{target}"' },
  { name: 'Intitle Welcome', description: 'Find welcome pages', category: 'intitle', template: 'intitle:"welcome" "{target}"' },

  // Inurl
  { name: 'Inurl Login', description: 'Find URLs with login', category: 'inurl', template: 'inurl:login "{target}"' },
  { name: 'Inurl Admin', description: 'Find URLs with admin', category: 'inurl', template: 'inurl:admin "{target}"' },
  { name: 'Inurl API', description: 'Find API endpoints', category: 'inurl', template: 'inurl:api "{target}"' },
  { name: 'Inurl WP-Admin', description: 'Find WordPress admin panels', category: 'inurl', template: 'inurl:wp-admin "{target}"' },
  { name: 'Inurl WP-Content', description: 'Find WordPress content', category: 'inurl', template: 'inurl:wp-content "{target}"' },
  { name: 'Inurl PHP', description: 'Find PHP pages', category: 'inurl', template: 'inurl:php "{target}"' },
  { name: 'Inurl ASPX', description: 'Find ASPX pages', category: 'inurl', template: 'inurl:aspx "{target}"' },
  { name: 'Inurl JSP', description: 'Find JSP pages', category: 'inurl', template: 'inurl:jsp "{target}"' },
  { name: 'Inurl Env', description: 'Find exposed env files', category: 'inurl', template: 'inurl:.env "{target}"' },
  { name: 'Inurl Git', description: 'Find exposed git directories', category: 'inurl', template: 'inurl:.git "{target}"' },
  { name: 'Inurl SVN', description: 'Find exposed SVN directories', category: 'inurl', template: 'inurl:.svn "{target}"' },
  { name: 'Inurl Backup', description: 'Find backup files in URLs', category: 'inurl', template: 'inurl:backup "{target}"' },

  // Cache & Link
  { name: 'Cache', description: 'View Google cache of a page', category: 'cache', template: 'cache:"{target}"' },
  { name: 'Link to Site', description: 'Find pages linking to target', category: 'link', template: 'link:"{target}"' },
  { name: 'Related Sites', description: 'Find sites related to target', category: 'related', template: 'related:"{target}"' },

  // Information Disclosure
  { name: 'Email Addresses', description: 'Find exposed email addresses', category: 'info', template: '"{target}" email OR "@"' },
  { name: 'Phone Numbers', description: 'Find exposed phone numbers', category: 'info', template: '"{target}" phone OR tel OR call' },
  { name: 'Passwords', description: 'Find exposed passwords', category: 'info', template: '"{target}" password OR passwd OR pwd' },
  { name: 'API Keys', description: 'Find exposed API keys', category: 'info', template: '"{target}" api_key OR apikey OR "api key"' },
  { name: 'Secret Keys', description: 'Find exposed secret keys', category: 'info', template: '"{target}" secret_key OR secretkey OR "secret key"' },
  { name: 'Database', description: 'Find database connections', category: 'info', template: '"{target}" database OR db OR mysql OR postgres' },
  { name: 'Config Files', description: 'Find configuration files', category: 'info', template: '"{target}" config OR configuration filetype:xml OR filetype:json' },
  { name: 'Pastebin', description: 'Find Pastebin posts', category: 'info', template: 'site:pastebin.com "{target}"' },
  { name: 'GitHub Gists', description: 'Find GitHub Gists', category: 'info', template: 'site:gist.github.com "{target}"' },

  // Technology
  { name: 'WordPress', description: 'Find WordPress sites', category: 'technology', template: '"{target}" inurl:wp-content OR inurl:wp-includes' },
  { name: 'Joomla', description: 'Find Joomla sites', category: 'technology', template: '"{target}" inurl:joomla OR "powered by joomla"' },
  { name: 'Drupal', description: 'Find Drupal sites', category: 'technology', template: '"{target}" inurl:drupal OR "powered by drupal"' },
  { name: 'Apache', description: 'Find Apache servers', category: 'technology', template: '"{target}" intitle:"Apache" OR "Server: Apache"' },
  { name: 'Nginx', description: 'Find Nginx servers', category: 'technology', template: '"{target}" intitle:"nginx" OR "Server: nginx"' },
  { name: 'IIS', description: 'Find IIS servers', category: 'technology', template: '"{target}" intitle:"IIS" OR "Server: Microsoft-IIS"' },
  { name: 'PHP', description: 'Find PHP applications', category: 'technology', template: '"{target}" ext:php OR "X-Powered-By: PHP"' },
  { name: 'ASP.NET', description: 'Find ASP.NET applications', category: 'technology', template: '"{target}" ext:aspx OR "X-Powered-By: ASP.NET"' },
  { name: 'Node.js', description: 'Find Node.js applications', category: 'technology', template: '"{target}" "X-Powered-By: Express"' },
  { name: 'React', description: 'Find React applications', category: 'technology', template: '"{target}" inurl:react OR "reactroot" OR "_reactRoot"' },
  { name: 'Vue.js', description: 'Find Vue.js applications', category: 'technology', template: '"{target}" inurl:vue OR "Vue.js" OR "__vue__"' },
  { name: 'Angular', description: 'Find Angular applications', category: 'technology', template: '"{target}" inurl:angular OR "ng-version"' },
];

export function generateDorks(target: string, category?: string): DorkTemplate[] {
  const definitions = category
    ? DORK_DEFINITIONS.filter((d) => d.category === category)
    : DORK_DEFINITIONS;

  return definitions.map((def) => {
    const dork = def.template.replace(/\{target\}/g, target);
    const encodedDork = encodeURIComponent(dork);
    return {
      name: def.name,
      description: def.description,
      category: def.category,
      dork,
      url: `https://www.google.com/search?q=${encodedDork}`,
    };
  });
}

export function getAllCategories(): string[] {
  return [...new Set(DORK_DEFINITIONS.map((d) => d.category))];
}
