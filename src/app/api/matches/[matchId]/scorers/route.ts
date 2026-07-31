import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { emitToMatch } from '@/lib/scoring'

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
    const userIds: string[] = Array.isArray(body.userIds)
      ? [
          ...new Set(
            (body.userIds as unknown[]).filter(
              (id): id is string => typeof id === 'string' && id.length > 0
            )
          ),
        ]
      : []

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { id: true, createdBy: true },
    })
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'TOURNAMENT_ADMIN'
    if (!isAdmin && match.createdBy !== user.sub) {
      return NextResponse.json(
        { error: 'Only the match creator or an admin can manage scorers.' },
        { status: 403 }
      )
    }

    const validUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    })
    const validIds = new Set(validUsers.map((u) => u.id))
    const missing = userIds.filter((id) => !validIds.has(id))
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `One or more users were not found: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.matchScorer.deleteMany({ where: { matchId } }),
      prisma.matchScorer.createMany({
        data: userIds.map((userId) => ({ matchId, userId })),
      }),
    ])

    const matchScorers = await prisma.matchScorer.findMany({
      where: { matchId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    emitToMatch(matchId, 'match:updated', { scorers: true })
    return NextResponse.json({ matchScorers })
  } catch (error) {
    console.error('Error updating scorers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const matchScorers = await prisma.matchScorer.findMany({
      where: { matchId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    return NextResponse.json({ matchScorers })
  } catch (error) {
    console.error('Error fetching scorers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
