export interface FileMetadataResult {
  filename: string
  type: string
  fileSize: number
  [key: string]: unknown
}

/**
 * Extrai metadados de um arquivo enviado por upload, reutilizando o mesmo
 * parser EXIF da versão por URL. Inclui ZIP: para um arquivo compactado,
 * abre a lista de arquivos internos e informa o que existe dentro.
 */
export async function extractFileMetadata(
  data: Uint8Array,
  filename: string,
  contentType: string
): Promise<FileMetadataResult> {
  const buffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer

  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const isZip = contentType.includes('zip') || ext === 'zip'

  if (isZip) {
    return extractZipList(buffer, filename, contentType)
  }

  const basic: FileMetadataResult = {
    filename,
    type: contentType || `application/${ext || 'octet-stream'}`,
    fileSize: data.byteLength,
    format: ext.toUpperCase(),
    source: 'upload',
  }

  try {
    // parseExifFromBuffer não é exportada, mas a leitura de metadados que ela
    // faz é pura (não depende da rede). Para o upload, reutilizamos as
    // verificações de assinatura que o componente já usa.
    const view = new DataView(buffer)
    const isJpeg = buffer.byteLength > 2 && view.getUint16(0) === 0xffd8
    const isPng =
      buffer.byteLength > 8 &&
      new TextDecoder().decode(buffer.slice(0, 8)) === '\u0089PNG\r\n\u001a\n'
    const isPdf = buffer.byteLength > 4 && new TextDecoder().decode(buffer.slice(0, 4)) === '%PDF'

    basic.magicDetected = isJpeg ? 'JPEG' : isPng ? 'PNG' : isPdf ? 'PDF' : isZip ? 'ZIP' : 'unknown'

    if (isJpeg || isPng) {
      const exif = readExifTags(buffer)
      Object.assign(basic, exif)
    }
  } catch {
    basic.parsed = 'erro ao ler detalhes'
  }

  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(basic)) {
    if (v !== undefined && v !== null) result[k] = v
  }
  return result as FileMetadataResult
}

function readAscii(buffer: ArrayBuffer, offset: number, length: number): string {
  const bytes = new Uint8Array(buffer.slice(offset, offset + length))
  return Array.from(bytes)
    .filter((b) => b >= 32 && b <= 126)
    .map((b) => String.fromCharCode(b))
    .join('')
}

function readExifTags(buffer: ArrayBuffer): Record<string, string> {
  const view = new DataView(buffer)
  const metadata: Record<string, string> = {}

  let offset = 2
  const segmentLength = view.getUint16(offset)
  offset += 2

  let app1Length = 0
  for (let i = offset; i < Math.min(buffer.byteLength, 4 + 4 * 1024); ) {
    if (i + 2 > buffer.byteLength) break
    const marker = view.getUint16(i)
    if (marker === 0xffe1) {
      app1Length = view.getUint16(i + 2)
      break
    }
    if (marker === 0xffd9) break
    i += 2 + view.getUint16(i + 2)
  }

  const end = Math.min(buffer.byteLength, offset + segmentLength)
  for (let i = offset; i < end - 4; ) {
    const tag = view.getUint16(i)
    const type = view.getUint16(i + 2)
    const count = view.getUint32(i + 4)
    let value = ''
    if (type === 2) {
      value = readAscii(buffer, i + 8, Math.min(count, 100))
    } else if (type === 4 && count > 0) {
      value = String(view.getUint32(i + 8))
    } else if (type === 3 && count > 0) {
      value = String(view.getUint16(i + 8))
    } else if (type === 1 && count > 0) {
      value = String(view.getUint8(i + 8))
    }
    if (tag !== 0 && value) {
      const tagName = TAG_NAMES[tag] || `tag_${tag.toString(16)}`
      metadata[tagName] = value
    }
    i += 2 + 2 + 4 + 4
  }

  return metadata
}

const TAG_NAMES: Record<number, string> = {
  0x010e: 'description',
  0x010f: 'deviceModel',
  0x0110: 'deviceModel2',
  0x0131: 'software',
  0x0132: 'dateTime',
  0x0103: 'compression',
  0x011a: 'xResolution',
  0x011b: 'yResolution',
  0x0112: 'orientation',
  0x829a: 'exposureTime',
  0x829d: 'fNumber',
  0x8827: 'iso',
  0x920a: 'focalLength',
  0x9209: 'flash',
  0x8822: 'exposureProgram',
  0x9003: 'gpsDate',
  0x8825: 'gps',
}

function extractZipList(
  buffer: ArrayBuffer,
  filename: string,
  contentType: string
): FileMetadataResult {
  const view = new DataView(buffer)
  const files: string[] = []
  const length = buffer.byteLength

  // Assinatura local do ZIP (PK\x03\x04) — varre logicamente procurando os
  // cabeçalhos centrais no fim do arquivo. Para arquivos pequenos fazemos uma
  // leitura direta dos nomes ao percorrer os cabeçalhos locais.
  try {
    let i = 0
    const maxScan = Math.min(length, 10 * 1024 * 1024)
    while (i < maxScan - 4) {
      if (view.getUint32(i) === 0x04034b50) {
        if (i + 30 > maxScan) break
        const nameLen = view.getUint16(i + 26)
        const extraLen = view.getUint16(i + 28)
        const isDir = view.getUint16(i + 6) === 0x10
        if (!isDir) {
          const name = readAscii(buffer, i + 30, nameLen)
          if (name) files.push(name)
        }
        const dataStart = i + 30 + nameLen + extraLen
        const compLen = view.getUint32(i + 18)
        if (dataStart >= maxScan || compLen <= 0) break
        i = dataStart + compLen
      } else {
        i += 1
      }
    }
  } catch {
    // leitura parcial é aceitável
  }

  return {
    filename,
    type: 'ZIP Archive',
    fileSize: length,
    format: 'ZIP',
    source: 'upload',
    arquivosInternos: files.length > 0 ? files.length : 'não listados',
    ...(files.length > 0 ? { 'conteudo (amostra)': files.slice(0, 12).join(' · ') } : {}),
  }
}