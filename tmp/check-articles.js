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
  
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, image_url, slug, is_live, ai_model')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) { console.error("Query error:", error); return; }

  console.log("=== Latest 10 articles ===");
  data.forEach((r, i) => {
    console.log(`${i+1}. "${r.title?.substring(0,50)}"`);
    console.log(`   id: ${r.id}`);
    console.log(`   slug: ${r.slug || 'NULL'}`);
    console.log(`   image_url: ${r.image_url ? r.image_url.substring(0, 80) : 'NULL'}`);
    console.log(`   is_live: ${r.is_live}, ai_model: ${r.ai_model || 'none'}`);
    console.log('');
  });

  // Check which columns exist
  for (const col of ['slug', 'image_url', 'summary', 'city', 'lat', 'lng']) {
    const { error: e } = await supabase.from('news_articles').select(col).limit(1);
    console.log(`Column '${col}': ${e ? 'MISSING (' + e.code + ')' : 'EXISTS'}`);
  }
}

check().catch(e => console.error("FATAL:", e));
