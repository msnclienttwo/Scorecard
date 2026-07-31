import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { NOTIFICATION_TYPES } from '@/config/constants'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20'), 1), 100)
    const unreadOnly = searchParams.get('unread') === 'true'
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { userId: user.sub }
    if (unreadOnly) where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.sub, isRead: false }
      })
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
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

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'TOURNAMENT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, title, message, type, matchId, data } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title and message are required' },
        { status: 400 }
      )
    }

    const validTypes = Object.values(NOTIFICATION_TYPES) as string[]
    const notificationType = type || 'SYSTEM'
    if (!validTypes.includes(notificationType)) {
      return NextResponse.json(
        { error: `Invalid type "${notificationType}". Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userId || user.sub,
        title,
        message,
        type: notificationType as (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES],
        matchId: matchId || null,
        data: data || {}
      }
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead, markAll } = body

    if (markAllAsRead || markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.sub, isRead: false },
        data: { isRead: true }
      })
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.sub
        },
        data: { isRead: true }
      })
    } else {
      return NextResponse.json(
        { error: 'notificationIds array or markAllAsRead is required' },
        { status: 400 }
      )
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: user.sub, isRead: false }
    })

    return NextResponse.json({ message: 'Notifications marked as read', unreadCount })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawIds = searchParams.get('ids')
    const ids = rawIds
      ? rawIds.split(',').map((id) => id.trim()).filter(Boolean)
      : []

    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one notification id is required' },
        { status: 400 }
      )
    }

    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        userId: user.sub
      }
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.sub, isRead: false }
    })

    return NextResponse.json({
      message: `${result.count} notification(s) deleted`,
      unreadCount
    })
  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
