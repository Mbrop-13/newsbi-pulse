
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testInsert() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("Testing insert into news_articles...");
  
  const testArticle = {
    title: "Test de Conexión IA",
    content: "Esto es una prueba para verificar el esquema de la tabla.",
    summary: "Prueba de inserción",
    description: "Prueba de inserción", // Probando ambos campos
    category: "tech",
    sources: [{ name: "Test", url: "http://example.com" }],
    ai_model: "test-model",
    sentiment: "neutral",
    relevance_score: 100,
    slug: "test-ia-" + Date.now(),
    is_live: true,
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('news_articles')
    .insert(testArticle)
    .select();

  if (error) {
    console.error("FAILED INSERT:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS! Row inserted:", data[0].id);
  }
}

testInsert();
