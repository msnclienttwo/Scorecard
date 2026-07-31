import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId } = await params
    const body = await request.json()

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.sub }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: body.isRead === false ? false : true }
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.sub, isRead: false }
    })

    return NextResponse.json({ notification, unreadCount })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId } = await params

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.sub }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.sub, isRead: false }
    })

    return NextResponse.json({
      message: 'Notification deleted',
      unreadCount
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
