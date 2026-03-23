const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse .env.local
const env = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8')
  .split('\n')
  .filter(line => line.includes('=') && !line.startsWith('#'))
  .reduce((acc, line) => {
    const idx = line.indexOf('=');
    acc[line.substring(0, idx).trim()] = line.substring(idx + 1).trim().replace(/^"|"$/g, '');
    return acc;
  }, {});

async function test() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("URL:", url ? url.substring(0, 30) + "..." : "MISSING");
  console.log("Key:", key ? key.substring(0, 10) + "..." : "MISSING");

  const supabase = createClient(url, key);

  // Test 1: Minimal insert (only required fields from schema)
  console.log("\n--- TEST 1: Minimal insert (title + content + category + sources) ---");
  const { data: d1, error: e1 } = await supabase
    .from('news_articles')
    .insert({
      title: "Test Minimal " + Date.now(),
      content: "Contenido de prueba.",
      category: "tech",
      sources: [{ name: "Test", url: "http://example.com" }],
      slug: "test-min-" + Date.now(),
    })
    .select('id');

  if (e1) console.error("TEST 1 FAILED:", JSON.stringify(e1, null, 2));
  else console.log("TEST 1 OK:", d1);

  // Test 2: Full insert matching pipeline fields (no description)
  console.log("\n--- TEST 2: Full insert (all pipeline fields) ---");
  const { data: d2, error: e2 } = await supabase
    .from('news_articles')
    .insert({
      title: "Test Full " + Date.now(),
      content: "Contenido completo de prueba para verificar todos los campos.",
      summary: "Resumen de prueba",
      category: "tech",
      sources: [{ name: "Test", url: "http://example.com" }],
      ai_model: "test-model",
      sentiment: "neutral",
      relevance_score: 80,
      city: "Santiago",
      lat: -33.4489,
      lng: -70.6693,
      image_url: "https://example.com/image.jpg",
      slug: "test-full-" + Date.now(),
      is_live: true,
      published_at: new Date().toISOString(),
    })
    .select('id');

  if (e2) console.error("TEST 2 FAILED:", JSON.stringify(e2, null, 2));
  else console.log("TEST 2 OK:", d2);

  // Test 3: With a very long image URL (like NewsData might return)
  console.log("\n--- TEST 3: With null image_url ---");
  const { data: d3, error: e3 } = await supabase
    .from('news_articles')
    .insert({
      title: "Test Null Image " + Date.now(),
      content: "Contenido sin imagen.",
      summary: "Sin imagen",
      category: "tech",
      sources: [{ name: "Test", url: "http://example.com" }],
      slug: "test-null-img-" + Date.now(),
      is_live: true,
      image_url: null,
    })
    .select('id');

  if (e3) console.error("TEST 3 FAILED:", JSON.stringify(e3, null, 2));
  else console.log("TEST 3 OK:", d3);

  // Check current row count
  console.log("\n--- Checking row count ---");
  const { count, error: ce } = await supabase
    .from('news_articles')
    .select('id', { count: 'exact', head: true });
  
  if (ce) console.error("COUNT ERROR:", ce);
  else console.log("Total rows in news_articles:", count);
}

test().catch(e => console.error("FATAL:", e));
