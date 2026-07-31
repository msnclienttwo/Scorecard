import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyMatchCreated } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const tournamentId = searchParams.get('tournamentId')
    const teamId = searchParams.get('teamId')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (tournamentId) where.tournamentId = tournamentId
    if (teamId) {
      where.OR = [
        { homeTeamId: teamId },
        { awayTeamId: teamId }
      ]
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, name: true, logo: true } },
          awayTeam: { select: { id: true, name: true, logo: true } },
          tournament: { select: { id: true, name: true } }
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.match.count({ where })
    ])

    return NextResponse.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      homeTeamId,
      awayTeamId,
      name,
      description,
      format,
      tournamentId,
      venue,
      scheduledAt,
      totalOvers,
      tossWinner,
      tossDecision,
      umpires,
      scorerIds,
      playerIds,
      captainA,
      captainB,
    } = body

    if (!homeTeamId || !awayTeamId) {
      return NextResponse.json(
        { error: 'Both teams are required' },
        { status: 400 }
      )
    }

    if (homeTeamId === awayTeamId) {
      return NextResponse.json(
        { error: 'Teams must be different' },
        { status: 400 }
      )
    }

    const [teamA, teamB] = await Promise.all([
      prisma.team.findUnique({ where: { id: homeTeamId } }),
      prisma.team.findUnique({ where: { id: awayTeamId } })
    ])

    if (!teamA || !teamB) {
      return NextResponse.json(
        { error: 'One or both teams not found' },
        { status: 404 }
      )
    }

    const validFormats = ['T20', 'ODI', 'TEST', 'T10', 'CUSTOM']
    const matchFormat = (format || 'T20').toUpperCase()
    if (!validFormats.includes(matchFormat)) {
      return NextResponse.json(
        { error: `Invalid format "${format}". Must be one of: ${validFormats.join(', ')}` },
        { status: 400 }
      )
    }

    const validTossDecisions = ['BAT', 'BOWL']
    const resolvedTossDecision = tossDecision
      ? tossDecision.toUpperCase()
      : null
    if (resolvedTossDecision && !validTossDecisions.includes(resolvedTossDecision)) {
      return NextResponse.json(
        { error: `Invalid toss decision "${tossDecision}". Must be "bat" or "bowl"` },
        { status: 400 }
      )
    }

    const resolvedTossWinner = tossWinner || null

    const umpireArray: string[] = Array.isArray(umpires)
      ? umpires.filter((u: string) => u && u.trim())
      : []

    const match = await prisma.match.create({
      data: {
        name: name || `${teamA.name} vs ${teamB.name}`,
        description: description || null,
        format: matchFormat as 'T20' | 'ODI' | 'TEST' | 'T10' | 'CUSTOM',
        totalOvers: totalOvers || 20,
        status: 'SCHEDULED',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        venue: venue || null,
        tossWinner: resolvedTossWinner,
        tossDecision: resolvedTossDecision as 'BAT' | 'BOWL' | null,
        homeTeamId,
        awayTeamId,
        tournamentId: tournamentId || null,
        umpire1: umpireArray[0] || null,
        umpire2: umpireArray[1] || null,
        thirdUmpire: umpireArray[2] || null,
        reserveUmpire: umpireArray[3] || null,
        createdBy: user.sub
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } }
      }
    })

    const scorerIdsArray: string[] = Array.isArray(scorerIds)
      ? [
          ...new Set(
            (scorerIds as unknown[]).filter(
              (id): id is string => typeof id === 'string' && id.length > 0
            )
          ),
        ]
      : []
    if (scorerIdsArray.length > 0) {
      const validScorers = await prisma.user.findMany({
        where: { id: { in: scorerIdsArray } },
        select: { id: true }
      })
      const validScorerIds = validScorers.map((u) => u.id)
      await prisma.matchScorer.createMany({
        data: validScorerIds.map((userId) => ({ matchId: match.id, userId }))
      })
    }

    const squadPlayers: { playerId: string; teamId: string; isCaptain: boolean }[] = []
    if (playerIds && typeof playerIds === 'object') {
      const teamAIds = Array.isArray(playerIds.teamA) ? playerIds.teamA : []
      const teamBIds = Array.isArray(playerIds.teamB) ? playerIds.teamB : []
      for (const playerId of teamAIds) {
        squadPlayers.push({ playerId, teamId: homeTeamId, isCaptain: playerId === captainA })
      }
      for (const playerId of teamBIds) {
        squadPlayers.push({ playerId, teamId: awayTeamId, isCaptain: playerId === captainB })
      }
    }
    if (squadPlayers.length > 0) {
      await prisma.matchPlayer.createMany({
        data: squadPlayers.map((entry) => ({
          matchId: match.id,
          playerId: entry.playerId,
          teamId: entry.teamId,
          isCaptain: entry.isCaptain,
        }))
      })
    }

    try {
      await notifyMatchCreated({
        matchId: match.id,
        matchName: match.name,
        creatorId: user.sub,
        scorerIds: scorerIdsArray,
      })
    } catch (error) {
      console.error('Error creating match notification:', error)
    }

    return NextResponse.json(
      {
        match: {
          ...match,
          matchScorers: scorerIdsArray.map((userId) => ({ userId })),
          squads: squadPlayers.map((entry) => ({ ...entry })),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating match:', error)
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
