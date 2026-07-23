import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'If the email exists, a reset link has been sent' },
        { status: 200 }
      )
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 3600000)

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    })

    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expires: expiresAt
      }
    })

    // In production, send email with resetToken
    console.log('Reset token for', email, ':', resetToken)

    return NextResponse.json(
      { message: 'If the email exists, a reset link has been sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
