import { NextRequest, NextResponse } from 'next/server'
import { getSnapshotById, compareSnapshots, generateDiffSummary } from '@/lib/instagram/snapshot'

/**
 * POST /api/instagram/compare
 * Compare two snapshots
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { previousId, currentId } = body as { previousId?: string; currentId?: string }

    if (!previousId || !currentId) {
      return NextResponse.json(
        { success: false, error: 'previousId e currentId são obrigatórios' },
        { status: 400 }
      )
    }

    const previous = getSnapshotById(previousId)
    if (!previous) {
      return NextResponse.json(
        { success: false, error: 'Snapshot anterior não encontrado' },
        { status: 404 }
      )
    }

    const current = getSnapshotById(currentId)
    if (!current) {
      return NextResponse.json(
        { success: false, error: 'Snapshot atual não encontrado' },
        { status: 404 }
      )
    }

    const diff = compareSnapshots(previous, current)
    const summary = generateDiffSummary(diff)

    return NextResponse.json({
      success: true,
      data: {
        diff,
        summary,
      },
    })
  } catch (err) {
    console.error('[api/instagram/compare] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao comparar snapshots',
      },
      { status: 500 }
    )
  }
}
