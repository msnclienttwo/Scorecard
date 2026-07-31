import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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
    const {
      inningsId,
      batsmanId,
      nonStrikerId,
      bowlerId,
      runs = 0,
      extraRuns = 0,
      isWicket = false,
      wicketType,
      fielderId,
      extraType,
      ballResult = 'DOT',
      description,
    } = body

    if (!inningsId || !batsmanId || !bowlerId) {
      return NextResponse.json(
        { error: 'inningsId, batsmanId, and bowlerId are required' },
        { status: 400 }
      )
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Match is not in progress' },
        { status: 400 }
      )
    }

    const innings = await prisma.innings.findUnique({
      where: { id: inningsId },
    })

    if (!innings || innings.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Invalid innings for this match' },
        { status: 400 }
      )
    }

    const isExtra = extraType !== 'NORMAL' && extraType !== null
    const totalRunsForBall = runs + (isExtra ? extraRuns : 0)
    const isLegalDelivery = extraType !== 'WIDE' && extraType !== 'NO_BALL'

    const result = await prisma.$transaction(async (tx) => {
      const existingBalls = await tx.ball.count({
        where: { inningsId },
      })

      const ballNumber = existingBalls + 1
      const overNumber = Math.floor(existingBalls / 6)
      const ballInOver = existingBalls % 6

      let currentOver = await tx.over.findFirst({
        where: { inningsId, overNumber },
      })

      if (!currentOver) {
        currentOver = await tx.over.create({
          data: {
            inningsId,
            overNumber,
            bowlerId,
            totalRuns: 0,
            totalWickets: 0,
            ballsCount: 0,
            extras: 0,
          },
        })
      }

      const ball = await tx.ball.create({
        data: {
          inningsId,
          overId: currentOver.id,
          ballNumber,
          bowlerId,
          batsmanId,
          nonStrikerId: nonStrikerId || batsmanId,
          runs,
          isExtra,
          extraType: isExtra ? extraType : null,
          extraRuns: isExtra ? extraRuns : 0,
          isWicket,
          wicketType: isWicket ? wicketType : null,
          fielderId: fielderId || null,
          description: description || null,
          ballResult: ballResult as any,
        },
      })

      const newBallsCount = isLegalDelivery ? currentOver.ballsCount + 1 : currentOver.ballsCount
      const newOverRuns = currentOver.totalRuns + totalRunsForBall
      const newOverWickets = isWicket ? currentOver.totalWickets + 1 : currentOver.totalWickets
      const isOverComplete = newBallsCount >= 6

      await tx.over.update({
        where: { id: currentOver.id },
        data: {
          totalRuns: newOverRuns,
          totalWickets: newOverWickets,
          ballsCount: newBallsCount,
          extras: currentOver.extras + (isExtra ? extraRuns : 0),
          isCompleted: isOverComplete,
          isMaiden: newOverRuns === 0 && isOverComplete,
        },
      })

      const totalLegalBalls = (await tx.ball.count({
        where: { inningsId, isExtra: false, extraType: { notIn: ['WIDE', 'NO_BALL'] } },
      })) + (isLegalDelivery ? 1 : 0)

      const allLegalBalls = await tx.ball.count({
        where: {
          inningsId,
          OR: [
            { isExtra: false },
            { extraType: { in: ['BYE', 'LEG_BYE'] } },
          ],
        },
      })

      const ballsForOvers = allLegalBalls + (isLegalDelivery ? 1 : 0) - (isExtra ? 0 : 0)
      const newTotalOvers = parseFloat(
        (Math.floor(ballsForOvers / 6) + (ballsForOvers % 6) / 10).toFixed(1)
      )

      const newTotalRuns = innings.totalRuns + totalRunsForBall
      const newTotalWickets = isWicket ? innings.totalWickets + 1 : innings.totalWickets
      const newExtras = innings.extras + (isExtra ? extraRuns : 0)

      await tx.innings.update({
        where: { id: inningsId },
        data: {
          totalRuns: newTotalRuns,
          totalWickets: newTotalWickets,
          totalOvers: newTotalOvers,
          extras: newExtras,
        },
      })

      let battingCard = await tx.battingScorecard.findFirst({
        where: { inningsId, playerId: batsmanId },
      })

      if (!battingCard) {
        battingCard = await tx.battingScorecard.create({
          data: {
            inningsId,
            playerId: batsmanId,
            batPosition: 1,
            runs,
            balls: isLegalDelivery ? 1 : 0,
            fours: runs === 4 ? 1 : 0,
            sixes: runs === 6 ? 1 : 0,
            isNotOut: true,
            strikeRate: 0,
            battingOrder: 1,
          },
        })
      } else if (!isWicket) {
        const newBalls = battingCard.balls + (isLegalDelivery ? 1 : 0)
        const newRuns = battingCard.runs + runs
        await tx.battingScorecard.update({
          where: { id: battingCard.id },
          data: {
            runs: newRuns,
            balls: newBalls,
            fours: battingCard.fours + (runs === 4 ? 1 : 0),
            sixes: battingCard.sixes + (runs === 6 ? 1 : 0),
            strikeRate: newBalls > 0 ? parseFloat(((newRuns / newBalls) * 100).toFixed(2)) : 0,
          },
        })
      } else {
        await tx.battingScorecard.update({
          where: { id: battingCard.id },
          data: {
            runs: battingCard.runs + runs,
            balls: battingCard.balls + (isLegalDelivery ? 1 : 0),
            fours: battingCard.fours + (runs === 4 ? 1 : 0),
            sixes: battingCard.sixes + (runs === 6 ? 1 : 0),
            isNotOut: false,
            dismissalType: wicketType,
            bowlerId,
            fielderId: fielderId || null,
          },
        })
      }

      if (isWicket) {
        const wicketNumber = (await tx.fallOfWicket.count({
          where: { inningsId },
        })) + 1

        await tx.fallOfWicket.create({
          data: {
            inningsId,
            wicketNumber,
            playerId: batsmanId,
            runs: newTotalRuns,
            overs: newTotalOvers,
            bowlerId,
            batterName: '',
          },
        })
      }

      let bowlingCard = await tx.bowlingScorecard.findFirst({
        where: { inningsId, playerId: bowlerId },
      })

      const bowlerOvers = isLegalDelivery
        ? (bowlingCard ? bowlingCard.overs : 0) + (isOverComplete ? 1 : 0) : (bowlingCard ? bowlingCard.overs : 0)

      if (!bowlingCard) {
        await tx.bowlingScorecard.create({
          data: {
            inningsId,
            playerId: bowlerId,
            overs: isLegalDelivery && isOverComplete ? 1 : 0,
            maidens: newOverRuns === 0 && isOverComplete ? 1 : 0,
            runs: totalRunsForBall,
            wickets: isWicket ? 1 : 0,
            wides: extraType === 'WIDE' ? 1 : 0,
            noBalls: extraType === 'NO_BALL' ? 1 : 0,
            economy: 0,
            strikeRate: 0,
            dotBalls: totalRunsForBall === 0 && isLegalDelivery ? 1 : 0,
          },
        })
      } else {
        await tx.bowlingScorecard.update({
          where: { id: bowlingCard.id },
          data: {
            overs: bowlerOvers,
            maidens: newOverRuns === 0 && isOverComplete ? bowlingCard.maidens + 1 : bowlingCard.maidens,
            runs: bowlingCard.runs + totalRunsForBall,
            wickets: bowlingCard.wickets + (isWicket ? 1 : 0),
            wides: bowlingCard.wides + (extraType === 'WIDE' ? 1 : 0),
            noBalls: bowlingCard.noBalls + (extraType === 'NO_BALL' ? 1 : 0),
            economy: bowlerOvers > 0
              ? parseFloat(((bowlingCard.runs + totalRunsForBall) / bowlerOvers).toFixed(2))
              : 0,
            dotBalls: bowlingCard.dotBalls + (totalRunsForBall === 0 && isLegalDelivery ? 1 : 0),
          },
        })
      }

      await tx.matchEvent.create({
        data: {
          matchId,
          type: isWicket ? 'WICKET' : 'BALL',
          description: isWicket
            ? `WICKET! ${wicketType}`
            : `${ballNumber} runs scored by batsman`,
          overNumber: overNumber + 1,
          ballNumber: ballInOver + 1,
          inningsNumber: innings.inningsNumber,
          data: {
            runs,
            extraRuns,
            isWicket,
            wicketType,
            extraType,
            ballResult,
          },
        },
      })

      return {
        ball,
        innings: {
          totalRuns: newTotalRuns,
          totalWickets: newTotalWickets,
          totalOvers: newTotalOvers,
          extras: newExtras,
        },
      }
    })

    try {
      const { Server } = await import('socket.io')
      const io = (global as Record<string, unknown>).io as InstanceType<typeof Server> | undefined
      if (io) {
        io.to(`match:${matchId}`).emit('ball', {
          matchId,
          inningsId,
          ball: result.ball,
          innings: result.innings,
        })
      }
    } catch {
      // Socket not available
    }

    return NextResponse.json({ ball: result.ball, innings: result.innings }, { status: 201 })
  } catch (error) {
    console.error('Error adding ball:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
