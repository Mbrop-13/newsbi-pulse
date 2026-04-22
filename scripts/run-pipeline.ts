import { runNewsPipeline } from '../src/lib/services/news-pipeline';

// ── Adaptive Cron Job Logic (Ported from Vercel API Route) ──
function getChileHour(): number {
  const now = new Date();
  // Chile is UTC-4 (standard) / UTC-3 (DST)
  const chileTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  return chileTime.getHours();
}

function getMinIntervalMinutes(hour: number): number {
  if (hour >= 0 && hour < 7) return 60;     // Madrugada
  if (hour >= 7 && hour < 9) return 15;     // Pre-apertura
  if (hour >= 9 && hour < 17) return 10;    // Mercado abierto
  if (hour >= 17 && hour < 21) return 20;   // Post-mercado
  return 30;                                 // Noche
}

async function checkShouldRun(): Promise<boolean> {
  const isManual = process.argv.includes('--manual');
  if (isManual) return true;

  const chileHour = getChileHour();
  const minInterval = getMinIntervalMinutes(chileHour);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn("⚠️  Missing Supabase credentials. Assuming first run.");
      return true;
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: lastRun } = await supabase
      .from('pipeline_runs')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastRun) {
      const minutesSinceLastRun = (Date.now() - new Date(lastRun.created_at).getTime()) / 60000;
      
      if (minutesSinceLastRun < minInterval) {
        console.log(`[PIPELINE-CLI] ⏭️ Skipped: ${minutesSinceLastRun.toFixed(0)}min since last run, need ${minInterval}min (Chile ${chileHour}:00)`);
        return false;
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not check last run, proceeding anyway:", err);
  }

  console.log(`[PIPELINE-CLI] 🚀 Running pipeline (Chile ${chileHour}:00, required interval: ${minInterval}min)`);
  return true;
}

async function main() {
  console.log('🤖 Starting News Pipeline CLI...');
  
  const shouldRun = await checkShouldRun();
  if (!shouldRun) {
    process.exit(0);
  }

  const result = await runNewsPipeline();

  if (!result.success) {
    console.error('❌ Pipeline execution failed:', result.error);
    process.exit(1);
  }

  console.log('✅ Pipeline execution completed successfully!');
  console.log(`📊 Stats: ${result.stats?.saved || 0} articles saved. Duration: ${result.stats?.durationMs || 0}ms`);
  process.exit(0);
}

// Execute
main().catch(err => {
  console.error('💥 Fatal error in pipeline execution:', err);
  process.exit(1);
});
