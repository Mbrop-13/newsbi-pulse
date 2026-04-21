import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  // 1. Check ALL negative records
  const { data: negRecords } = await supabase
    .from("user_bets")
    .select("id, user_id, prediction_id, side, amount, shares, created_at")
    .lt("shares", 0);

  console.log(`\n=== Negative bet records: ${negRecords?.length || 0} ===`);
  (negRecords || []).forEach(r => {
    console.log(`  ID: ${r.id} | Prediction: ${r.prediction_id} | Side: ${r.side} | Amount: ${r.amount} | Shares: ${r.shares} | Date: ${r.created_at}`);
  });

  // 2. Check ALL positive records
  const { data: posRecords } = await supabase
    .from("user_bets")
    .select("id, user_id, prediction_id, side, amount, shares, created_at")
    .gt("shares", 0);

  console.log(`\n=== Positive bet records: ${posRecords?.length || 0} ===`);
  (posRecords || []).forEach(r => {
    console.log(`  ID: ${r.id} | Prediction: ${r.prediction_id} | Side: ${r.side} | Amount: ${r.amount} | Shares: ${r.shares} | Date: ${r.created_at}`);
  });

  // 3. Check user diamond balance
  const { data: diamonds } = await supabase
    .from("user_diamonds")
    .select("*");

  console.log(`\n=== Diamond balances ===`);
  (diamonds || []).forEach(d => {
    console.log(`  User: ${d.user_id} | Balance: ${d.balance}`);
  });
}

diagnose();
