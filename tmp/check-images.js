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
  
  const { data } = await supabase
    .from('news_articles')
    .select('id, title, image_url, slug')
    .order('published_at', { ascending: false })
    .limit(10);

  console.log("=== LATEST 10 ARTICLES ===");
  console.log("Format: title | slug | image_url\n");
  data.forEach((a, i) => {
    const title = (a.title || '').substring(0, 40);
    const slug = a.slug || 'NO-SLUG';
    const img = a.image_url || 'NO-IMAGE';
    console.log(`${i+1}. ${title}`);
    console.log(`   slug: ${slug}`);
    console.log(`   img:  ${img}`);
    console.log('');
  });
  
  // Count nulls
  const withImage = data.filter(a => a.image_url).length;
  const withSlug = data.filter(a => a.slug).length;
  console.log(`Summary: ${withImage}/10 have images, ${withSlug}/10 have slugs`);
}

check().catch(e => console.error("FATAL:", e));
