import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Reemplazado por lógica estricta de 24h en milisegundos

function calculateReward(day: number): number {
  if (day >= 1 && day <= 3) return 10;
  if (day >= 4 && day <= 6) return 20;
  if (day === 7) return 50;
  return 10;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: dbRecord, error: dbError } = await supabase
    .from('user_diamonds')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (dbError) {
    console.error("Diamonds DB error:", dbError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  const now = new Date();
  
  if (!dbRecord) {
    // First time claim!
    const reward = calculateReward(1);
    const { data: newRecord, error: insertError } = await supabase
      .from('user_diamonds')
      .insert({
        user_id: user.id,
        balance: reward,
        consecutive_days: 1,
        last_claim_date: now.toISOString(),
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: 'Failed to claim' }, { status: 500 });
    
    return NextResponse.json({
      success: true,
      balance: newRecord.balance,
      consecutive_days: 1,
      last_claim_date: newRecord.last_claim_date,
      reward,
    });
  }

  // Check existing record
  const lastClaim = new Date(dbRecord.last_claim_date);
  const diffMs = now.getTime() - lastClaim.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  if (diffMs < ONE_DAY_MS) {
    return NextResponse.json({ error: 'Debes esperar 24 horas exactas para reclamar' }, { status: 400 });
  }

  // Calculate new consecutive days
  // If between 24h and 48h, they keep the streak. Otherwise, streak breaks.
  let newConsecutive = 1;
  if (diffMs < 2 * ONE_DAY_MS) {
    newConsecutive = (dbRecord.consecutive_days % 7) + 1;
  }

  const reward = calculateReward(newConsecutive);
  const newBalance = (dbRecord.balance || 0) + reward;

  const { data: updateRecord, error: updateError } = await supabase
    .from('user_diamonds')
    .update({
      balance: newBalance,
      consecutive_days: newConsecutive,
      last_claim_date: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error("Diamonds update error:", updateError);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    balance: updateRecord.balance,
    consecutive_days: updateRecord.consecutive_days,
    last_claim_date: updateRecord.last_claim_date,
    reward,
  });
}
