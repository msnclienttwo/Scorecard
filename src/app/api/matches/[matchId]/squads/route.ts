import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { emitToMatch } from '@/lib/scoring'

interface SquadEntry {
  playerId: string
  teamId: string
  isCaptain?: boolean
  battingOrder?: number
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
    const players: SquadEntry[] = Array.isArray(body.players) ? body.players : []

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        createdBy: true,
        status: true,
        homeTeamId: true,
        awayTeamId: true,
      },
    })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    if (match.status !== 'SCHEDULED' && match.status !== 'READY') {
      return NextResponse.json(
        { error: 'Squads can only be set before play begins.' },
        { status: 400 }
      )
    }

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'TOURNAMENT_ADMIN'
    if (!isAdmin && match.createdBy !== user.sub) {
      return NextResponse.json(
        { error: 'Only the match creator or an admin can manage squads.' },
        { status: 403 }
      )
    }

    const validTeamIds = new Set([match.homeTeamId, match.awayTeamId])
    for (const entry of players) {
      if (!validTeamIds.has(entry.teamId)) {
        return NextResponse.json(
          {
            error: `Player "${entry.playerId}" is assigned to a team not in this match.`,
          },
          { status: 400 }
        )
      }
    }

    const playerIds = [...new Set(players.map((p) => p.playerId))]
    const validPlayers = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, teamId: true },
    })
    const playerTeam = new Map(validPlayers.map((p) => [p.id, p.teamId]))
    for (const entry of players) {
      if (playerTeam.get(entry.playerId) !== entry.teamId) {
        return NextResponse.json(
          { error: `Player "${entry.playerId}" does not belong to the selected team.` },
          { status: 400 }
        )
      }
    }

    await prisma.$transaction([
      prisma.matchPlayer.deleteMany({ where: { matchId } }),
      prisma.matchPlayer.createMany({
        data: players.map((entry) => ({
          matchId,
          playerId: entry.playerId,
          teamId: entry.teamId,
          isCaptain: entry.isCaptain ?? false,
          battingOrder: entry.battingOrder ?? null,
        })),
      }),
    ])

    const squads = await prisma.matchPlayer.findMany({
      where: { matchId },
      include: { player: { select: { id: true, name: true, shortName: true } } },
    })

    emitToMatch(matchId, 'match:updated', { squads: true })
    return NextResponse.json({ squads })
  } catch (error) {
    console.error('Error updating squads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
