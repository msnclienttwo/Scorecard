import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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

    return NextResponse.json({ match }, { status: 201 })
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
