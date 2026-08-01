import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getScoringAccess } from '@/lib/scoring'
import { notifyMatchStarted, notifyMatchCompleted } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { id: true, name: true, shortName: true, logo: true } },
        awayTeam: { select: { id: true, name: true, shortName: true, logo: true } },
        tournament: { select: { id: true, name: true } },
        matchScorers: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        squads: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                shortName: true,
                role: true,
                battingStyle: true,
              },
            },
            team: { select: { id: true, name: true, shortName: true } },
          }
        },
        innings: {
          include: {
            battingCard: {
              include: {
                player: {
                  select: { id: true, name: true, battingStyle: true },
                },
              },
              orderBy: { batPosition: 'asc' }
            },
            bowlingCard: {
              include: {
                player: {
                  select: { id: true, name: true, battingStyle: true },
                },
              },
              orderBy: { overs: 'desc' }
            },
            fallOfWickets: { orderBy: { wicketNumber: 'asc' } },
            overs: {
              orderBy: { overNumber: 'asc' },
              include: {
                balls: {
                  orderBy: { ballNumber: 'asc' },
                  include: {
                    over: true,
                  }
                }
              }
            },
          },
          orderBy: { inningsNumber: 'asc' }
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 50
        },
        commentary: {
          orderBy: { createdAt: 'asc' }
        },
        creator: { select: { id: true, name: true } }
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const user = await getCurrentUser()
    const scoringAccess = getScoringAccess(match, user)

    return NextResponse.json({ match: { ...match, scoringAccess } })
  } catch (error) {
    console.error('Error fetching match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: { matchScorers: true },
    })

    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: body.status,
        venue: body.venue,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        totalOvers: body.totalOvers,
        tossWinner: body.tossWinner,
        tossDecision: body.tossDecision,
        result: body.result,
        winningTeamId: body.winningTeamId,
        startedAt: body.status === 'LIVE' ? new Date() : undefined,
        completedAt: body.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } }
      }
    })

    const notificationContext = {
      matchId: existingMatch.id,
      matchName: existingMatch.name,
      creatorId: existingMatch.createdBy,
      scorerIds: existingMatch.matchScorers.map((s) => s.userId),
    }

    if (body.status === 'LIVE' && existingMatch.status !== 'LIVE') {
      try {
        await notifyMatchStarted(notificationContext)
      } catch (error) {
        console.error('Error creating match-started notification:', error)
      }
    }

    if (body.status === 'COMPLETED' && existingMatch.status !== 'COMPLETED') {
      try {
        await notifyMatchCompleted(notificationContext, body.result ?? null)
      } catch (error) {
        console.error('Error creating match-completed notification:', error)
      }
    }

    return NextResponse.json({ match })
  } catch (error) {
    console.error('Error updating match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    await prisma.match.delete({
      where: { id: matchId }
    })

    return NextResponse.json({ message: 'Match deleted successfully' })
  } catch (error) {
    console.error('Error deleting match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
