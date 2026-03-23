
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic env parser
const env = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    acc[key.trim()] = value.trim().replace(/^"|"$/g, '');
    return acc;
  }, {});

async function testInsert() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("Testing insert into news_articles...");
  
  const testArticle = {
    title: "Test JS Directo",
    content: "Prueba desde script JS para verificar el esquema.",
    summary: "Prueba JS",
    description: "Prueba JS",
    category: "tech",
    sources: [{ name: "Test", url: "http://example.com" }],
    ai_model: "test-model-js",
    sentiment: "neutral",
    relevance_score: 100,
    slug: "test-js-" + Date.now(),
    is_live: true,
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('news_articles')
    .insert(testArticle)
    .select();

  if (error) {
    console.error("FAILED INSERT:", JSON.stringify(error, null, 2));
    process.exit(1);
  } else {
    console.log("SUCCESS! Row inserted:", data[0].id);
    process.exit(0);
  }
}

testInsert();
