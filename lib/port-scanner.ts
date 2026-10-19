import { SearchResult } from './types';

export interface PortInfo {
  port: number;
  service: string;
  open: boolean;
  responseTime: number;
}

export interface PortScanResult {
  host: string;
  totalPorts: number;
  openPorts: PortInfo[];
  closedPorts: PortInfo[];
  scanTime: number;
}

const COMMON_PORTS: Record<number, string> = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  445: 'SMB',
  993: 'IMAPS',
  995: 'POP3S',
  1433: 'MSSQL',
  1521: 'Oracle',
  2049: 'NFS',
  3000: 'Dev-Server',
  3306: 'MySQL',
  3389: 'RDP',
  5432: 'PostgreSQL',
  5672: 'RabbitMQ',
  5900: 'VNC',
  6379: 'Redis',
  6443: 'K8s-API',
  8000: 'HTTP-Alt',
  8080: 'HTTP-Alt',
  8443: 'HTTPS-Alt',
  8888: 'HTTP-Alt',
  9090: 'Prometheus',
  9200: 'Elasticsearch',
  9300: 'Elasticsearch',
  11211: 'Memcached',
  27017: 'MongoDB',
  27018: 'MongoDB',
  50000: 'SAP',
};

async function checkPort(host: string, port: number): Promise<PortInfo> {
  const serviceName = COMMON_PORTS[port] || 'Unknown';
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const protocol = port === 443 || port === 8443 || port === 993 || port === 995 || port === 6443 ? 'https' : 'http';
    const url = `${protocol}://${host}:${port}/`;

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    return {
      port,
      service: serviceName,
      open: true,
      responseTime: elapsed,
    };
  } catch {
    const elapsed = Date.now() - startTime;

    if (elapsed < 3000) {
      return {
        port,
        service: serviceName,
        open: false,
        responseTime: elapsed,
      };
    }

    return {
      port,
      service: serviceName,
      open: false,
      responseTime: elapsed,
    };
  }
}

export async function scanPorts(
  host: string,
  ports?: number[]
): Promise<PortScanResult> {
  const startTime = Date.now();
  const targetPorts = ports || Object.keys(COMMON_PORTS).map(Number);
  const BATCH_SIZE = 10;

  const allResults: PortInfo[] = [];

  for (let i = 0; i < targetPorts.length; i += BATCH_SIZE) {
    const batch = targetPorts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((port) => checkPort(host, port))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        allResults.push(result.value);
      }
    }
  }

  const openPorts = allResults.filter((p) => p.open);
  const closedPorts = allResults.filter((p) => !p.open);

  return {
    host,
    totalPorts: targetPorts.length,
    openPorts,
    closedPorts,
    scanTime: Date.now() - startTime,
  };
}

export function portScanToSearchResult(result: PortScanResult): SearchResult {
  const openPortsList = result.openPorts.map((p) => `${p.port}/${p.service}`).join(', ');

  return {
    id: `portscan-${result.host.replace(/\./g, '-')}`,
    platform: 'Port Scanner',
    username: result.host,
    displayName: 'Network Port Scan',
    score: result.openPorts.length > 0 ? Math.min(100, result.openPorts.length * 10) : 0,
    exists: result.openPorts.length > 0,
    status: result.openPorts.length > 0
      ? `${result.openPorts.length} open: ${openPortsList}`
      : 'No open ports detected',
    source: 'http-checker',
    timestamp: Date.now(),
    extra: {
      host: result.host,
      openPorts: result.openPorts,
      totalPorts: result.totalPorts,
      scanTime: result.scanTime,
    },
  };
}
