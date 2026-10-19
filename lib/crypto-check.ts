import { SearchResult } from './types';

export interface CryptoCheckResult {
  address: string;
  blockchain: string;
  balance: string;
  txCount: number;
  firstSeen: string;
  lastSeen: string;
  riskFlags: string[];
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function isBtcAddress(addr: string): boolean {
  return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr);
}

function isEthAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

async function checkBtc(address: string): Promise<CryptoCheckResult> {
  const defaultResult: CryptoCheckResult = {
    address,
    blockchain: 'Bitcoin',
    balance: '0',
    txCount: 0,
    firstSeen: '',
    lastSeen: '',
    riskFlags: [],
  };

  try {
    const response = await fetchWithTimeout(
      `https://blockchain.info/rawaddr/${encodeURIComponent(address)}?limit=10`
    );
    if (response.ok) {
      const data = await response.json();
      const balance = (data.final_balance || 0) / 100000000;
      const txCount = data.n_tx || 0;
      let firstSeen = '';
      let lastSeen = '';

      if (data.txs && data.txs.length > 0) {
        const sorted = [...data.txs].sort(
          (a: { time: number }, b: { time: number }) => a.time - b.time
        );
        firstSeen = new Date(sorted[0].time * 1000).toISOString();
        lastSeen = new Date(sorted[sorted.length - 1].time * 1000).toISOString();
      }

      return {
        address,
        blockchain: 'Bitcoin',
        balance: balance.toFixed(8),
        txCount,
        firstSeen,
        lastSeen,
        riskFlags: [],
      };
    }
  } catch {
    // blockchain.info failed
  }

  try {
    const response = await fetchWithTimeout(
      `https://blockchair.com/bitcoin/dashboards/address/${encodeURIComponent(address)}`
    );
    if (response.ok) {
      const data = await response.json();
      const addrData = data.data?.[address]?.address;
      if (addrData) {
        return {
          address,
          blockchain: 'Bitcoin',
          balance: ((addrData.balance || 0) / 100000000).toFixed(8),
          txCount: addrData.transaction_count || 0,
          firstSeen: addrData.first_seen_receiving || '',
          lastSeen: addrData.last_seen_receiving || '',
          riskFlags: [],
        };
      }
    }
  } catch {
    // blockchair failed
  }

  return defaultResult;
}

async function checkEth(address: string): Promise<CryptoCheckResult> {
  const defaultResult: CryptoCheckResult = {
    address,
    blockchain: 'Ethereum',
    balance: '0',
    txCount: 0,
    firstSeen: '',
    lastSeen: '',
    riskFlags: [],
  };

  try {
    const response = await fetchWithTimeout(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${encodeURIComponent(address)}&startblock=0&endblock=99999999&sort=asc&page=1&offset=10`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.status === '1' && Array.isArray(data.result)) {
        const txs = data.result;
        const txCount = txs.length;
        const firstSeen = txs.length > 0 ? new Date(Number(txs[0].timeStamp) * 1000).toISOString() : '';
        const lastSeen = txs.length > 0 ? new Date(Number(txs[txs.length - 1].timeStamp) * 1000).toISOString() : '';

        const response2 = await fetchWithTimeout(
          `https://api.etherscan.io/api?module=account&action=balance&address=${encodeURIComponent(address)}&tag=latest`
        );
        let balance = '0';
        if (response2.ok) {
          const balData = await response2.json();
          if (balData.status === '1' && balData.result) {
            balance = (Number(balData.result) / 1e18).toFixed(8);
          }
        }

        return {
          address,
          blockchain: 'Ethereum',
          balance,
          txCount,
          firstSeen,
          lastSeen,
          riskFlags: [],
        };
      }
    }
  } catch {
    // etherscan failed
  }

  try {
    const response = await fetchWithTimeout(
      `https://blockchair.com/ethereum/dashboards/address/${encodeURIComponent(address)}`
    );
    if (response.ok) {
      const data = await response.json();
      const addrData = data.data?.[address]?.address;
      if (addrData) {
        return {
          address,
          blockchain: 'Ethereum',
          balance: ((addrData.balance || 0) / 1e18).toFixed(8),
          txCount: addrData.transaction_count || 0,
          firstSeen: addrData.first_seen_receiving || '',
          lastSeen: addrData.last_seen_receiving || '',
          riskFlags: [],
        };
      }
    }
  } catch {
    // blockchair failed
  }

  return defaultResult;
}

export async function checkCryptoWallet(address: string): Promise<CryptoCheckResult> {
  const cleaned = address.trim();

  if (isBtcAddress(cleaned)) {
    return checkBtc(cleaned);
  }

  if (isEthAddress(cleaned)) {
    return checkEth(cleaned);
  }

  // Try as BTC first, then ETH as fallback
  const btcResult = await checkBtc(cleaned);
  if (btcResult.txCount > 0) return btcResult;

  const ethResult = await checkEth(cleaned);
  if (ethResult.txCount > 0) return ethResult;

  return {
    address: cleaned,
    blockchain: 'Unknown',
    balance: '0',
    txCount: 0,
    firstSeen: '',
    lastSeen: '',
    riskFlags: ['unrecognized_address_format'],
  };
}

export function cryptoCheckToSearchResult(result: CryptoCheckResult): SearchResult {
  return {
    id: `crypto-${result.blockchain.toLowerCase()}-${result.address.slice(0, 10)}`,
    platform: 'Crypto Intel',
    username: result.address,
    displayName: `${result.blockchain} Wallet`,
    score: result.txCount > 0 ? Math.min(100, result.txCount * 2) : 0,
    exists: result.txCount > 0,
    status: result.txCount > 0
      ? `Balance: ${result.balance} ${result.blockchain === 'Bitcoin' ? 'BTC' : 'ETH'} | ${result.txCount} txs`
      : 'No transactions found',
    source: 'crypto-check',
    timestamp: Date.now(),
    extra: {
      blockchain: result.blockchain,
      balance: result.balance,
      txCount: result.txCount,
      firstSeen: result.firstSeen,
      lastSeen: result.lastSeen,
      riskFlags: result.riskFlags,
    },
  };
}
