const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line.includes('=') && !line.startsWith('#'))
  .reduce((acc, line) => {
    const idx = line.indexOf('=');
    acc[line.substring(0, idx).trim()] = line.substring(idx + 1).trim().replace(/^"|"$/g, '');
    return acc;
  }, {});

async function check() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Get count and latest articles
  const { data, error, count } = await supabase
    .from('news_articles')
    .select('id, title, category, is_live, published_at, ai_model', { count: 'exact' })
    .order('published_at', { ascending: false })
    .limit(5);

  console.log("Total rows:", count);
  console.log("Latest 5 articles:");
  if (data) data.forEach((r, i) => console.log(`  ${i+1}. [${r.category}] ${r.title?.substring(0, 60)} | live:${r.is_live} | model:${r.ai_model || 'none'}`));
  if (error) console.error("Error:", error);

  // Also check table columns
  console.log("\nChecking for slug column...");
  const { error: slugErr } = await supabase.from('news_articles').select('slug').limit(1);
  if (slugErr) console.log("slug column: MISSING (" + slugErr.code + ")");
  else console.log("slug column: EXISTS");

  const { error: sumErr } = await supabase.from('news_articles').select('summary').limit(1);
  if (sumErr) console.log("summary column: MISSING (" + sumErr.code + ")");
  else console.log("summary column: EXISTS");
}

check().catch(e => console.error("FATAL:", e));
