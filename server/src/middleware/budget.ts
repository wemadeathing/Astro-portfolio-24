import { sql } from 'drizzle-orm';
import { db } from '../db/client';
import { usageDaily } from '../db/schema';
import { env } from '../env';

// The old Netlify 9s function deadline was an accidental cost cap — bounding
// every request to at most ~2 model calls. On Railway there's no such
// ceiling, so a real spend guard is required, not optional. See plan §Risks
// ("Unbounded spend").
function today(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD' UTC
}

export async function isUnderDailyCostCap(): Promise<boolean> {
  const day = today();
  const [row] = await db.select().from(usageDaily).where(sql`${usageDaily.day} = ${day}`).limit(1);
  const spent = row?.costUsd ?? 0;
  return spent < env.DAILY_COST_CAP_USD;
}

export async function recordUsage(costUsd: number): Promise<void> {
  const day = today();
  await db
    .insert(usageDaily)
    .values({ day, requests: 1, costUsd })
    .onConflictDoUpdate({
      target: usageDaily.day,
      set: {
        requests: sql`${usageDaily.requests} + 1`,
        costUsd: sql`${usageDaily.costUsd} + ${costUsd}`,
      },
    });
}
