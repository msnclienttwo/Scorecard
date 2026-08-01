import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { recordBall, type BallInput } from '@/lib/scoring'
import { toUserError } from '@/lib/errors'

export async function POST(
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

    if (!body.inningsId || !body.batsmanId || !body.nonStrikerId || !body.bowlerId) {
      return NextResponse.json(
        {
          error:
            'inningsId, batsmanId, nonStrikerId and bowlerId are required',
        },
        { status: 400 }
      )
    }

    const input: BallInput = {
      inningsId: body.inningsId,
      batsmanId: body.batsmanId,
      nonStrikerId: body.nonStrikerId,
      bowlerId: body.bowlerId,
      runs: typeof body.runs === 'number' ? body.runs : 0,
      extraType: body.extraType ?? null,
      extraRuns: typeof body.extraRuns === 'number' ? body.extraRuns : 0,
      isWicket: typeof body.isWicket === 'boolean' ? body.isWicket : false,
      wicketType: body.wicketType ?? null,
      dismissedPlayerId: body.dismissedPlayerId ?? null,
      fielderId: body.fielderId ?? null,
      description: body.description ?? null,
      shotType: body.shotType ?? null,
      placementZone: body.placementZone ?? null,
      fieldPositions: body.fieldPositions ?? null,
      isFreeHit: typeof body.isFreeHit === 'boolean' ? body.isFreeHit : undefined,
      isOverthrow: typeof body.isOverthrow === 'boolean' ? body.isOverthrow : false,
    }

    const result = await recordBall(matchId, user, input)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const { message, status } = toUserError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
