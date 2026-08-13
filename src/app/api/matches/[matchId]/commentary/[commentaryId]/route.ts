import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  emitCommentaryDeleted,
  emitCommentaryUpdated,
} from '@/lib/realtime'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string; commentaryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId, commentaryId } = await params
    const body = await request.json()
    const {
      content,
      isHighlight,
      eventType,
      emoji,
      pinned,
      language,
      style,
    } = body

    const existing = await prisma.commentary.findUnique({
      where: { id: commentaryId },
    })
    if (!existing || existing.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Commentary not found' },
        { status: 404 }
      )
    }

    const commentary = await prisma.commentary.update({
      where: { id: commentaryId },
      data: {
        content: content !== undefined ? content : undefined,
        isHighlight: isHighlight !== undefined ? isHighlight : undefined,
        eventType: eventType !== undefined ? eventType : undefined,
        emoji: emoji !== undefined ? emoji : undefined,
        pinned: pinned !== undefined ? pinned : undefined,
        language: language !== undefined ? language : undefined,
        style: style !== undefined ? style : undefined,
        edited: content !== undefined ? true : existing.edited,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        ball: {
          select: {
            id: true,
            ballNumber: true,
            over: { select: { id: true, overNumber: true } },
          },
        },
      },
    })

    emitCommentaryUpdated(matchId, commentary)

    return NextResponse.json({ commentary })
  } catch (error) {
    console.error('Error updating commentary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string; commentaryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId, commentaryId } = await params

    const existing = await prisma.commentary.findUnique({
      where: { id: commentaryId },
    })
    if (!existing || existing.matchId !== matchId) {
      return NextResponse.json(
        { error: 'Commentary not found' },
        { status: 404 }
      )
    }

    await prisma.commentary.delete({ where: { id: commentaryId } })

    emitCommentaryDeleted(matchId, commentaryId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting commentary:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
