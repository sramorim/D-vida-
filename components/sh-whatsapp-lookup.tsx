'use client';

import { useState, useCallback } from 'react';
import {
  Loader2, MessageCircle, Image as ImageIcon, UserCircle, Briefcase,
  Smartphone, ShieldCheck, Database, AlertTriangle, Phone,
} from 'lucide-react';
import { apiPost } from '@/lib/api-client';

interface PhotoInfo { hasPhoto: boolean; image?: string | null }
interface LookupResult {
  phone: string;
  configured: boolean;
  photo?: PhotoInfo | null;
  about?: Record<string, unknown> | null;
  business?: Record<string, unknown> | null;
  devices?: Record<string, unknown> | null;
  privacy?: Record<string, unknown> | null;
  full?: Record<string, unknown> | null;
  errors: string[];
}

function val(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Field({ k, v }: { k: string; v: unknown }) {
  const label = k.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#1E293B] py-2 last:border-0">
      <span className="text-xs capitalize text-gray-400">{label}</span>
      <span className="text-xs text-right break-all text-white font-mono">{val(v)}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#00E5FF]" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function ShWhatsAppLookup() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    const r = await apiPost<{ success?: boolean; error?: string } & LookupResult>(
      '/api/whatsapp-lookup',
      { phone: query.trim() }
    );

    if (r.ok && r.data) {
      setData(r.data);
    } else {
      setError(!r.ok ? r.error : r.data?.error || 'Falha na consulta');
    }
    setLoading(false);
  }, [query]);

  const hasData =
    data && (data.photo?.hasPhoto || data.about || data.business || data.devices || data.privacy || data.full);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-[#00E5FF]" />
        <div>
          <h2 className="text-lg font-semibold text-white">WhatsApp Lookup</h2>
          <p className="text-[11px] text-gray-500">Foto de perfil · status · negócio · dispositivos · privacidade — via API OSINT. Feito para a SR. AMORIM</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="tel"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Número com código do país, ex.: 554797876098"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar'}
        </button>
      </div>

      <p className="text-[11px] text-gray-500">
        Use o código do país (55 para Brasil) e somente números.
      </p>

      {error && (
        <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-lg p-3 text-[#FF3B3B] text-sm">
          {error}
        </div>
      )}

      {data && !data.configured && (
        <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-4 text-sm">
          <div className="flex items-start gap-2 text-[#FBBF24]">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Chave da API não configurada.</span>{' '}
              <span className="text-gray-400">Adicione a variável <code className="font-mono">RAPIDAPI_WHATSAPP_KEY</code> no ambiente (Cloudflare dashboard) para liberar a consulta.</span>
            </div>
          </div>
        </div>
      )}

      {data && data.configured && !hasData && data.errors.length === 0 && (
        <div className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5 text-sm text-gray-400">
          Nenhum dado retornado para este número.
        </div>
      )}

      {data && hasData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5">
            <div>
              <span className="text-[#00E5FF] font-mono text-lg font-bold">{data.phone}</span>
              <span className="ml-3 badge bg-[#22FF88]/20 text-[#22FF88]">WhatsApp OSINT</span>
            </div>
            <Phone className="w-5 h-5 text-gray-500" />
          </div>

          <div className="flex items-start gap-4 bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5">
            {data.photo?.hasPhoto && data.photo.image ? (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-[#00E5FF]/40 bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.photo.image} alt="Perfil" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/[0.03] border border-[#1E293B]">
                <ImageIcon className="w-8 h-8 text-gray-600" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-[#00E5FF]" /> Perfil
              </h3>
              <p className="text-xs mt-1 text-gray-400">
                {data.photo?.hasPhoto ? 'Foto de perfil disponível' : 'Sem foto de perfil (ou oculta)'}
              </p>
            </div>
          </div>

          {data.about && (
            <Section icon={UserCircle} title="Status / Sobre">
              {Object.entries(data.about).map(([k, v]) => <Field key={k} k={k} v={v} />)}
            </Section>
          )}

          {data.business && (
            <Section icon={Briefcase} title="Conta Business">
              {Object.entries(data.business).map(([k, v]) => <Field key={k} k={k} v={v} />)}
            </Section>
          )}

          {data.devices && (
            <Section icon={Smartphone} title="Dispositivos vinculados">
              {Object.entries(data.devices).map(([k, v]) => <Field key={k} k={k} v={v} />)}
            </Section>
          )}

          {data.privacy && (
            <Section icon={ShieldCheck} title="Privacidade">
              {Object.entries(data.privacy).map(([k, v]) => <Field key={k} k={k} v={v} />)}
            </Section>
          )}

          {data.full && (
            <details className="group bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white">
                <Database className="w-4 h-4 text-[#00E5FF]" /> Dados completos (JSON)
              </summary>
              <pre className="mt-3 overflow-auto rounded-lg bg-[#05080F] border border-[#1E293B] p-3 text-[11px] text-[#22FF88]/80 font-mono max-h-80">
                {JSON.stringify(data.full, null, 2)}
              </pre>
            </details>
          )}

          {data.errors.length > 0 && (
            <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-lg p-3 text-sm text-[#FF3B3B]">
              <div className="font-semibold mb-1">Parcial:</div>
              <ul className="list-disc pl-5 text-xs space-y-1">
                {data.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}