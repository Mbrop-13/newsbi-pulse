/**
 * Script para crear los planes de suscripción en Mercado Pago.
 * 
 * Ejecutar una sola vez:
 *   npx tsx scripts/create-mp-plans.ts
 * 
 * Esto crea los planes "Pro", "Max" y "Ultra" como preapproval_plan
 * en la API de Mercado Pago. Los IDs generados se deben guardar
 * en el archivo .env.local como MERCADOPAGO_PLAN_PRO, etc.
 */

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN 
  || "APP_USR-8908539754439484-051008-0f765f858fd6638d059dea9a66c1e6a1-3370652327";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://reclu.cl";

interface PlanDef {
  reason: string;
  amount: number;
  tier: string;
}

const plans: PlanDef[] = [
  { reason: "Reclu Pro — Suscripción Mensual", amount: 22990, tier: "pro" },
  { reason: "Reclu Max — Suscripción Mensual", amount: 44990, tier: "max" },
  { reason: "Reclu Ultra — Suscripción Mensual", amount: 79990, tier: "ultra" },
];

async function createPlan(plan: PlanDef) {
  const body = {
    reason: plan.reason,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: plan.amount,
      currency_id: "CLP",
    },
    back_url: `${SITE_URL}/suscripcion?plan=${plan.tier}`,
  };

  const res = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Error creando plan ${plan.tier}:`, res.status, errText);
    return null;
  }

  const data = await res.json();
  console.log(`✅ Plan ${plan.tier.toUpperCase()} creado:`);
  console.log(`   ID: ${data.id}`);
  console.log(`   Init Point: ${data.init_point}`);
  console.log(`   Monto: $${plan.amount.toLocaleString("es-CL")} CLP/mes`);
  console.log("");
  return data;
}

async function main() {
  console.log("🚀 Creando planes de suscripción en Mercado Pago...\n");

  const results: Record<string, any> = {};

  for (const plan of plans) {
    const result = await createPlan(plan);
    if (result) {
      results[plan.tier] = result;
    }
  }

  console.log("════════════════════════════════════════════════════");
  console.log("📋 Agrega estas líneas a tu .env.local:\n");
  for (const [tier, data] of Object.entries(results)) {
    console.log(`MERCADOPAGO_PLAN_${tier.toUpperCase()}_ID=${data.id}`);
  }
  console.log("\n════════════════════════════════════════════════════");
}

main().catch(console.error);
