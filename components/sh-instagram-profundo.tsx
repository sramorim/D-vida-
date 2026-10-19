'use client'

import { useState, useCallback } from 'react';
import {
  Instagram,
  Loader2,
  Users,
  UserCircle,
  Hash,
  BadgeCheck,
  Link2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import { apiGet } from '@/lib/api-client';
import type { InstagramPublicProfile } from '@/lib/instagram/public';

/**
 * Perfil público do Instagram, em detalhe.
 *
 * Esta tela existia como arquivo solto no repositório, sem nenhuma ligação
 * com o menu nem com a home, e com os tipos incompatíveis com a rota que ela
 * chamava: pedia `fullName`/`followersCount`/`latestPosts`, e
 * `/api/instagram/public` devolve `fullName`/`followers` e nada de posts.
 * Na prática ela não renderizava nada.
 *
 * Agora ela consome a forma real da resposta e mostra também o que a rota
 * trazia e a tela ignorava: e-mail e telefone públicos, cidade e categoria
 * comercial — que é justamente o que interessa numa investigação.
 *
 * Uma limitação que vale deixar explícita: a rota pública não traz os posts.
 * Ela lê os dados do JSON embutido da página do perfil. Quem precisa de posts,
 * seguidores detalhados e、生物 bio completa usa o Analyzer, que depende de
 * sessão autenticada.
 */

export function ShInstagramProfundo() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [perfil, setPerfil] = useState<InstagramPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    const username = query.trim().replace(/^@+/, '');
    if (!username) return;

    setLoading(true);
    setError(null);
    setPerfil(null);

    const r = await apiGet<{
      success?: boolean;
      error?: string;
      data?: InstagramPublicProfile;
    }>(`/api/instagram/public?username=${encodeURIComponent(username)}`);

    if (r.ok && r.data?.success && r.data.data) {
      setPerfil(r.data.data);
    } else {
      setError(!r.ok ? r.error : r.data?.error || 'Falha na consulta');
    }
    setLoading(false);
  }, [query]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Instagram className="w-5 h-5 text-[#00E5FF]" />
        <div>
          <h2 className="text-lg font-semibold text-white">Perfil Público do Instagram</h2>
          <p className="text-[11px] text-gray-500">
            Nome real, bio, seguidores, contatos públicos e cidade
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Username do Instagram, ex.: sr__amorim"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading || !query.trim()} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Consultar'}
        </button>
      </div>

      {error && (
        <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-lg p-3 text-[#FF3B3B] text-sm">
          {error}
        </div>
      )}

      {perfil && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5">
            {perfil.avatarUrl ? (
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-[#00E5FF]/40 bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={perfil.avatarUrl} alt={perfil.username} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/[0.03] border border-[#1E293B]">
                <UserCircle className="w-9 h-9 text-gray-600" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[#00E5FF] font-mono text-lg font-bold">@{perfil.username}</span>
                {perfil.isVerified && <BadgeCheck className="w-5 h-5 text-[#00E5FF]" />}
              </div>
              {perfil.fullName && (
                <div className="text-sm text-gray-300 truncate">{perfil.fullName}</div>
              )}
              {(perfil.isPrivate || perfil.isBusiness) && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {perfil.isPrivate && <span className="badge bg-[#FF3B3B]/15 text-[#FF6B6B]">Privado</span>}
                  {perfil.isBusiness && (
                    <span className="badge bg-[#F59E0B]/15 text-[#FBBF24]">
                      {perfil.category || 'Conta Business'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {perfil.isPrivate && (
            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-lg p-3 text-[#FBBF24] text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Perfil privado. O que aparece aqui é o que o próprio Instagram
                deixa visível para quem não segue — posts e seguidores não são
                públicos.
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Stat value={perfil.followers} label="Seguidores" icon={<Users className="w-4 h-4" />} />
            <Stat value={perfil.following} label="Seguindo" icon={<UserCircle className="w-4 h-4" />} />
            <Stat value={perfil.posts} label="Posts" icon={<Instagram className="w-4 h-4" />} />
          </div>

          <div className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Bio</h3>
            <p className="text-xs text-gray-300 whitespace-pre-wrap">{perfil.bio || '—'}</p>
            {perfil.externalUrl && (
              <a
                href={perfil.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#00E5FF] hover:underline break-all"
              >
                <Link2 className="w-3.5 h-3.5 shrink-0" /> {perfil.externalUrl}
              </a>
            )}
          </div>

          {(perfil.publicEmail || perfil.publicPhone || perfil.city) && (
            <div className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-5 space-y-2.5">
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22FF88]" />
                Dados de contato expostos pelo perfil
              </h3>
              {perfil.publicEmail && (
                <ContactRow icon={<Mail className="w-3.5 h-3.5" />} label="E-mail" value={perfil.publicEmail} href={`mailto:${perfil.publicEmail}`} />
              )}
              {perfil.publicPhone && (
                <ContactRow icon={<Phone className="w-3.5 h-3.5" />} label="Telefone" value={perfil.publicPhone} href={`tel:${perfil.publicPhone}`} />
              )}
              {perfil.city && (
                <ContactRow icon={<MapPin className="w-3.5 h-3.5" />} label="Cidade" value={perfil.city} />
              )}
            </div>
          )}

          <div className="text-[10px] text-gray-600 flex items-center gap-1.5">
            <Hash className="w-3 h-3" />
            Fonte: {perfil.source === 'og-tags' ? 'tags OG da página' : 'JSON embutido da página'}
          </div>

          {perfil.profileUrl && (
            <div className="flex justify-center pt-1">
              <a
                href={perfil.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.07] transition-all"
              >
                <Briefcase className="w-3.5 h-3.5" /> Abrir perfil no Instagram
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, icon }: { value: number | null; label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0A0D14] border border-[#1E293B] rounded-xl p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1 text-[#00E5FF]">
        {icon}
        <span className="text-white font-bold text-sm">
          {value === null || value === undefined ? '—' : new Intl.NumberFormat('pt-BR').format(value)}
        </span>
      </div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-gray-500 shrink-0">
        {icon}
        {label}
      </span>
      {href ? (
        <a href={href} className="text-[#22FF88] font-mono hover:underline break-all text-right">
          {value}
        </a>
      ) : (
        <span className="text-white/70 font-mono break-all text-right">{value}</span>
      )}
    </div>
  );
}
