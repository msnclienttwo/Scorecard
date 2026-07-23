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
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const [events, total] = await Promise.all([
      prisma.matchEvent.findMany({
        where: { matchId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.matchEvent.count({ where: { matchId } })
    ])

    return NextResponse.json({
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
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
    const { type, description, overNumber, ballNumber, inningsNumber, data } = body

    if (!type || !description) {
      return NextResponse.json(
        { error: 'type and description are required' },
        { status: 400 }
      )
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        type,
        description,
        overNumber: overNumber || null,
        ballNumber: ballNumber || null,
        inningsNumber: inningsNumber || null,
        data: data || {},
      }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
