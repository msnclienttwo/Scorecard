import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  startMatch,
  startInnings,
  endInnings,
  finishMatch,
  archiveMatch,
  setToss,
  pauseMatch,
  resumeMatch,
  rainDelay,
  drinksBreak,
  setOpeners,
  setBowler,
  setBatsmen,
  swapStrike,
} from '@/lib/scoring'

export async function PATCH(
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
    const { action } = body

    if (!action) {
      return NextResponse.json(
        { error: 'An action is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'start': {
        const match = await startMatch(matchId, user)
        return NextResponse.json({ match })
      }
      case 'start-innings': {
        const innings = await startInnings(matchId, user)
        return NextResponse.json({ innings })
      }
      case 'end-innings': {
        const innings = await endInnings(matchId, user)
        return NextResponse.json({ innings })
      }
      case 'finish': {
        const match = await finishMatch(matchId, user, {
          winningTeamId: body.winningTeamId ?? undefined,
          result: body.result ?? undefined,
        })
        return NextResponse.json({ match })
      }
      case 'archive': {
        const match = await archiveMatch(matchId, user)
        return NextResponse.json({ match })
      }
      case 'toss': {
        const match = await setToss(matchId, user, {
          tossWinner: body.tossWinner,
          tossDecision: body.tossDecision,
        })
        return NextResponse.json({ match })
      }
      case 'pause': {
        const match = await pauseMatch(matchId, user)
        return NextResponse.json({ match })
      }
      case 'resume': {
        const match = await resumeMatch(matchId, user)
        return NextResponse.json({ match })
      }
      case 'rain-delay': {
        const match = await rainDelay(matchId, user)
        return NextResponse.json({ match })
      }
      case 'drinks-break': {
        const match = await drinksBreak(matchId, user)
        return NextResponse.json({ match })
      }
      case 'set-openers': {
        const innings = await setOpeners(matchId, user, {
          strikerId: body.strikerId,
          nonStrikerId: body.nonStrikerId,
          bowlerId: body.bowlerId,
        })
        return NextResponse.json({ innings })
      }
      case 'set-bowler': {
        const innings = await setBowler(matchId, user, body.bowlerId)
        return NextResponse.json({ innings })
      }
      case 'set-batsmen': {
        const innings = await setBatsmen(matchId, user, {
          strikerId: body.strikerId,
          nonStrikerId: body.nonStrikerId,
        })
        return NextResponse.json({ innings })
      }
      case 'swap-strike': {
        const innings = await swapStrike(matchId, user)
        return NextResponse.json({ innings })
      }
      default:
        return NextResponse.json(
          { error: `Unknown action "${action}"` },
          { status: 400 }
        )
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
