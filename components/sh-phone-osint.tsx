'use client';

import { useState, useCallback } from 'react';
import { Loader2, Phone, MapPin, Wifi, CheckCircle, XCircle, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/api-client';

interface PhoneOsintData {
  phone: string;
  valid: boolean;
  country: string;
  carrier: string;
  lineType: string;
  whatsapp: boolean;
  socialMedia: { platform: string; url: string; exists: boolean }[];
}

export function ShPhoneOsint() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PhoneOsintData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    const r = await apiPost<{
      success?: boolean;
      data?: PhoneOsintData;
      error?: string;
    }>('/api/phone-osint', { phone: query.trim() });

    if (r.ok && r.data?.success && r.data.data) {
      setData(r.data.data);
    } else {
      setError(!r.ok ? r.error : r.data?.error || 'Falha ao analisar telefone');
    }
    setLoading(false);
  }, [query]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Phone className="w-5 h-5 text-[#00E5FF]" />
        <h2 className="text-lg font-semibold text-white">Phone OSINT</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="tel"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Ex: +5511999998888"
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
            <span className="text-[#00E5FF] font-mono text-lg font-bold">{data.phone}</span>
            {data.valid ? (
              <span className="badge bg-[#22FF88]/20 text-[#22FF88]">
                <CheckCircle className="w-3 h-3 inline mr-1" /> Válido
              </span>
            ) : (
              <span className="badge bg-[#FF3B3B]/20 text-[#FF3B3B]">
                <XCircle className="w-3 h-3 inline mr-1" /> Inválido
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">País:</span>
              <span className="text-white">{data.country}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Operadora:</span>
              <span className="text-white">{data.carrier}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Tipo:</span>
              <span className="text-white">{data.lineType}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {data.whatsapp ? (
                <CheckCircle className="w-4 h-4 text-[#22FF88]" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-gray-400">WhatsApp:</span>
              <span className={data.whatsapp ? 'text-[#22FF88]' : 'text-gray-500'}>
                {data.whatsapp ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>

          {data.socialMedia.filter((s) => s.exists).length > 0 && (
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-300">Redes Sociais</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {data.socialMedia.filter((s) => s.exists).map((sm, i) => (
                  <span key={i} className="badge bg-[#00E5FF]/10 text-[#00E5FF] text-xs">{sm.platform}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
