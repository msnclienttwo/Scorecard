import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params

    const innings = await prisma.innings.findMany({
      where: { matchId },
      include: {
        battingCard: {
          include: { player: { select: { id: true, name: true } } },
          orderBy: { runs: 'desc' }
        },
        bowlingCard: {
          include: { player: { select: { id: true, name: true } } },
          orderBy: { wickets: 'desc' }
        },
        overs: { orderBy: { overNumber: 'asc' } },
        fallOfWickets: { orderBy: { wicketNumber: 'asc' } },
      },
      orderBy: { inningsNumber: 'asc' }
    })

    return NextResponse.json({ innings })
  } catch (error) {
    console.error('Error fetching innings:', error)
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
    const { battingTeam, bowlingTeam } = body

    if (!battingTeam || !bowlingTeam) {
      return NextResponse.json(
        { error: 'battingTeam and bowlingTeam are required' },
        { status: 400 }
      )
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const inningsCount = await prisma.innings.count({
      where: { matchId }
    })

    const innings = await prisma.innings.create({
      data: {
        matchId,
        inningsNumber: inningsCount + 1,
        battingTeam,
        bowlingTeam,
        totalRuns: 0,
        totalWickets: 0,
        totalOvers: 0,
        extras: 0,
      },
    })

    if (match.status === 'SCHEDULED') {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: 'LIVE', startedAt: new Date() }
      })
    }

    return NextResponse.json({ innings }, { status: 201 })
  } catch (error) {
    console.error('Error creating innings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
