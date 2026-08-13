import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { emitCommentaryAdded } from '@/lib/realtime'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || '50'), 1),
      100
    )
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { matchId }

    const inningsNumber = searchParams.get('inningsNumber')
    if (inningsNumber !== null && inningsNumber !== '') {
      where.inningsNumber = parseInt(inningsNumber)
    }

    const over = searchParams.get('over')
    if (over !== null && over !== '') {
      where.overNumber = parseInt(over)
    }

    const eventType = searchParams.get('eventType')
    if (eventType) where.eventType = eventType

    const isAIGenerated = searchParams.get('isAIGenerated')
    if (isAIGenerated === 'true') where.isAIGenerated = true
    if (isAIGenerated === 'false') where.isAIGenerated = false

    const pinned = searchParams.get('pinned')
    if (pinned === 'true') where.pinned = true
    if (pinned === 'false') where.pinned = false

    const player = searchParams.get('player')
    const bowler = searchParams.get('bowler')
    if (player || bowler) {
      where.ball = {
        ...(player ? { batsmanId: player } : {}),
        ...(bowler ? { bowlerId: bowler } : {}),
      }
    }

    const keyword = searchParams.get('keyword')
    if (keyword) {
      where.content = { contains: keyword }
    }

    const [commentary, total] = await Promise.all([
      prisma.commentary.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          ball: {
            select: {
              id: true,
              ballNumber: true,
              over: { select: { id: true, overNumber: true } },
            },
          },
        },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.commentary.count({ where }),
    ])

    return NextResponse.json({
      commentary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching commentary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()
    const {
      content,
      ballId,
      overNumber,
      ballNumber,
      inningsNumber,
      isAutomatic,
      isHighlight,
      eventType,
      emoji,
      isAIGenerated,
      generatedBy,
      provider,
      style,
      language,
      edited,
      pinned,
      aiGeneratedAt,
    } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Commentary content is required' },
        { status: 400 }
      )
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (ballId) {
      const ball = await prisma.ball.findUnique({ where: { id: ballId } })
      const innings = ball
        ? await prisma.innings.findUnique({ where: { id: ball.inningsId } })
        : null
      if (!ball || !innings || innings.matchId !== matchId) {
        return NextResponse.json(
          { error: 'Invalid ball for this match' },
          { status: 400 }
        )
      }
    }

    const commentary = await prisma.commentary.create({
      data: {
        matchId,
        userId: user.sub,
        content,
        ballId: ballId || null,
        overNumber: overNumber || null,
        ballNumber: ballNumber || null,
        inningsNumber: inningsNumber || null,
        isAutomatic: isAutomatic || false,
        isHighlight: isHighlight || false,
        eventType: eventType || null,
        emoji: emoji || null,
        isAIGenerated: isAIGenerated || false,
        generatedBy: generatedBy || null,
        provider: provider || null,
        style: style || null,
        language: language || null,
        edited: edited || false,
        pinned: pinned || false,
        aiGeneratedAt: aiGeneratedAt ? new Date(aiGeneratedAt) : null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        ball: {
          select: {
            id: true,
            ballNumber: true,
            over: { select: { id: true, overNumber: true } },
          },
        },
      },
    })

    emitCommentaryAdded(matchId, commentary)

    return NextResponse.json({ commentary }, { status: 201 })
  } catch (error) {
    console.error('Error creating commentary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
