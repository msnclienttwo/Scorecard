import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const searchTerm = query.trim()

    const [players, teams, matches, tournaments] = await Promise.all([
      prisma.player.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          role: true,
          image: true,
          team: { select: { id: true, name: true } }
        },
        take: 10
      }),
      prisma.team.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
          primaryColor: true,
          secondaryColor: true,
          _count: { select: { players: true } }
        },
        take: 10
      }),
      prisma.match.findMany({
        where: {
          OR: [
            { venue: { contains: searchTerm, mode: 'insensitive' } },
            { homeTeam: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { awayTeam: { name: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        },
        select: {
          id: true,
          name: true,
          format: true,
          venue: true,
          scheduledAt: true,
          status: true,
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } }
        },
        take: 10
      }),
      prisma.tournament.findMany({
        where: {
          name: { contains: searchTerm, mode: 'insensitive' }
        },
        select: {
          id: true,
          name: true,
          format: true,
          status: true,
          startDate: true,
          logo: true
        },
        take: 10
      })
    ])

    return NextResponse.json({
      results: {
        players,
        teams,
        matches,
        tournaments
      },
      total: players.length + teams.length + matches.length + tournaments.length
    })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
