import { SearchResult } from './types';

export interface SubdomainResult {
  subdomain: string;
  domain: string;
  ip: string | null;
  found: boolean;
  responseTime: number;
}

const COMMON_SUBDOMAINS = [
  'www', 'mail', 'ftp', 'admin', 'api', 'dev', 'staging', 'test', 'blog',
  'shop', 'store', 'app', 'cdn', 'images', 'static', 'media', 'docs', 'wiki',
  'status', 'monitor', 'grafana', 'kibana', 'elasticsearch', 'redis', 'db',
  'mysql', 'postgres', 'mongo', 'vpn', 'remote', 'ssh', 'portal', 'sso',
  'auth', 'login', 'dashboard', 'panel', 'cpanel', 'webmail', 'smtp', 'pop',
  'imap', 'ns1', 'ns2', 'ns3', 'dns', 'mx', 'proxy', 'gateway', 'load',
  'balancer', 'web', 'intranet', 'internal', 'secure', 'ssl', 'git', 'gitlab',
  'jenkins', 'ci', 'cd', 'docker', 'k8s', 'kubernetes', 'grafana', 'prometheus',
  'nagios', 'zabbix', 'backup', 'archive', 'old', 'new', 'beta', 'alpha',
  'demo', 'sandbox', 'preview', 'release', 'production', 'live', 'uat', 'qa',
  'stage', 'stage1', 'stage2', 'preprod', 'canary', 'edge', 'node', 'node1',
  'node2', 'cluster', 'master', 'slave', 'primary', 'secondary', 'replica',
  'read', 'write', 'cache', 'queue', 'worker', 'scheduler', 'cron', 'job',
  'task', 'event', 'log', 'logs', 'elk', 'efk', 'metrics', 'tracing',
  'observability', 'apm', 'sentry', 'bugsnag', 'rollbar', 'datadog', 'dynatrace',
  'newrelic', 'pagerduty', 'opsgenie', 'jira', 'confluence', 'trello', 'asana',
  'notion', 'airtable', 'slack', 'teams', 'discord', 'zoom', 'meet', 'calendar',
  'crm', 'erp', 'hr', 'finance', 'accounting', 'billing', 'payment', 'checkout',
  'cart', 'order', 'inventory', 'warehouse', 'shipping', 'tracking', 'delivery',
  'returns', 'refund', 'support', 'help', 'helpdesk', 'ticket', 'chat', 'call',
  'phone', 'voip', 'pbx', 'sip', 'trunk', 'route', 'router', 'switch', 'firewall',
  'ids', 'ips', 'waf', 'ddos', 'cdn2', 'edge2', 'origin', 'backend', 'frontend',
  'server', 'servers', 'host', 'hosts', 'node01', 'node02', 'web01', 'web02',
  'app01', 'app02', 'db01', 'db02', 'db-master', 'db-slave', 'db-replica',
  'redis01', 'redis02', 'memcache', 'elastic', 'solr', 'riak', 'couchdb',
  'cassandra', 'neo4j', 'dgraph', 'influxdb', 'timescaledb', 'clickhouse',
  'bigquery', 'snowflake', 'redshift', 's3', 'gcs', 'azure', 'minio', 'oss',
];

async function resolveSubdomain(subdomain: string, domain: string): Promise<SubdomainResult> {
  const fqdn = `${subdomain}.${domain}`;
  const startTime = Date.now();

  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${fqdn}&type=A`,
      {
        headers: { 'User-Agent': 'shandon-elite-subdomain-finder' },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) {
      return {
        subdomain: fqdn,
        domain,
        ip: null,
        found: false,
        responseTime: Date.now() - startTime,
      };
    }

    const data = await response.json();
    const answers = data.Answer || [];
    const aRecord = answers.find(
      (a: { type: number }) => a.type === 1
    );

    if (aRecord) {
      return {
        subdomain: fqdn,
        domain,
        ip: aRecord.data,
        found: true,
        responseTime: Date.now() - startTime,
      };
    }

    return {
      subdomain: fqdn,
      domain,
      ip: null,
      found: false,
      responseTime: Date.now() - startTime,
    };
  } catch {
    return {
      subdomain: fqdn,
      domain,
      ip: null,
      found: false,
      responseTime: Date.now() - startTime,
    };
  }
}

export async function findSubdomains(domain: string): Promise<SubdomainResult[]> {
  const BATCH_SIZE = 20;
  const results: SubdomainResult[] = [];

  for (let i = 0; i < COMMON_SUBDOMAINS.length; i += BATCH_SIZE) {
    const batch = COMMON_SUBDOMAINS.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((sub) => resolveSubdomain(sub, domain))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
}

export function subdomainToSearchResult(result: SubdomainResult): SearchResult {
  return {
    id: `subdomain-${result.subdomain.replace(/\./g, '-')}`,
    platform: 'DNS',
    username: result.subdomain,
    displayName: result.subdomain,
    score: result.found ? 80 : 0,
    exists: result.found,
    status: result.found ? `Resolved to ${result.ip}` : 'Not found',
    url: result.found ? `http://${result.subdomain}` : undefined,
    source: 'http-checker',
    timestamp: Date.now(),
    extra: {
      ip: result.ip,
      responseTime: result.responseTime,
      domain: result.domain,
    },
  };
}
