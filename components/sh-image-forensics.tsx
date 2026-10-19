'use client';

import { useState, useCallback } from 'react';
import { Loader2, Camera, MapPin, Aperture, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageForensicsData {
  url: string;
  exifData: Record<string, string>;
  gps: { latitude: number; longitude: number } | null;
  camera: {
    make: string;
    model: string;
    software: string;
    focalLength: string;
    aperture: string;
    iso: string;
  } | null;
  metadata: {
    fileSize: string;
    dimensions: string;
    format: string;
    colorSpace: string;
  };
}

export function ShImageForensics() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ImageForensicsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/image-forensics?url=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error('Falha ao analisar imagem');
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
        <Camera className="w-5 h-5 text-[#00E5FF]" />
        <h2 className="text-lg font-semibold text-white">Image Forensics</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="URL da imagem"
          className="input-field flex-1"
        />
        <button onClick={handleSearch} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analisar Imagem'}
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
            <span className="text-[#00E5FF] font-mono text-xs truncate max-w-[70%]">{data.url}</span>
            <span className="badge">{data.metadata.format}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Tamanho:</span>
              <span className="text-white">{data.metadata.fileSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#22FF88]" />
              <span className="text-gray-400">Dimensões:</span>
              <span className="text-white">{data.metadata.dimensions}</span>
            </div>
          </div>

          {data.camera && (
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 mb-2">
                <Aperture className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-300">Câmera</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Marca:</span> <span className="text-white">{data.camera.make}</span></div>
                <div><span className="text-gray-400">Modelo:</span> <span className="text-white">{data.camera.model}</span></div>
                <div><span className="text-gray-400">Software:</span> <span className="text-white">{data.camera.software}</span></div>
                <div><span className="text-gray-400">Focal:</span> <span className="text-white">{data.camera.focalLength}</span></div>
                <div><span className="text-gray-400">Abertura:</span> <span className="text-white">{data.camera.aperture}</span></div>
                <div><span className="text-gray-400">ISO:</span> <span className="text-white">{data.camera.iso}</span></div>
              </div>
            </div>
          )}

          {data.gps && (
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#FF3B3B]" />
                <span className="text-sm font-medium text-gray-300">GPS</span>
              </div>
              <div className="text-xs text-white">
                {data.gps.latitude}, {data.gps.longitude}
              </div>
            </div>
          )}

          {Object.keys(data.exifData).length > 0 && (
            <div className="pt-2 border-t border-[#1E293B]">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-sm font-medium text-gray-300">Dados EXIF</span>
              </div>
              <div className="space-y-1 text-xs max-h-40 overflow-y-auto">
                {Object.entries(data.exifData).map(([key, val]) => (
                  <div key={key}>
                    <span className="text-[#22FF88] font-mono">{key}:</span>
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
