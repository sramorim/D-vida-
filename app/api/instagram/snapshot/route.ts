import { NextRequest, NextResponse } from 'next/server'
import { fetchCompleteProfile, fetchPostComments } from '@/lib/instagram/auth-fetch'
import { createSnapshot, getSnapshotsForTarget, getAllSnapshots, getSnapshotById, deleteSnapshot, compareSnapshots, generateDiffSummary } from '@/lib/instagram/snapshot'

/**
 * POST /api/instagram/snapshot
 * Create a new snapshot of a profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, cookie } = body as { username?: string; cookie?: string }

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username é obrigatório' },
        { status: 400 }
      )
    }

    if (!cookie || typeof cookie !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Session cookie é obrigatório' },
        { status: 400 }
      )
    }

    const cleanUsername = username.replace('@', '').trim()
    if (cleanUsername.length < 1 || cleanUsername.length > 30) {
      return NextResponse.json(
        { success: false, error: 'Username inválido' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Fetch complete profile data
    const profileData = await fetchCompleteProfile(cleanUsername, { cookie }, (stage, count) => {
      // Progress tracking could be sent via SSE in the future
    })

    if (!profileData || !profileData.profile) {
      return NextResponse.json(
        { success: false, error: 'Perfil não encontrado ou inacessível' },
        { status: 404 }
      )
    }

    if (profileData.profile.is_private) {
      return NextResponse.json(
        { success: false, error: 'Este perfil é privado. Apenas perfis públicos podem ser analisados.' },
        { status: 400 }
      )
    }

    // Fetch comments for recent posts
    const comments = new Map<string, any[]>()
    const postsToFetchComments = profileData.posts.slice(0, 10) // Latest 10 posts
    
    for (const post of postsToFetchComments) {
      try {
        const postComments = await fetchPostComments(post.shortcode, { cookie })
        comments.set(post.shortcode, postComments)
      } catch {
        // Continue if comments fetch fails
      }
    }

    const duration = Date.now() - startTime

    // Create snapshot
    const snapshot = createSnapshot(
      cleanUsername,
      profileData.profile,
      profileData.followers,
      profileData.following,
      profileData.posts,
      comments,
      duration
    )

    return NextResponse.json({
      success: true,
      data: {
        snapshotId: snapshot.id,
        duration,
        stats: {
          followers: snapshot.stats.followers,
          following: snapshot.stats.following,
          posts: snapshot.stats.posts,
        },
      },
    })
  } catch (err) {
    console.error('[api/instagram/snapshot] Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao criar snapshot',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/instagram/snapshot?username=xxx or ?id=xxx
 * Get snapshots
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    const id = url.searchParams.get('id')

    // Get specific snapshot by ID
    if (id) {
      const snapshot = getSnapshotById(id)
      if (!snapshot) {
        return NextResponse.json(
          { success: false, error: 'Snapshot não encontrado' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: snapshot,
      })
    }

    // Get all snapshots for a target
    if (username) {
      const snapshots = getSnapshotsForTarget(username.replace('@', ''))
      return NextResponse.json({
        success: true,
        data: {
          count: snapshots.length,
          snapshots: snapshots.map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            duration: s.duration,
            stats: s.stats,
          })),
        },
      })
    }

    // Get all snapshots
    const allSnapshots = getAllSnapshots()
    return NextResponse.json({
      success: true,
      data: {
        count: allSnapshots.length,
        snapshots: allSnapshots.map(s => ({
          id: s.id,
          targetUsername: s.targetUsername,
          timestamp: s.timestamp,
          duration: s.duration,
          stats: s.stats,
        })),
      },
    })
  } catch (err) {
    console.error('[api/instagram/snapshot] GET Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao buscar snapshots',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/instagram/snapshot?id=xxx
 * Delete a snapshot
 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    const deleted = deleteSnapshot(id)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Snapshot não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Snapshot deletado',
    })
  } catch (err) {
    console.error('[api/instagram/snapshot] DELETE Error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Erro ao deletar snapshot',
      },
      { status: 500 }
    )
  }
}
