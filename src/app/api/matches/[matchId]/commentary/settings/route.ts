import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  getCommentarySettings,
  saveCommentarySettings,
} from '@/lib/aiCommentary'
import {
  AI_PROVIDERS,
  getConfiguredProviders,
} from '@/services/ai.provider'

export async function GET(
  _request: NextRequest,
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

    const settings = await getCommentarySettings(matchId, user.sub)

    return NextResponse.json({
      settings,
      availableProviders: AI_PROVIDERS.map((p) => ({
        id: p.id,
        name: p.name,
        isConfigured: p.isConfigured(),
      })),
      configuredProviders: getConfiguredProviders().map((p) => p.id),
    })
  } catch (error) {
    console.error('Error fetching commentary settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const patch: Record<string, unknown> = {}

    if (typeof body.aiEnabled === 'boolean') patch.aiEnabled = body.aiEnabled
    if (typeof body.voiceEnabled === 'boolean')
      patch.voiceEnabled = body.voiceEnabled
    if (typeof body.autoCommentary === 'boolean')
      patch.autoCommentary = body.autoCommentary
    if (typeof body.style === 'string') patch.style = body.style
    if (typeof body.language === 'string') patch.language = body.language
    if (typeof body.provider === 'string') patch.provider = body.provider
    if (typeof body.temperature === 'number')
      patch.temperature = Math.min(Math.max(body.temperature, 0), 2)
    if (typeof body.creativity === 'number')
      patch.creativity = Math.min(Math.max(body.creativity, 0), 1)

    const settings = await saveCommentarySettings(matchId, user.sub, patch)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating commentary settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
