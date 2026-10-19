'use client';

import { useState, useCallback } from 'react';
import { Loader2, Database, AlertTriangle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExposedDbData {
  target: string;
  databasesFound: number;
  databases: Array<{
    name: string;
    records: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

const riskColors: Record<string, string> = {
  low: 'bg-[#22FF88]/20 text-[#22FF88]',
  medium: 'bg-[#00E5FF]/20 text-[#00E5FF]',
  high: 'bg-[#FF3B3B]/20 text-[#FF3B3B]',
  critical: 'bg-[#FF3B3B]/30 text-[#FF3B3B] font-bold',
};

export function ShExposedDb() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExposedDbData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/exposed-db?target=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Falha ao verificar banco de dados');
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
        <Database className="w-5 h-5 text-[#00E5FF]" />
        <h2 className="text-lg font-semibold text-white">Exposed Database Checker</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Alvo (domínio, IP, empresa)"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
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
            <span className="text-[#00E5FF] font-mono text-sm">{data.target}</span>
            <span className="badge">
              {data.databasesFound} {data.databasesFound === 1 ? 'banco' : 'bancos'} encontrados
            </span>
          </div>

          {data.databasesFound === 0 && (
            <div className="flex items-center gap-2 text-[#22FF88] text-sm py-2">
              <Search className="w-4 h-4" />
              Nenhum banco de dados exposto encontrado.
            </div>
          )}

          {data.databases.length > 0 && (
            <div className="space-y-2">
              {data.databases.map((db, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-[#141A28] border border-[#1E293B] rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#00E5FF]" />
                    <span className="text-white text-sm">{db.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{db.records.toLocaleString()} registros</span>
                    <span className={cn('badge text-xs', riskColors[db.riskLevel])}>
                      {db.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
