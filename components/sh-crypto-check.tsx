'use client';

import { useState, useCallback } from 'react';
import { Loader2, Coins, Activity, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/api-client';

interface CryptoCheckData {
  address: string;
  blockchain: string;
  balance: string;
  txCount: number;
  firstSeen: string;
  lastSeen: string;
  riskFlags: string[];
}

export function ShCryptoCheck() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CryptoCheckData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    const r = await apiPost<{
      success?: boolean;
      data?: CryptoCheckData;
      error?: string;
    }>('/api/crypto-check', { address: query.trim() });

    if (r.ok && r.data?.success && r.data.data) {
      setData(r.data.data);
    } else {
      setError(!r.ok ? r.error : r.data?.error || 'Falha ao analisar carteira');
    }
    setLoading(false);
  }, [query]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Coins className="w-5 h-5 text-[#22FF88]" />
        <h2 className="text-lg font-semibold text-white">Crypto Wallet Intel</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Endereço da carteira"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analisar'}
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
            <span className="text-[#00E5FF] font-mono text-xs break-all">{data.address}</span>
            <span className="badge bg-[#22FF88]/20 text-[#22FF88]">{data.blockchain}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Saldo:</span>
              <span className="text-white font-bold">{data.balance}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Transações:</span>
              <span className="text-white font-bold">{data.txCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Primeira atividade:</span>
              <span className="text-white">{data.firstSeen}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Última atividade:</span>
              <span className="text-white">{data.lastSeen}</span>
            </div>
          </div>

          {data.riskFlags.length > 0 && (
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[#FF3B3B]" />
                <span className="text-sm font-medium text-[#FF3B3B]">Flags de Risco</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.riskFlags.map((flag, i) => (
                  <span key={i} className="badge bg-[#FF3B3B]/20 text-[#FF3B3B] text-xs">{flag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
