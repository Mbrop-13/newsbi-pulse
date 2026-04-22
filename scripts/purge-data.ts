/**
 * Purge all existing news data from Supabase for a fresh start.
 * Run with: npx tsx scripts/purge-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE env vars!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function purge() {
  console.log('🗑️  Purging all news data...\n');

  // 1. Delete all news articles
  console.log('Deleting news_articles...');
  const { error: e1, count: c1 } = await supabase
    .from('news_articles')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Match all rows
    .select('id', { count: 'exact', head: true });
  
  if (e1) console.error('  Error:', e1.message);
  else console.log(`  ✅ Deleted articles`);

  // 2. Delete pipeline runs
  console.log('Deleting pipeline_runs...');
  const { error: e2 } = await supabase
    .from('pipeline_runs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (e2) console.log('  ⚠️  Table may not exist:', e2.message);
  else console.log('  ✅ Deleted pipeline_runs');

  // 3. Delete AI pipeline logs
  console.log('Deleting ai_pipeline_logs...');
  const { error: e3 } = await supabase
    .from('ai_pipeline_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (e3) console.log('  ⚠️  Table may not exist:', e3.message);
  else console.log('  ✅ Deleted ai_pipeline_logs');

  console.log('\n✅ Fresh start complete! All old data has been purged.');
  console.log('Run the pipeline to fetch new articles from Currents API.');
}

purge().catch(console.error);
