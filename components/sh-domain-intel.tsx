'use client';

import { useState, useCallback } from 'react';
import { Loader2, Globe, Calendar, Server, Code2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DomainIntelData {
  domain: string;
  registrar: string;
  createdDate: string;
  updatedDate: string;
  expiryDate: string;
  nameservers: string[];
  dnsRecords: Record<string, string[]>;
  technologies: string[];
  httpHeaders: Record<string, string>;
}

export function ShDomainIntel() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DomainIntelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/domain-intel?domain=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Falha ao reconhecer domínio');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-[#00E5FF]" />
        <h2 className="text-lg font-semibold text-white">Domain Recon</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Ex: example.com"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reconhecimento'}
        </button>
      </div>

      {error && (
        <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-lg p-3 text-[#FF3B3B] text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#00E5FF] font-mono text-lg font-bold">{data.domain}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Registrar:</span>
              <span className="text-white">{data.registrar}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Criado:</span>
              <span className="text-white">{data.createdDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Atualizado:</span>
              <span className="text-white">{data.updatedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Expira:</span>
              <span className="text-white">{data.expiryDate}</span>
            </div>
          </div>

          {data.nameservers.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-300">Nameservers</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.nameservers.map((ns, i) => (
                  <span key={i} className="badge text-xs">{ns}</span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(data.dnsRecords).length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-300">DNS Records</span>
              </div>
              <div className="space-y-1">
                {Object.entries(data.dnsRecords).map(([type, records]) => (
                  <div key={type} className="text-xs">
                    <span className="text-[#22FF88] font-mono">{type}:</span>
                    {records.map((r, i) => (
                      <span key={i} className="text-gray-400 ml-2">{r}</span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.technologies.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-300">Tecnologias</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.technologies.map((tech, i) => (
                  <span key={i} className="badge bg-[#22FF88]/10 text-[#22FF88] text-xs">{tech}</span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(data.httpHeaders).length > 0 && (
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-300">HTTP Headers</span>
              </div>
              <div className="space-y-1 text-xs">
                {Object.entries(data.httpHeaders).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-[#00E5FF] font-mono">{key}:</span>
                    <span className="text-gray-400 ml-2 break-all">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
