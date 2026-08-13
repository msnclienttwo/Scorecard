import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  enhanceTranscript,
  generateCommentaryForBall,
  getCommentarySettings,
  improveCommentary,
  regenerateCommentary,
  saveAICommentary,
  translateCommentary,
  type GenerationOptions,
} from '@/lib/aiCommentary'
import { isAnyAIProviderConfigured } from '@/services/ai.provider'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      action,
      commentaryId,
      ballId,
      transcript,
      language,
      text,
    } = body as {
      action: string
      commentaryId?: string
      ballId?: string
      transcript?: string
      language?: string
      text?: string
    }

    const settings = await getCommentarySettings(matchId, user.sub)
    const opts: GenerationOptions = {
      provider: body.provider ?? settings.provider,
      style: body.style ?? settings.style,
      language: body.language ?? settings.language,
      temperature: body.temperature ?? settings.temperature,
      creativity: body.creativity ?? settings.creativity,
    }

    switch (action) {
      case 'generate': {
        if (!ballId) {
          return NextResponse.json(
            { error: 'ballId is required for generate' },
            { status: 400 }
          )
        }
        if (!isAnyAIProviderConfigured()) {
          return NextResponse.json(
            {
              error:
                'No AI provider is configured. Set OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY or OLLAMA_BASE_URL in the server environment.',
            },
            { status: 400 }
          )
        }
        const ball = await prisma.ball.findUnique({ where: { id: ballId } })
        if (!ball) {
          return NextResponse.json({ error: 'Ball not found' }, { status: 404 })
        }
        const result = await generateCommentaryForBall(matchId, ballId, opts)
        const commentary = await saveAICommentary(matchId, ballId, result.content, {
          provider: opts.provider,
          style: opts.style,
          language: opts.language,
        })
        return NextResponse.json({ commentary })
      }

      case 'enhance': {
        if (!transcript) {
          return NextResponse.json(
            { error: 'transcript is required for enhance' },
            { status: 400 }
          )
        }
        const result = await enhanceTranscript(matchId, transcript, opts)
        return NextResponse.json(result)
      }

      case 'translate': {
        const source = text ?? transcript
        const target = language ?? opts.language ?? 'en'
        if (!source) {
          return NextResponse.json(
            { error: 'text or transcript is required for translate' },
            { status: 400 }
          )
        }
        const result = await translateCommentary(matchId, source, target, opts)
        return NextResponse.json(result)
      }

      case 'improve': {
        const source = text ?? transcript
        if (!source) {
          return NextResponse.json(
            { error: 'text or transcript is required for improve' },
            { status: 400 }
          )
        }
        const result = await improveCommentary(matchId, source, opts)
        return NextResponse.json(result)
      }

      case 'regenerate': {
        if (!commentaryId) {
          return NextResponse.json(
            { error: 'commentaryId is required for regenerate' },
            { status: 400 }
          )
        }
        const commentary = await regenerateCommentary(matchId, commentaryId, opts)
        return NextResponse.json({ commentary })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in AI commentary action:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Internal server error'
    if (!isAnyAIProviderConfigured()) {
      return NextResponse.json(
        {
          error:
            'No AI provider is configured. Set OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY or OLLAMA_BASE_URL in the server environment.',
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
