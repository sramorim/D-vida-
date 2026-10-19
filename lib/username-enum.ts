import { SearchResult } from './types';
import { classifySite, type ClassifyResult } from './bot-protection';

interface SiteConfig {
  name: string;
  url: string;
  errorPatterns?: string[];
  errorStatuses?: number[];
}

/** Tempo limite por site. Só o HEAD é feito, então 5s é folgado. */
const TIMEOUT_MS = 5000;

const SITES: SiteConfig[] = [
  { name: 'GitHub', url: 'https://github.com/{u}' },
  { name: 'GitLab', url: 'https://gitlab.com/{u}' },
  { name: 'Reddit', url: 'https://www.reddit.com/user/{u}' },
  { name: 'Twitter/X', url: 'https://x.com/{u}' },
  { name: 'Instagram', url: 'https://www.instagram.com/{u}/' },
  { name: 'Facebook', url: 'https://www.facebook.com/{u}' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@{u}' },
  { name: 'YouTube', url: 'https://www.youtube.com/@{u}' },
  { name: 'Twitch', url: 'https://www.twitch.tv/{u}' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/{u}' },
  { name: 'SoundCloud', url: 'https://soundcloud.com/{u}' },
  { name: 'Pinterest', url: 'https://www.pinterest.com/{u}/' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/{u}' },
  { name: 'Medium', url: 'https://medium.com/@{u}' },
  { name: 'Dev.to', url: 'https://dev.to/{u}' },
  { name: 'HackerNews', url: 'https://news.ycombinator.com/user?id={u}' },
  { name: 'Steam', url: 'https://steamcommunity.com/id/{u}' },
  { name: 'Keybase', url: 'https://keybase.io/{u}' },
  { name: 'npm', url: 'https://www.npmjs.com/~{u}' },
  { name: 'PyPI', url: 'https://pypi.org/user/{u}/' },
  { name: 'Docker Hub', url: 'https://hub.docker.com/u/{u}' },
  { name: 'Heroku', url: 'https://{u}.herokuapp.com' },
  { name: 'Netlify', url: 'https://{u}.netlify.app' },
  { name: 'Vercel', url: 'https://{u}.vercel.app' },
  { name: 'DigitalOcean', url: 'https://www.digitalocean.com/community/users/{u}' },
  { name: 'Behance', url: 'https://www.behance.net/{u}' },
  { name: 'Dribbble', url: 'https://dribbble.com/{u}' },
  { name: 'CodePen', url: 'https://codepen.io/{u}' },
  { name: 'Replit', url: 'https://replit.com/@{u}' },
  { name: 'CodeSandbox', url: 'https://codesandbox.io/u/{u}' },
  { name: 'Glitch', url: 'https://glitch.com/@{u}' },
  { name: 'Gravatar', url: 'https://en.gravatar.com/{u}' },
  { name: 'Last.fm', url: 'https://www.last.fm/user/{u}' },
  { name: 'Bandcamp', url: 'https://{u}.bandcamp.com' },
  { name: 'Strava', url: 'https://www.strava.com/athletes/{u}' },
  { name: 'MyAnimeList', url: 'https://myanimelist.net/profile/{u}' },
  { name: 'Chess.com', url: 'https://www.chess.com/member/{u}' },
  { name: 'Duolingo', url: 'https://www.duolingo.com/profile/{u}' },
  { name: 'About.me', url: 'https://about.me/{u}' },
  { name: 'Linktree', url: 'https://linktr.ee/{u}' },
  { name: 'CashApp', url: 'https://cash.app/${u}' },
  { name: 'Venmo', url: 'https://venmo.com/{u}' },
  { name: 'PayPal', url: 'https://www.paypal.com/paypalme/{u}' },
  { name: 'Grindr', url: 'https://www.grindr.com/profile/{u}' },
  { name: 'Tinder', url: 'https://www.gotinder.com/@{u}' },
  { name: 'Bumble', url: 'https://bumble.com/@{u}' },
  { name: 'OkCupid', url: 'https://www.okcupid.com/profile/{u}' },
  { name: 'Match', url: 'https://www.match.com/profile/{u}' },
  { name: 'PlentyOfFish', url: 'https://www.pof.com/profile/{u}' },
  { name: 'Zoosk', url: 'https://www.zoosk.com/profile/{u}' },
  { name: 'eHarmony', url: 'https://www.eharmony.com/profile/{u}' },
  { name: 'AshleyMadison', url: 'https://www.ashleyprofiles.com/profile/{u}' },
  { name: 'OnlyFans', url: 'https://onlyfans.com/{u}' },
  { name: 'Fansly', url: 'https://fansly.com/{u}' },
  { name: 'Patreon', url: 'https://www.patreon.com/{u}' },
  { name: 'Substack', url: 'https://{u}.substack.com' },
  { name: 'Gumroad', url: 'https://{u}.gumroad.com' },
  { name: 'Ko-fi', url: 'https://ko-fi.com/{u}' },
  { name: 'BuyMeACoffee', url: 'https://www.buymeacoffee.com/{u}' },
  { name: 'Fiverr', url: 'https://www.fiverr.com/{u}' },
  { name: 'Upwork', url: 'https://www.upwork.com/freelancers/{u}' },
  { name: 'Freelancer', url: 'https://www.freelancer.com/u/{u}' },
  { name: 'Toptal', url: 'https://www.toptal.com/{u}' },
  { name: 'AngelList', url: 'https://angel.co/u/{u}' },
  { name: 'Crunchbase', url: 'https://www.crunchbase.com/person/{u}' },
  { name: 'ProductHunt', url: 'https://www.producthunt.com/@{u}' },
  { name: 'IndieHackers', url: 'https://www.indiehackers.com/u/{u}' },
  { name: 'CoinDesk', url: 'https://www.coindesk.com/author/{u}' },
  { name: 'CoinMarketCap', url: 'https://coinmarketcap.com/author/{u}' },
  { name: 'Etherscan', url: 'https://etherscan.io/accounts/{u}' },
  { name: 'Bitbucket', url: 'https://bitbucket.org/{u}/' },
  { name: 'SourceForge', url: 'https://sourceforge.net/u/{u}/' },
  { name: 'Flickr', url: 'https://www.flickr.com/people/{u}' },
  { name: '500px', url: 'https://500px.com/p/{u}' },
  { name: 'DeviantArt', url: 'https://www.deviantart.com/{u}' },
  { name: 'Tumblr', url: 'https://{u}.tumblr.com' },
  { name: 'Foursquare', url: 'https://foursquare.com/{u}' },
  { name: 'Vimeo', url: 'https://vimeo.com/{u}' },
  { name: 'Mixcloud', url: 'https://www.mixcloud.com/{u}' },
  { name: 'Mastodon', url: 'https://mastodon.social/@{u}' },
  { name: 'Lichess', url: 'https://lichess.org/@/{u}' },
  { name: 'Roblox', url: 'https://www.roblox.com/user.aspx?username={u}' },
  { name: 'Minecraft', url: 'https://namemc.com/profile/{u}' },
  { name: 'HackTheBox', url: 'https://app.hackthebox.com/profile/{u}' },
  { name: 'TryHackMe', url: 'https://tryhackme.com/p/{u}' },
  { name: 'RootMe', url: 'https://www.root-me.org/{u}' },
  { name: 'LeetCode', url: 'https://leetcode.com/{u}' },
  { name: 'HackerRank', url: 'https://www.hackerrank.com/{u}' },
  { name: 'Codeforces', url: 'https://codeforces.com/profile/{u}' },
  { name: 'Kaggle', url: 'https://www.kaggle.com/{u}' },
  { name: 'Goodreads', url: 'https://www.goodreads.com/user/show/{u}' },
  { name: 'Letterboxd', url: 'https://letterboxd.com/{u}' },
  { name: 'Trakt', url: 'https://trakt.tv/users/{u}' },
  { name: 'AniList', url: 'https://anilist.co/user/{u}' },
  { name: 'Kitsu', url: 'https://kitsu.io/users/{u}' },
  { name: 'TwitchTracker', url: 'https://twitchtracker.com/{u}' },
  { name: 'SullyGnome', url: 'https://sullygnome.com/channel/{u}' },
  { name: 'SocialBlade', url: 'https://socialblade.com/youtube/user/{u}' },
  { name: 'Noxinfluencer', url: 'https://www.noxinfluencer.com/youtube/channel/{u}' },
  { name: 'Carrd', url: 'https://{u}.carrd.co' },
  { name: 'Bio Link', url: 'https://biolink.info/{u}' },
  { name: 'Taplink', url: 'https://taplink.cc/{u}' },
  { name: 'Link.Bio', url: 'https://link.bio/{u}' },
  { name: 'Stan Store', url: 'https://stan.store/{u}' },
  { name: 'Beacons', url: 'https://beacons.ai/{u}' },
  { name: 'Campsite', url: 'https://campsite.bio/{u}' },
  { name: 'Lynkfire', url: 'https://lynkfire.com/{u}' },
  { name: 'Solo.to', url: 'https://solo.to/{u}' },
  { name: 'Shorby', url: 'https://shorby.com/{u}' },
  { name: 'ContactInBio', url: 'https://contactin.bio/{u}' },
  { name: 'AllMyLinks', url: 'https://allmylinks.com/{u}' },
  { name: 'LinkInBio', url: 'https://linkin.bio/{u}' },
  { name: 'Lnk.Bio', url: 'https://lnk.bio/{u}' },
  { name: 'Bio.site', url: 'https://bio.site/{u}' },
  { name: 'Lynk.id', url: 'https://lynk.id/{u}' },
  { name: 'LinkApp', url: 'https://linkapp.me/{u}' },
  { name: 'Elink', url: 'https://elink.io/{u}' },
  { name: 'PicoLink', url: 'https://picolink.com/{u}' },
  { name: 'Bio.fm', url: 'https://bio.fm/{u}' },
];

function toSearchResult(site: SiteConfig, username: string, classified: ClassifyResult, httpStatus: number, responseTime: number): SearchResult {
  const url = site.url.replace('{u}', username);
  const exists = classified.exists;
  return {
    id: `username-enum-${site.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${username}`,
    platform: site.name,
    username,
    displayName: site.name,
    score: classified.score,
    url,
    exists,
    httpStatus,
    status: classified.uiStatus,
    source: 'http-checker',
    timestamp: Date.now(),
    bio: classified.message,
    extra: {
      responseTime,
      siteUrl: url,
      verdict: classified.verdict,
    },
  };
}

export async function runUsernameEnum(username: string): Promise<SearchResult[]> {
  const cleanUsername = username.replace(/^@+/, '').trim()

  // 120 sites em paralelo sem teto estouram o limite de conexões do runtime e
  // derrubam a varredura inteira. Lotes de 20 mantêm a confiança alta e a
  // latência perto da original.
  const CONCURRENCY = 20;

  async function check(site: SiteConfig): Promise<SearchResult> {
    const url = site.url.replace('{u}', cleanUsername);
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      const status = response.status;

      // Um HEAD em 403/429 não diz que o perfil existe: diz que a plataforma
      // recusou a consulta. Tratar isso como "encontrado" (o que o antigo
      // `status === 200` não fazia, mas o `!== 404` indireto que o
      // enumerador usava acabava fazendo) é erro de OSINT: leva a concluir
      // que alguém tem perfil onde o site só recusou o robô.
      const classified = classifySite({ site: site.name, httpStatus: status });
      return toSearchResult(site, cleanUsername, classified, status, elapsed);
    } catch {
      const elapsed = Date.now() - startTime;
      const classified = classifySite({ site: site.name, httpStatus: 0 });
      return toSearchResult(site, cleanUsername, classified, 0, elapsed);
    }
  }

  const results: SearchResult[] = [];
  for (let i = 0; i < SITES.length; i += CONCURRENCY) {
    const lote = SITES.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(lote.map(check));
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(r.value);
    }
  }

  // Encontrado primeiro; bloqueado logo depois; "não encontrado" por último.
  const ordem = (r: SearchResult): number => {
    if (r.exists) return 0;
    if (r.status === 'possible') return 1;
    if (r.status === 'unavailable') return 2;
    return 3;
  };
  return results.sort((a, b) => ordem(a) - ordem(b) || (b.score || 0) - (a.score || 0));
}
