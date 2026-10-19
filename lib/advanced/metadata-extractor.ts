export interface MetadataResult {
  url: string
  type: string
  metadata: Record<string, unknown>
  hasExif: boolean
  gps?: { lat: number; lon: number }
}

const TIMEOUT_MS = 20000
const MAX_FILE_SIZE = 50 * 1024 * 1024

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function detectFileType(contentType: string, url: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'image/tiff': 'TIFF Image',
    'image/bmp': 'BMP Image',
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document (DOCX)',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet (XLSX)',
    'application/zip': 'ZIP Archive',
    'application/x-rar': 'RAR Archive',
    'video/mp4': 'MP4 Video',
    'video/quicktime': 'MOV Video',
    'audio/mpeg': 'MP3 Audio',
    'audio/wav': 'WAV Audio'
  }

  if (typeMap[contentType]) {
    return typeMap[contentType]
  }

  const ext = url.split('.').pop()?.toLowerCase() || ''
  const extMap: Record<string, string> = {
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'gif': 'GIF Image',
    'pdf': 'PDF Document',
    'doc': 'Word Document',
    'docx': 'Word Document (DOCX)',
    'xls': 'Excel Spreadsheet',
    'xlsx': 'Excel Spreadsheet (XLSX)',
    'zip': 'ZIP Archive',
    'mp4': 'MP4 Video',
    'mp3': 'MP3 Audio'
  }

  return extMap[ext] || 'Unknown File Type'
}

function parseExifFromBuffer(buffer: ArrayBuffer): Record<string, unknown> {
  const view = new DataView(buffer)
  const metadata: Record<string, unknown> = {}

  if (buffer.byteLength < 14) {
    return metadata
  }

  const firstBytes = new Uint8Array(buffer.slice(0, 4))
  const isJpeg = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8
  const isPng = firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47

  if (isJpeg) {
    metadata.format = 'JPEG'
    let offset = 2

    while (offset < buffer.byteLength - 1) {
      if (view.getUint8(offset) !== 0xFF) break

      const marker = view.getUint8(offset + 1)

      if (marker === 0xE1) {
        metadata.hasExif = true

        const exifStart = offset + 4
        if (exifStart < buffer.byteLength - 10) {
          const exifHeader = new Uint8Array(buffer.slice(exifStart, exifStart + 6))
          const isBigEndian = exifHeader[0] === 0x4D

          metadata.byteOrder = isBigEndian ? 'Big Endian (Motorola)' : 'Little Endian (Intel)'

          if (exifStart + 8 < buffer.byteLength) {
            const ifdOffset = isBigEndian
              ? view.getUint32(exifStart + 4)
              : view.getUint32(exifStart + 4, true)

            if (ifdOffset > 0 && ifdOffset < buffer.byteLength - 2) {
              const numEntries = isBigEndian
                ? view.getUint16(ifdOffset)
                : view.getUint16(ifdOffset, true)

              for (let i = 0; i < Math.min(numEntries, 20); i++) {
                const entryOffset = ifdOffset + 2 + (i * 12)
                if (entryOffset + 12 > buffer.byteLength) break

                const tag = isBigEndian
                  ? view.getUint16(entryOffset)
                  : view.getUint16(entryOffset, true)

                const exifTags: Record<number, string> = {
                  0x010F: 'Make',
                  0x0110: 'Model',
                  0x0112: 'Orientation',
                  0x011A: 'XResolution',
                  0x011B: 'YResolution',
                  0x0131: 'Software',
                  0x0132: 'DateTime',
                  0x013B: 'Artist',
                  0x8298: 'Copyright'
                }

                if (exifTags[tag]) {
                  const asciiStr = readAscii(buffer, entryOffset + 8, 4)
                  if (asciiStr.trim().length > 0) {
                    metadata[exifTags[tag]] = asciiStr.trim()
                  }
                }
              }
            }
          }
        }
        break
      } else if (marker === 0xD9 || marker === 0xDA) {
        break
      }

      const segmentLength = view.getUint16(offset + 2)
      offset += 2 + segmentLength
    }
  } else if (isPng) {
    metadata.format = 'PNG'

    let offset = 8
    while (offset < buffer.byteLength - 12) {
      const chunkLength = view.getUint32(offset)
      const chunkType = readAscii(buffer, offset + 4, 4)

      if (chunkType === 'tEXt' || chunkType === 'iTXt' || chunkType === 'zTXt') {
        const textData = readAscii(buffer, offset + 8, Math.min(chunkLength, 200))
        const nullIndex = textData.indexOf('\0')
        if (nullIndex > 0) {
          const key = textData.substring(0, nullIndex)
          const value = textData.substring(nullIndex + 1)
          metadata[key] = value
        }
      }

      offset += 12 + chunkLength
    }
  }

  return metadata
}

function readAscii(buffer: ArrayBuffer, offset: number, length: number): string {
  const bytes = new Uint8Array(buffer.slice(offset, offset + length))
  return Array.from(bytes)
    .filter(b => b >= 32 && b <= 126)
    .map(b => String.fromCharCode(b))
    .join('')
}

function extractGpsFromMetadata(metadata: Record<string, unknown>): { lat: number; lon: number } | undefined {
  if (metadata.gpsLatitude && metadata.gpsLongitude) {
    return {
      lat: Number(metadata.gpsLatitude),
      lon: Number(metadata.gpsLongitude)
    }
  }

  if (metadata.GPSLatitude && metadata.GPSLongitude) {
    const parseDms = (dms: string): number => {
      const parts = dms.split(/[/°'"]/).filter(p => p.trim().length > 0)
      if (parts.length >= 3) {
        const degrees = parseFloat(parts[0])
        const minutes = parseFloat(parts[1])
        const seconds = parseFloat(parts[2])
        return degrees + minutes / 60 + seconds / 3600
      }
      return parseFloat(dms) || 0
    }

    return {
      lat: parseDms(String(metadata.GPSLatitude)),
      lon: parseDms(String(metadata.GPSLongitude))
    }
  }

  return undefined
}

export async function extractMetadata(url: string): Promise<MetadataResult> {
  if (!url || url.trim().length === 0) {
    throw new Error('URL is required')
  }

  let response: Response
  try {
    response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (MetadataExtractor/1.0)',
        'Accept': '*/*'
      }
    })
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const contentLength = response.headers.get('content-length')

  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    throw new Error('File too large (max 50MB)')
  }

  const fileType = detectFileType(contentType, url)

  let buffer: ArrayBuffer
  try {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const chunks: Uint8Array[] = []
    let totalLength = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      totalLength += value.length
      if (totalLength > MAX_FILE_SIZE) {
        reader.cancel()
        throw new Error('File too large (max 50MB)')
      }
    }

    buffer = new ArrayBuffer(totalLength)
    const uint8 = new Uint8Array(buffer)
    let offset = 0
    for (const chunk of chunks) {
      uint8.set(chunk, offset)
      offset += chunk.length
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('too large')) {
      throw error
    }
    throw new Error('Failed to read response body')
  }

  const basicMetadata: Record<string, unknown> = {
    contentType,
    fileSize: buffer.byteLength,
    url
  }

  let exifMetadata: Record<string, unknown> = {}
  try {
    exifMetadata = parseExifFromBuffer(buffer)
  } catch {
    exifMetadata = {}
  }

  const allMetadata = { ...basicMetadata, ...exifMetadata }
  const hasExif = exifMetadata.hasExif === true || Object.keys(exifMetadata).length > 2
  const gps = extractGpsFromMetadata(allMetadata)

  return {
    url,
    type: fileType,
    metadata: allMetadata,
    hasExif,
    gps
  }
}
