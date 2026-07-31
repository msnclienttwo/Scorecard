import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        team: { select: { id: true, name: true, logo: true } },
        battingStats: {
          include: {
            innings: {
              include: { match: { select: { id: true, scheduledAt: true, venue: true, status: true } } }
            }
          },
          orderBy: { id: 'desc' }
        },
        bowlingStats: {
          include: {
            innings: {
              include: { match: { select: { id: true, scheduledAt: true, venue: true, status: true } } }
            }
          },
          orderBy: { id: 'desc' }
        }
      }
    })

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    const totalRuns = player.battingStats.reduce((sum, card) => sum + card.runs, 0)
    const totalBalls = player.battingStats.reduce((sum, card) => sum + card.balls, 0)
    const totalWickets = player.bowlingStats.reduce((sum, card) => sum + card.wickets, 0)
    const totalOversBowled = player.bowlingStats.reduce((sum, card) => sum + card.overs, 0)

    const stats = {
      batting: {
        totalRuns,
        totalBalls,
        average: totalRuns / Math.max(player.battingStats.filter(c => !c.isNotOut).length, 1),
        strikeRate: totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0,
        fifties: player.battingStats.filter(c => c.runs >= 50 && c.runs < 100).length,
        hundreds: player.battingStats.filter(c => c.runs >= 100).length,
        highestScore: Math.max(...player.battingStats.map(c => c.runs), 0)
      },
      bowling: {
        totalWickets,
        totalOversBowled,
        economy: totalOversBowled > 0 ? player.bowlingStats.reduce((sum, c) => sum + c.runs, 0) / totalOversBowled : 0,
        average: totalWickets > 0 ? player.bowlingStats.reduce((sum, c) => sum + c.runs, 0) / totalWickets : 0,
        bestBowling: player.bowlingStats.reduce(
          (best, c) => (c.wickets > (best.wickets || 0) ? { wickets: c.wickets, runs: c.runs } : best),
          { wickets: 0, runs: 0 }
        )
      },
      matchesPlayed: new Set([
        ...player.battingStats.map(c => c.innings.matchId),
        ...player.bowlingStats.map(c => c.innings.matchId)
      ]).size
    }

    return NextResponse.json({ player, stats })
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playerId } = await params
    const body = await request.json()

    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        name: body.name,
        shortName: body.shortName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        nationality: body.nationality,
        role: body.role,
        battingStyle: body.battingStyle,
        bowlingStyle: body.bowlingStyle,
        teamId: body.teamId,
        image: body.image,
        isCaptain: body.isCaptain,
        bio: body.bio
      },
      include: {
        team: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ player: updated })
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { playerId } = await params

    const player = await prisma.player.findUnique({ where: { id: playerId } })
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const hasRecords = await prisma.battingScorecard.count({ where: { playerId } })
    if (hasRecords > 0) {
      return NextResponse.json(
        { error: 'Cannot delete player with existing match records' },
        { status: 400 }
      )
    }

    await prisma.player.delete({ where: { id: playerId } })

    return NextResponse.json({ message: 'Player deleted successfully' })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
