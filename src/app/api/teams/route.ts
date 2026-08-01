import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notifyTeamCreated } from '@/lib/notifications'
import { getLogoValidationError } from '@/lib/logo'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || searchParams.get('q')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { isActive: true }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          _count: { select: { players: true, homeMatches: true, awayMatches: true } }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.team.count({ where })
    ])

    return NextResponse.json({
      teams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
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
    const { name, shortName, logo, primaryColor, secondaryColor, country, city, founded, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    const logoError = logo ? getLogoValidationError(logo) : null
    if (logoError) {
      return NextResponse.json(
        { error: logoError },
        { status: 400 }
      )
    }

    const existingTeam = await prisma.team.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingTeam) {
      return NextResponse.json(
        { error: 'Team with this name already exists' },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({
      data: {
        name,
        shortName: shortName || name.substring(0, 3).toUpperCase(),
        logo: logo || null,
        primaryColor: primaryColor || '#2563EB',
        secondaryColor: secondaryColor || '#00D4FF',
        country: country || null,
        city: city || null,
        founded: founded || null,
        description: description || null,
        ownerId: user.sub
      }
    })

    try {
      await notifyTeamCreated(user.sub, team.name, team.id)
    } catch (error) {
      console.error('Error creating team notification:', error)
    }

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
