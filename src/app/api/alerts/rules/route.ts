import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateRuleSchema = z.object({
  id: z.string(),
  threshold: z.number(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
  isEnabled: z.boolean(),
});

export async function GET() {
  try {
    const rules = await prisma.alertRule.findMany({
      orderBy: { metric: 'asc' },
    });
    return NextResponse.json({ rules });
  } catch (error: unknown) {
    console.error('[GET /api/alerts/rules] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdateRuleSchema.parse(body);

    const updated = await prisma.alertRule.update({
      where: { id: validated.id },
      data: {
        threshold: validated.threshold,
        severity: validated.severity,
        isEnabled: validated.isEnabled,
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('[PUT /api/alerts/rules] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}
