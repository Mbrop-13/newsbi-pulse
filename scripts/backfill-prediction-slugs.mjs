import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateSlug(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .substring(0, 60)
    .replace(/-$/, "");
}

async function backfill() {
  console.log('Fetching predictions...');
  const { data: predictions, error } = await supabase.from('predictions').select('id, title, slug');
  
  if (error) {
    console.error('Error fetching predictions:', error);
    return;
  }
  
  console.log(`Found ${predictions.length} predictions.`);
  
  for (const pred of predictions) {
    if (!pred.slug) {
      let baseSlug = generateSlug(pred.title);
      let uniqueSlug = baseSlug;
      let counter = 1;
      let isUnique = false;
      
      while (!isUnique) {
        const { data: existing } = await supabase.from('predictions').select('id').eq('slug', uniqueSlug).single();
        if (existing && existing.id !== pred.id) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        } else {
          isUnique = true;
        }
      }
      
      console.log(`Updating ${pred.id} -> slug: ${uniqueSlug}`);
      await supabase.from('predictions').update({ slug: uniqueSlug }).eq('id', pred.id);
    } else {
      console.log(`Prediction ${pred.id} already has slug: ${pred.slug}`);
    }
  }
  
  console.log('Backfill complete!');
}

backfill();
