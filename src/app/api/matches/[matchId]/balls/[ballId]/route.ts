import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { editBall, deleteBall, type BallInput } from '@/lib/scoring'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; ballId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId, ballId } = await params
    const body = await request.json()

    const patch: Partial<BallInput> = {}
    if (typeof body.runs === 'number') patch.runs = body.runs
    if ('extraType' in body) patch.extraType = body.extraType ?? null
    if (typeof body.extraRuns === 'number') patch.extraRuns = body.extraRuns
    if (typeof body.isWicket === 'boolean') patch.isWicket = body.isWicket
    if ('wicketType' in body) patch.wicketType = body.wicketType ?? null
    if ('dismissedPlayerId' in body) {
      patch.dismissedPlayerId = body.dismissedPlayerId ?? null
    }
    if ('fielderId' in body) patch.fielderId = body.fielderId ?? null
    if (typeof body.batsmanId === 'string') patch.batsmanId = body.batsmanId
    if (typeof body.nonStrikerId === 'string') {
      patch.nonStrikerId = body.nonStrikerId
    }
    if (typeof body.bowlerId === 'string') patch.bowlerId = body.bowlerId
    if (typeof body.description === 'string') {
      patch.description = body.description
    }

    const ball = await editBall(matchId, user, ballId, patch)
    return NextResponse.json({ ball })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; ballId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId, ballId } = await params
    const ball = await deleteBall(matchId, user, ballId)
    return NextResponse.json({ ball })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
