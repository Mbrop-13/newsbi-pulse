"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { createClient } from "@/lib/supabase/client";
import { LoadingState } from "@/components/empresas/dashboard/loading-state";
import { NoOrg } from "@/components/empresas/dashboard/no-org";
import { CreateOrgModal } from "@/components/empresas/dashboard/create-org-modal";
import type { UserOrgMembership } from "@/lib/types";
import type { EnterprisePlan, BillingCycle } from "@/lib/plan-limits";
import { DashboardShell } from "@/components/empresas/dashboard/dashboard-shell";

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthGuard>
        <DashboardInner />
      </AuthGuard>
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [membership, setMembership] = useState<UserOrgMembership | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingStartup, setPendingStartup] = useState<{
    plan: EnterprisePlan;
    seats: number;
    cycle: BillingCycle;
  } | null>(null);

  const fetchMembership = useCallback(async () => {
    try {
      const res = await fetch("/api/empresas/me", { cache: "no-store" });
      if (!res.ok) {
        setMembership(null);
        return;
      }
      const data = await res.json();
      setMembership(data.org ?? null);
    } catch (err) {
      console.error("[dashboard] fetch error:", err);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  // Si viene con ?plan=...&seats=...&cycle=... (desde /empresas), abrir modal de creación
  useEffect(() => {
    const plan = params.get("plan") as EnterprisePlan | null;
    const seats = params.get("seats");
    const cycle = params.get("cycle") as BillingCycle | null;
    if (plan && seats && cycle) {
      setPendingStartup({
        plan,
        seats: parseInt(seats) || 5,
        cycle: cycle === "annual" ? "annual" : "monthly",
      });
    }
  }, [params]);

  // Si membership cargó y no hay org pero hay pendingStartup, abrir CreateOrg
  useEffect(() => {
    if (!loading && membership === null && pendingStartup) {
      setShowCreate(true);
    }
  }, [loading, membership, pendingStartup]);

  if (loading) return <LoadingState />;

  if (!membership) {
    return (
      <>
        <NoOrg onCreate={() => setShowCreate(true)} />
        {showCreate && (
          <CreateOrgModal
            onClose={() => {
              setShowCreate(false);
              setPendingStartup(null);
            }}
            defaultPlan={pendingStartup?.plan}
            defaultSeats={pendingStartup?.seats}
            defaultCycle={pendingStartup?.cycle}
            onCreated={(orgId, checkoutUrl) => {
              if (checkoutUrl) {
                window.location.href = checkoutUrl;
              } else {
                router.push(`/empresas/dashboard?org=${orgId}`);
                fetchMembership();
              }
            }}
          />
        )}
      </>
    );
  }

  return (
    <DashboardShell
      membership={membership!}
      onRefresh={fetchMembership}
      onLeaveOrg={async () => {
        // Llama al DELETE de membership propia
        const supabase = createClient();
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) return;
        await fetch(`/api/empresas/${membership!.org.id}/members/${u.user.id}`, { method: "DELETE" });
        router.push("/empresas/dashboard");
        fetchMembership();
      }}
    />
  );
}