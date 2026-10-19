'use client';

import { useState, useCallback } from 'react';
import { Loader2, Globe, MapPin, Wifi, Shield, Smartphone, Server, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IpIntelData {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  isp: string;
  org: string;
  as: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
  latitude: number;
  longitude: number;
  timezone: string;
}

export function ShIpIntel() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IpIntelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/ip-intel?ip=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Falha ao consultar IP');
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
        <h2 className="text-lg font-semibold text-white">IP Intelligence</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Ex: 8.8.8.8"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
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
            <span className="text-[#00E5FF] font-mono text-lg font-bold">{data.ip}</span>
            <span className="badge">{data.countryCode}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Local:</span>
              <span className="text-white">{data.city}, {data.region}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">País:</span>
              <span className="text-white">{data.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">ISP:</span>
              <span className="text-white">{data.isp}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Org:</span>
              <span className="text-white">{data.org}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Server className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">AS:</span>
              <span className="text-white">{data.as}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className={cn('badge', data.mobile ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-gray-800 text-gray-500')}>
              <Smartphone className="w-3 h-3 inline mr-1" /> Mobile
            </span>
            <span className={cn('badge', data.proxy ? 'bg-[#FF3B3B]/20 text-[#FF3B3B]' : 'bg-gray-800 text-gray-500')}>
              <Shield className="w-3 h-3 inline mr-1" /> Proxy
            </span>
            <span className={cn('badge', data.hosting ? 'bg-[#22FF88]/20 text-[#22FF88]' : 'bg-gray-800 text-gray-500')}>
              <Server className="w-3 h-3 inline mr-1" /> Hosting
            </span>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-[#1E293B]">
            Coordenadas: {data.latitude}, {data.longitude} | TZ: {data.timezone}
          </div>
        </div>
      )}
    </div>
  );
}
