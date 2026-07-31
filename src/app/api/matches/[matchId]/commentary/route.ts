import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [commentary, total] = await Promise.all([
      prisma.commentary.findMany({
        where: { matchId },
        include: {
          user: { select: { id: true, name: true, image: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.commentary.count({ where: { matchId } })
    ])

    return NextResponse.json({
      commentary,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
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
    const { content, overNumber, ballNumber, inningsNumber, isAutomatic, isHighlight, eventType, emoji } = body

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

    const commentary = await prisma.commentary.create({
      data: {
        matchId,
        userId: user.sub,
        content,
        overNumber: overNumber || null,
        ballNumber: ballNumber || null,
        inningsNumber: inningsNumber || null,
        isAutomatic: isAutomatic || false,
        isHighlight: isHighlight || false,
        eventType: eventType || null,
        emoji: emoji || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    })

    return NextResponse.json({ commentary }, { status: 201 })
  } catch (error) {
    console.error('Error creating commentary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
