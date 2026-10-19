'use client'

import { Camera, Upload, Loader2 } from 'lucide-react'
import { useState, useRef } from 'react'
import { ShHelpGuide } from './sh-help-guide'
import { ShUpsell } from './sh-upsell'

export function ShMetadataExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleExtract = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setMetadata(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/premium/advanced/metadata', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) {
        setMetadata(data.data)
      } else {
        setError(data.error || 'Erro ao extrair metadados')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Camera size={14} className="text-pink-400" />
          <span className="text-[10px] font-black tracking-[0.2em] uppercase text-pink-400/60">Metadata Extractor</span>
        </div>
        <h2 className="text-[20px] font-black text-white/90">Extração de Metadados</h2>
      </div>

      <ShHelpGuide
        what="Todo arquivo carrega uma ‘etiqueta escondida’ — quem tirou a foto, em qual aparelho, quando, em que lugar. Esta ferramenta lê essa etiqueta. É assim que se descobre a origem de uma foto ou documento."
        steps={[
          { title: 'Selecione o arquivo', detail: 'Aceita foto, documento, word, pdf e também arquivos .zip (pasta compactada com vários arquivos dentro).' },
          { title: 'Clique em "Extrair"', detail: 'O sistema lê o arquivo e mostra todos os metadados gravados nele.' },
          { title: 'Leia os metadados', detail: 'Data, aparelho, software e localização — é a assinatura invisível de quem criou o arquivo.' },
        ]}
        example="IMG_2024_10_05.JPG · arquivo.zip · documento.doc"
      />

      <div className="rounded-[16px] border border-dashed border-white/[0.1] bg-[#0F121A] p-8 text-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <Upload size={24} className="mx-auto text-white/20 mb-3" />
        <p className="text-[12px] text-white/40 mb-3">
          {file ? file.name : 'Arraste ou clique para selecionar'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-[10px] bg-white/5 border border-white/10 px-4 py-2 text-[11px] text-white/60 hover:bg-white/10"
          >
            Selecionar Arquivo
          </button>
          {file && (
            <button
              onClick={handleExtract}
              disabled={loading}
              className="flex items-center gap-2 rounded-[10px] bg-pink-500/20 border border-pink-500/30 px-4 py-2 text-[11px] font-bold text-pink-400 hover:bg-pink-500/30 disabled:opacity-40"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              Extrair
            </button>
          )}
        </div>
      </div>

      {error && <div className="rounded-[12px] bg-red-500/10 border border-red-500/20 p-4 text-[12px] text-red-400">{error}</div>}

      {metadata && (
        <div className="rounded-[16px] border border-pink-500/10 bg-[#0F121A] p-5 space-y-2">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between text-[12px]">
              <span className="text-white/40">{key}</span>
              <span className="text-white/70 font-mono text-right max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>
      )}

      <ShUpsell
        title="A foto tem GPS dentro dela"
        description="Você acabou de ler o que a etiqueta mostra por cima. No PRO, a extração vai mais fundo: cruza a localização com o endereço na rua, monta o histórico e agrupa tudo em lote (vários arquivos de uma vez)."
        bullets={[
          'Extrair vários arquivos de uma vez',
          'Geolocalização convertida em endereço de rua',
          'Relatório completo para organizar as provas',
        ]}
        cta="Extrair em lote no PRO"
      />
    </div>
  )
}
