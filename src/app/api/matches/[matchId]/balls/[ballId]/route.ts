import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { editBall, deleteBall, type BallInput } from '@/lib/scoring'
import { toUserError } from '@/lib/errors'

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
    if ('shotType' in body) patch.shotType = body.shotType ?? null
    if ('placementZone' in body) patch.placementZone = body.placementZone ?? null
    if (typeof body.placementX === 'number') patch.placementX = body.placementX
    if (typeof body.placementY === 'number') patch.placementY = body.placementY
    if (typeof body.placementAngle === 'number') {
      patch.placementAngle = body.placementAngle
    }
    if (typeof body.placementDistance === 'number') {
      patch.placementDistance = body.placementDistance
    }
    if ('strikerEnd' in body) patch.strikerEnd = body.strikerEnd ?? null
    if ('fieldPositions' in body) {
      patch.fieldPositions = body.fieldPositions ?? null
    }
    if (typeof body.isFreeHit === 'boolean') patch.isFreeHit = body.isFreeHit
    if (typeof body.isOverthrow === 'boolean') {
      patch.isOverthrow = body.isOverthrow
    }

    const result = await editBall(matchId, user, ballId, patch)
    return NextResponse.json(result)
  } catch (error) {
    const { message, status } = toUserError(error)
    return NextResponse.json({ error: message }, { status })
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
    const result = await deleteBall(matchId, user, ballId)
    return NextResponse.json(result)
  } catch (error) {
    const { message, status } = toUserError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
