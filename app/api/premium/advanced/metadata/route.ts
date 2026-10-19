import { NextRequest, NextResponse } from 'next/server'
import { requirePremium } from '@/lib/auth'
import { extractMetadata } from '@/lib/advanced/metadata-extractor'
import { extractFileMetadata } from '@/lib/advanced/metadata-file'

export async function POST(request: NextRequest) {
  try {
    const { error } = await requirePremium(request)
    if (error) return error

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'Envie um arquivo' }, { status: 400 })
      }
      const arrayBuffer = await (file as File).arrayBuffer()
      const result = await extractFileMetadata(
        new Uint8Array(arrayBuffer),
        (file as File).name,
        (file as File).type
      )
      return NextResponse.json({ success: true, data: result })
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are supported' }, { status: 400 })
    }

    const result = await extractMetadata(url)

    return NextResponse.json({
      success: true,
      result
    })
  } catch (error) {
    console.error('Metadata extraction error:', error)
    return NextResponse.json(
      { error: 'Metadata extraction failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  )
}