import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Resetting all mistakenly live articles...");
  const { data, error } = await supabase
    .from('news_articles')
    .update({ is_live: false })
    .eq('is_live', true);

  if (error) {
    console.error("Error resetting is_live:", error);
  } else {
    console.log("Successfully reset is_live flags.");
  }
}

run();
