import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const alert = await prisma.weatherAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updated = await prisma.weatherAlert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Alert resolved manually',
      alert: updated,
    });
  } catch (error: unknown) {
    console.error('[POST /api/alerts/[id]/resolve] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve alert' },
      { status: 500 }
    );
  }
}
