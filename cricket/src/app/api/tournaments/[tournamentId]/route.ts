import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          include: {
            homeTeam: { select: { id: true, name: true, logo: true } },
            awayTeam: { select: { id: true, name: true, logo: true } }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logo: true,
                primaryColor: true,
                secondaryColor: true
              }
            }
          }
        },
        standings: true,
        owner: { select: { id: true, name: true } }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tournamentId } = await params
    const body = await request.json()

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        name: body.name,
        description: body.description,
        shortName: body.shortName,
        format: body.format,
        logo: body.logo,
        banner: body.banner,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        maxTeams: body.maxTeams,
        totalOvers: body.totalOvers,
        isPublic: body.isPublic,
        status: body.status
      }
    })

    return NextResponse.json({ tournament: updated })
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tournamentId } = await params

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const matchCount = await prisma.match.count({
      where: { tournamentId }
    })

    if (matchCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete tournament with existing matches' },
        { status: 400 }
      )
    }

    await prisma.tournament.delete({ where: { id: tournamentId } })

    return NextResponse.json({ message: 'Tournament deleted successfully' })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
