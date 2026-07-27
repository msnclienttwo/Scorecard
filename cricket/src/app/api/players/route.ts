import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || searchParams.get('q')
    const role = searchParams.get('role')
    const teamId = searchParams.get('teamId')
    const nationality = searchParams.get('nationality')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nationality: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (role) where.role = role
    if (teamId) where.teamId = teamId
    if (nationality) where.nationality = { contains: nationality, mode: 'insensitive' }

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: {
          team: { select: { id: true, name: true } }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.player.count({ where })
    ])

    return NextResponse.json({
      players,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching players:', error)
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
      name,
      shortName,
      dateOfBirth,
      nationality,
      role,
      battingStyle,
      bowlingStyle,
      teamId,
      image,
      bio
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      )
    }

    const player = await prisma.player.create({
      data: {
        name,
        shortName: shortName || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        nationality: nationality || null,
        role: role || 'BATTER',
        battingStyle: battingStyle || null,
        bowlingStyle: bowlingStyle || null,
        teamId: teamId || null,
        image: image || null,
        bio: bio || null
      },
      include: {
        team: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({ player }, { status: 201 })
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
