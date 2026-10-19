import { SearchResult } from './types';

export interface TelegramResult {
  username: string;
  exists: boolean;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  url: string;
  rawHtml: string | null;
}

export async function checkTelegram(username: string): Promise<TelegramResult> {
  const url = `https://t.me/${username}`;
  const defaultResult: TelegramResult = {
    username,
    exists: false,
    displayName: null,
    bio: null,
    avatar: null,
    url,
    rawHtml: null,
  };

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });

    if (!response.ok) {
      return defaultResult;
    }

    const html = await response.text();

    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i) ||
      html.match(/<title>([^<]*)<\/title>/i);
    const descriptionMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i) ||
      html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/i);

    const displayName = titleMatch ? titleMatch[1].replace(/ \| Telegram$/, '').trim() : null;
    const bio = descriptionMatch ? descriptionMatch[1].trim() : null;
    const avatar = imageMatch ? imageMatch[1] : null;

    const hasProfile = html.includes('tgme_page_title') ||
      html.includes('tgme_page_description') ||
      html.includes('tgme_page_photo') ||
      (displayName !== null && displayName !== undefined && displayName !== username);

    const notFound = html.includes('If you have <strong>Telegram</strong>, you can contact') ||
      html.includes('no such user') ||
      html.includes('page not found') ||
      html.includes('tgme_page_placeholder');

    return {
      username,
      exists: hasProfile && !notFound,
      displayName,
      bio,
      avatar,
      url,
      rawHtml: html.substring(0, 5000),
    };
  } catch {
    return defaultResult;
  }
}

export function telegramToSearchResult(result: TelegramResult): SearchResult {
  return {
    id: `telegram-${result.username}`,
    platform: 'Telegram',
    username: result.username,
    displayName: result.displayName || result.username,
    score: result.exists ? 90 : 0,
    exists: result.exists,
    status: result.exists ? 'Profile found' : 'Not found',
    bio: result.bio || undefined,
    avatar: result.avatar || undefined,
    url: result.url,
    source: 'http-checker',
    timestamp: Date.now(),
    extra: {
      rawHtml: result.rawHtml,
    },
  };
}
