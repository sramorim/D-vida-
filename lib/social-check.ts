import { SearchResult } from './types';

interface SocialPlatform {
  name: string;
  url: string;
  checkType: 'status' | 'redirect' | 'content';
  errorPatterns?: string[];
  successPatterns?: string[];
  category: 'social' | 'professional' | 'dating' | 'adult' | 'messaging' | 'streaming' | 'music' | 'gaming' | 'blog' | 'links' | 'finance';
}

// === REDES SOCIAIS PRINCIPAIS ===
const MAINSTREAM_PLATFORMS: SocialPlatform[] = [
  { name: 'Instagram', url: 'https://www.instagram.com/{u}/', checkType: 'content', errorPatterns: ['The link you followed may be broken', 'Sorry, this page isn\'t available'], category: 'social' },
  { name: 'Facebook', url: 'https://www.facebook.com/{u}', checkType: 'status', category: 'social' },
  { name: 'Twitter/X', url: 'https://x.com/{u}', checkType: 'content', errorPatterns: ['This account doesn\'t exist', 'suspended'], category: 'social' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@{u}', checkType: 'content', errorPatterns: ['Couldn\'t find this account', 'page not available'], category: 'social' },
  { name: 'YouTube', url: 'https://www.youtube.com/@{u}', checkType: 'content', errorPatterns: ['This page isn\'t available', 'does not exist'], category: 'social' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{u}', checkType: 'content', errorPatterns: ['This page doesn\'t exist', 'profile not found'], category: 'professional' },
  { name: 'Pinterest', url: 'https://www.pinterest.com/{u}/', checkType: 'content', errorPatterns: ['Not Found', 'Sorry, we couldn\'t find'], category: 'social' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/{u}', checkType: 'content', errorPatterns: ['Sorry, nobody on Reddit goes by that name', 'page not found'], category: 'social' },
  { name: 'Snapchat', url: 'https://www.snapchat.com/add/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'social' },
  { name: 'Threads', url: 'https://www.threads.net/@{u}', checkType: 'content', errorPatterns: ['Sorry, this page isn\'t available'], category: 'social' },
  { name: 'GitHub', url: 'https://github.com/{u}', checkType: 'status', category: 'professional' },
  { name: 'Twitch', url: 'https://www.twitch.tv/{u}', checkType: 'content', errorPatterns: ['Sorry. Unless you\'ve got a time machine', 'page not found'], category: 'streaming' },
  { name: 'Telegram', url: 'https://t.me/{u}', checkType: 'content', errorPatterns: ['If you have <strong>Telegram</strong>, you can contact'], category: 'messaging' },
  { name: 'Discord', url: 'https://discord.com/users/{u}', checkType: 'content', errorPatterns: ['Are you sure you meant'], category: 'messaging' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/{u}', checkType: 'content', errorPatterns: ['Page not found'], category: 'music' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{u}', checkType: 'content', errorPatterns: ['We can\'t find that user', '404'], category: 'music' },
  { name: 'Medium', url: 'https://medium.com/@{u}', checkType: 'content', errorPatterns: ['PAGE NOT FOUND', '404'], category: 'blog' },
  { name: 'Dev.to', url: 'https://dev.to/{u}', checkType: 'status', category: 'professional' },
  { name: 'Behance', url: 'https://www.behance.net/{u}', checkType: 'content', errorPatterns: ['Page Not Found', '404'], category: 'professional' },
  { name: 'Dribbble', url: 'https://dribbble.com/{u}', checkType: 'content', errorPatterns: ['The page you\'re looking for isn\'t here'], category: 'professional' },
  { name: 'Steam', url: 'https://steamcommunity.com/id/{u}', checkType: 'content', errorPatterns: ['The specified profile could not be found'], category: 'gaming' },
  { name: 'Keybase', url: 'https://keybase.io/{u}', checkType: 'content', errorPatterns: ['Not found'], category: 'professional' },
  { name: 'Linktree', url: 'https://linktr.ee/{u}', checkType: 'content', errorPatterns: ['Nothing to see here'], category: 'links' },
  { name: 'Substack', url: 'https://{u}.substack.com', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'blog' },
];

// === REDES SOCIAIS BRASILEIRAS ===
const BRAZILIAN_PLATFORMS: SocialPlatform[] = [
  { name: 'Kwai', url: 'https://www.kwai.com/@{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'social' },
  { name: 'Likee', url: 'https://likee.video/@{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'social' },
];

// === APPS DE NAMORO ===
const DATING_PLATFORMS: SocialPlatform[] = [
  { name: 'Tinder', url: 'https://www.tinder.com/@{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'Looking for someone?'], category: 'dating' },
  { name: 'Bumble', url: 'https://bumble.com/@{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'dating' },
  { name: 'Happn', url: 'https://happn.com/@{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'dating' },
  { name: 'OkCupid', url: 'https://www.okcupid.com/profile/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'doesn\'t exist'], category: 'dating' },
  { name: 'Badoo', url: 'https://badoo.com/profile/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'dating' },
  { name: 'Grindr', url: 'https://www.grindr.com/profile/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'dating' },
];

// === SITES +18 ===
const ADULT_PLATFORMS: SocialPlatform[] = [
  { name: 'OnlyFans', url: 'https://onlyfans.com/{u}', checkType: 'content', errorPatterns: ['Sorry, this page is not available', 'could not find', 'not found'], category: 'adult' },
  { name: 'Fansly', url: 'https://fansly.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'No user found'], category: 'adult' },
  { name: 'Privacy', url: 'https://privacy.com/@{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'Pornhub', url: 'https://www.pornhub.com/users/{u}', checkType: 'content', errorPatterns: ['does not exist', 'not found', 'No user found'], category: 'adult' },
  { name: 'XVídeos', url: 'https://www.xvideos.com/profiles/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'Page not found'], category: 'adult' },
  { name: 'Stripchat', url: 'https://stripchat.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'Page not found'], category: 'adult' },
  { name: 'Chaturbate', url: 'https://chaturbate.com/{u}/', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'Page Not Found'], category: 'adult' },
  { name: 'iFriends', url: 'https://ifriends.net/webcam/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'LiveJasmin', url: 'https://www.livejasmin.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'MyFreeCams', url: 'https://profiles.myfreecams.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'Chaturbate', url: 'https://chaturbate.com/{u}/', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'Page Not Found'], category: 'adult' },
  { name: 'SpankChat', url: 'https://spankchat.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'Flirt4Free', url: 'https://www.flirt4free.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'CamSoda', url: 'https://www.camsoda.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'BongaCams', url: 'https://bongacams.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'adult' },
  { name: 'Stripchat', url: 'https://stripchat.com/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist', 'Page not found'], category: 'adult' },
];

// === PAGAMENTOS E FINANÇAS ===
const FINANCE_PLATFORMS: SocialPlatform[] = [
  { name: 'CashApp', url: 'https://cash.app/${u}', checkType: 'content', errorPatterns: ['not found'], category: 'finance' },
  { name: 'Venmo', url: 'https://venmo.com/{u}', checkType: 'content', errorPatterns: ['could not find', 'doesn\'t exist'], category: 'finance' },
  { name: 'PayPal', url: 'https://www.paypal.com/paypalme/{u}', checkType: 'content', errorPatterns: ['not found', 'does not exist'], category: 'finance' },
  { name: 'Patreon', url: 'https://www.patreon.com/{u}', checkType: 'content', errorPatterns: ['Not Found', 'does not exist'], category: 'finance' },
];

// === COMBINAÇÃO DE TODAS AS PLATAFORMAS ===
const ALL_PLATFORMS: SocialPlatform[] = [
  ...MAINSTREAM_PLATFORMS,
  ...BRAZILIAN_PLATFORMS,
  ...DATING_PLATFORMS,
  ...ADULT_PLATFORMS,
  ...FINANCE_PLATFORMS,
];

// === PLATAFORMAS POR CATEGORIA ===
export const PLATFORM_CATEGORIES = {
  social: 'Redes Sociais',
  professional: 'Profissional',
  dating: 'Apps de Namoro',
  adult: '+18 / Adulto',
  messaging: 'Mensagens',
  streaming: 'Streaming',
  music: 'Música',
  gaming: 'Jogos',
  blog: 'Blog/Artigos',
  links: 'Links',
  finance: 'Pagamentos',
};

// === FUNÇÃO PRINCIPAL ===
export const PLATFORMS = ALL_PLATFORMS;

async function checkPlatform(platform: SocialPlatform, username: string): Promise<SocialCheckResultItem> {
  const url = platform.url.replace('{u}', username);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    let exists = false;

    if (platform.checkType === 'status') {
      exists = response.status === 200;
    } else {
      const html = await response.text();
      const hasError = platform.errorPatterns?.some((p) =>
        html.toLowerCase().includes(p.toLowerCase())
      );
      exists = response.status === 200 && !hasError;
    }

    return {
      platform: platform.name,
      url,
      exists,
      httpStatus: response.status,
      responseTime: elapsed,
      category: platform.category,
    };
  } catch {
    const elapsed = Date.now() - startTime;
    return {
      platform: platform.name,
      url,
      exists: false,
      httpStatus: 0,
      responseTime: elapsed,
      category: platform.category,
    };
  }
}

interface SocialCheckResultItem {
  platform: string;
  url: string;
  exists: boolean;
  httpStatus: number;
  responseTime: number;
  category: string;
}

export interface SocialCheckResult {
  platform: string;
  url: string;
  exists: boolean;
  httpStatus: number;
  responseTime: number;
  category: string;
}

export async function checkSocialMedia(username: string): Promise<SocialCheckResult[]> {
  const cleanUsername = username.replace('@', '').trim()
  const BATCH_SIZE = 10;
  const results: SocialCheckResult[] = [];

  for (let i = 0; i < PLATFORMS.length; i += BATCH_SIZE) {
    const batch = PLATFORMS.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((platform) => checkPlatform(platform, cleanUsername))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
}

export function socialCheckToSearchResult(result: SocialCheckResult, username: string): SearchResult {
  return {
    id: `social-${result.platform.toLowerCase().replace(/[^a-z0-9]/g, '')}-${username}`,
    platform: result.platform,
    username,
    displayName: result.platform,
    score: result.exists ? 90 : 0,
    exists: result.exists,
    status: result.exists ? 'Profile found' : 'Not found',
    url: result.url,
    httpStatus: result.httpStatus,
    source: 'http-checker',
    timestamp: Date.now(),
    extra: {
      responseTime: result.responseTime,
      category: result.category,
    },
  };
}
