import { NextRequest, NextResponse } from 'next/server';
import { runUsernameEnum } from '@/lib/username-enum';
import { runMaigret } from '@/lib/maigret';

interface SearchResult {
  platform: string;
  username: string;
  url: string;
  exists: boolean;
  status: string;
  source: string;
}

interface UniversalSearchResponse {
  success: boolean;
  data?: {
    query: string;
    type: string;
    results: SearchResult[];
    totalFound: number;
    sources: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<UniversalSearchResponse>> {
  try {
    const body = await request.json();
    const { query, type } = body as { query?: string; type?: string };

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query é obrigatória' },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Query deve ter pelo menos 2 caracteres' },
        { status: 400 }
      );
    }

    const results: SearchResult[] = [];
    const sources: string[] = [];

    // Buscar por username se o tipo for 'username' ou 'name'
    if (type === 'username' || type === 'name') {
      try {
        const enumResults = await runUsernameEnum(cleanQuery);
        if (enumResults) {
          for (const result of enumResults) {
            results.push({
              platform: result.platform || 'Unknown',
              username: cleanQuery,
              url: result.url || '',
              exists: result.exists || false,
              status: result.status || 'unknown',
              source: 'username-enum',
            });
          }
          sources.push('username-enum');
        }
      } catch (error) {
        console.error('[Universal Search] Username enum error:', error);
      }
    }

    // Buscar com Maigret se disponível
    try {
      const maigretAvailable = await import('@/lib/maigret').then(m => m.checkMaigretAvailable());
      if (maigretAvailable) {
        const maigretResults = await runMaigret(cleanQuery, ['todos']);
        if (maigretResults) {
          for (const result of maigretResults) {
            results.push({
              platform: result.site || 'Unknown',
              username: cleanQuery,
              url: result.url || '',
              exists: result.status === 'found',
              status: result.status || 'unknown',
              source: 'maigret',
            });
          }
          sources.push('maigret');
        }
      }
    } catch (error) {
      console.error('[Universal Search] Maigret error:', error);
    }

    // Se não encontrou nada, retornar vazio
    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          query: cleanQuery,
          type: type || 'username',
          results: [],
          totalFound: 0,
          sources: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        query: cleanQuery,
        type: type || 'username',
        results,
        totalFound: results.filter(r => r.exists).length,
        sources,
      },
    });
  } catch (error) {
    console.error('[Universal Search] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
