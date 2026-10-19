export interface AuthenticationResult {
  mechanism: string;
  result: string;
  details: string;
}

export interface ReceivedHop {
  from: string;
  by: string;
  with: string;
  id: string;
  timestamp: string;
  delay: number | null;
}

export interface EmailHeaderResult {
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  date: string;
  messageId: string;
  xMailer: string;
  userAgent: string;
  returnPath: string;
  receivedHeaders: ReceivedHop[];
  originIP: string | null;
  originServer: string | null;
  forwardingPath: string[];
  authenticationResults: AuthenticationResult[];
  spfResult: string | null;
  dkimResult: string | null;
  dmarcResult: string | null;
  mimeVersion: string;
  contentType: string;
  xPriority: string;
  rawHeaders: Record<string, string>;
}

function extractHeader(headers: Record<string, string>, name: string): string {
  const key = Object.keys(headers).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  return key ? headers[key] : '';
}

function parseReceivedHeaders(rawHeader: string): ReceivedHop[] {
  const receivedLines: string[] = [];
  const lines = rawHeader.split('\n');
  let currentReceived = '';

  for (const line of lines) {
    if (/^received:/i.test(line.trim())) {
      if (currentReceived) {
        receivedLines.push(currentReceived);
      }
      currentReceived = line.replace(/^received:\s*/i, '');
    } else if (/^\s/.test(line) && currentReceived) {
      currentReceived += ' ' + line.trim();
    }
  }
  if (currentReceived) {
    receivedLines.push(currentReceived);
  }

  return receivedLines.map((hop) => {
    const fromMatch = hop.match(/from\s+([^\s;]+)/i);
    const byMatch = hop.match(/by\s+([^\s;]+)/i);
    const withMatch = hop.match(/with\s+([^\s;]+)/i);
    const idMatch = hop.match(/id\s+([^\s;]+)/i);
    const dateMatch = hop.match(/;\s*(.+)/i);

    return {
      from: fromMatch ? fromMatch[1] : '',
      by: byMatch ? byMatch[1] : '',
      with: withMatch ? withMatch[1] : '',
      id: idMatch ? idMatch[1] : '',
      timestamp: dateMatch ? dateMatch[1].trim() : '',
      delay: null,
    };
  });
}

function parseAuthenticationResults(authHeader: string): AuthenticationResult[] {
  const results: AuthenticationResult[] = [];
  const mechanisms = authHeader.split(';').map((m) => m.trim());

  for (const mechanism of mechanisms) {
    const match = mechanism.match(/^(\w+)\s*=\s*(\w+)/);
    if (match) {
      results.push({
        mechanism: match[1],
        result: match[2],
        details: mechanism,
      });
    }
  }

  return results;
}

function extractIP(text: string): string | null {
  const ipv4Match = text.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  if (ipv4Match) return ipv4Match[1];

  const ipv6Match = text.match(/\b([0-9a-fA-F:]+:[0-9a-fA-F:]+)\b/);
  if (ipv6Match) return ipv6Match[1];

  return null;
}

export function analyzeEmailHeader(header: string): EmailHeaderResult {
  const lines = header.split('\n');
  const rawHeaders: Record<string, string> = {};
  let currentKey = '';

  for (const line of lines) {
    if (/^[^\s:]+:/.test(line)) {
      const colonIndex = line.indexOf(':');
      currentKey = line.substring(0, colonIndex).trim();
      rawHeaders[currentKey] = line.substring(colonIndex + 1).trim();
    } else if (currentKey && /^\s/.test(line)) {
      rawHeaders[currentKey] += ' ' + line.trim();
    }
  }

  const subject = extractHeader(rawHeaders, 'Subject');
  const from = extractHeader(rawHeaders, 'From');
  const toStr = extractHeader(rawHeaders, 'To');
  const ccStr = extractHeader(rawHeaders, 'Cc');
  const date = extractHeader(rawHeaders, 'Date');
  const messageId = extractHeader(rawHeaders, 'Message-ID');
  const xMailer = extractHeader(rawHeaders, 'X-Mailer') || extractHeader(rawHeaders, 'User-Agent');
  const userAgent = extractHeader(rawHeaders, 'User-Agent');
  const returnPath = extractHeader(rawHeaders, 'Return-Path');
  const mimeVersion = extractHeader(rawHeaders, 'MIME-Version');
  const contentType = extractHeader(rawHeaders, 'Content-Type');
  const xPriority = extractHeader(rawHeaders, 'X-Priority') || extractHeader(rawHeaders, 'X-MSMail-Priority');

  const to = toStr ? toStr.split(',').map((t) => t.trim()) : [];
  const cc = ccStr ? ccStr.split(',').map((c) => c.trim()) : [];

  const receivedHeaders = parseReceivedHeaders(header);
  const forwardingPath = receivedHeaders.map((h) => h.by).filter(Boolean);

  const originHop = receivedHeaders.length > 0 ? receivedHeaders[0] : null;
  const originIP = originHop ? extractIP(originHop.from) : null;
  const originServer = originHop ? originHop.by : null;

  const authHeader = extractHeader(rawHeaders, 'Authentication-Results') ||
    extractHeader(rawHeaders, 'ARC-Authentication-Results');
  const authenticationResults = authHeader ? parseAuthenticationResults(authHeader) : [];

  const spfResult = authenticationResults.find((r) => r.mechanism === 'spf')?.result || null;
  const dkimResult = authenticationResults.find((r) => r.mechanism === 'dkim')?.result || null;
  const dmarcResult = authenticationResults.find((r) => r.mechanism === 'dmarc')?.result || null;

  return {
    subject,
    from,
    to,
    cc,
    date,
    messageId,
    xMailer,
    userAgent,
    returnPath,
    receivedHeaders,
    originIP,
    originServer,
    forwardingPath,
    authenticationResults,
    spfResult,
    dkimResult,
    dmarcResult,
    mimeVersion,
    contentType,
    xPriority,
    rawHeaders,
  };
}
