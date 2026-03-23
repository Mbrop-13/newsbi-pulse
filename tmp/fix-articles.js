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

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

async function fix() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // 1. Check image_url values
  const { data: articles } = await supabase
    .from('news_articles')
    .select('id, title, image_url, slug')
    .order('published_at', { ascending: false });

  console.log("=== IMAGE STATUS ===");
  articles.forEach((a, i) => {
    console.log(`${i+1}. "${a.title?.substring(0, 40)}" | img: ${a.image_url ? a.image_url.substring(0, 60) + '...' : 'NULL'} | slug: ${a.slug || 'NULL'}`);
  });

  // 2. Backfill slugs for articles that have NULL slug
  console.log("\n=== BACKFILLING SLUGS ===");
  let fixed = 0;
  for (const a of articles) {
    if (!a.slug && a.title) {
      const newSlug = generateSlug(a.title);
      const { error } = await supabase
        .from('news_articles')
        .update({ slug: newSlug })
        .eq('id', a.id);
      
      if (error) {
        console.error(`  Failed slug for "${a.title.substring(0, 30)}":`, error.message);
      } else {
        fixed++;
        console.log(`  ✅ Set slug: ${newSlug}`);
      }
    }
  }
  console.log(`Fixed ${fixed} slugs.`);
}

fix().catch(e => console.error("FATAL:", e));
