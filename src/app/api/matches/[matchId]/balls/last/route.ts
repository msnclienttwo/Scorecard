import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { undoLastBall } from '@/lib/scoring'
import { toUserError } from '@/lib/errors'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId } = await params
    const result = await undoLastBall(matchId, user)
    return NextResponse.json(result)
  } catch (error) {
    const { message, status } = toUserError(error)
    return NextResponse.json({ error: message }, { status })
  }
}
