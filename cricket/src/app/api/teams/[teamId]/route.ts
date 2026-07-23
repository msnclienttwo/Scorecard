import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        players: {
          select: {
            id: true,
            name: true,
            role: true,
            nationality: true,
            battingStyle: true,
            bowlingStyle: true,
            image: true,
            isCaptain: true
          },
          orderBy: { name: 'asc' }
        },
        _count: { select: { players: true, homeMatches: true, awayMatches: true } }
      }
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params
    const body = await request.json()

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: body.name,
        shortName: body.shortName,
        logo: body.logo,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        country: body.country,
        city: body.city,
        description: body.description
      }
    })

    return NextResponse.json({ team: updated })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const matchCount = await prisma.match.count({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      }
    })

    if (matchCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete team with existing matches' },
        { status: 400 }
      )
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { isActive: false }
    })

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
