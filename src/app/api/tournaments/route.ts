import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('q')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }
    if (status) where.status = status

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          _count: { select: { matches: true, teams: true } }
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.tournament.count({ where })
    ])

    return NextResponse.json({
      tournaments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching tournaments:', error)
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
    const { name, shortName, description, startDate, endDate, format, maxTeams, totalOvers, isPublic } = body

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        shortName: shortName || null,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        format: format || 'T20',
        maxTeams: maxTeams || null,
        totalOvers: totalOvers || 20,
        isPublic: isPublic !== false,
        status: 'upcoming',
        ownerId: user.sub
      }
    })

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
