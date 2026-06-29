"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserOrgMembership } from "@/lib/types";
import type { EnterprisePlan, OrgRole } from "@/lib/plan-limits";
import { ENTERPRISE_PLANS } from "@/lib/plan-limits";
import { LayoutDashboard, Users, CreditCard, Settings, LogOut } from "lucide-react";
import { OverviewTab } from "./tabs/overview-tab";
import { MembersTab } from "./tabs/members-tab";
import { BillingTab } from "./tabs/billing-tab";
import { SettingsTab } from "./tabs/settings-tab";

interface DashboardShellProps {
  membership: UserOrgMembership;
  onRefresh: () => void;
  onLeaveOrg: () => void;
}

type Tab = "overview" | "members" | "billing" | "settings";

export function DashboardShell({ membership, onRefresh, onLeaveOrg }: DashboardShellProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [subscription, setSubscription] = useState(membership.subscription);
  const [seatCount, setSeatCount] = useState(membership.org.seat_count);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const orgId = membership.org.id;
  const role = membership.role;
  const canManage = role === "owner" || role === "admin";
  const canAdmin = role === "owner";

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`/api/empresas/${orgId}/members`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMembers(data.members ?? []);
      setInvitations(data.invitations ?? []);
    } catch (err) {
      console.error("[dashboard] fetch members:", err);
    } finally {
      setLoadingMembers(false);
    }
  }, [orgId]);

  const fetchOrgDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/empresas/${orgId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.subscription) setSubscription(data.subscription);
      if (typeof data.activeMemberCount === "number") {
        // refrescar membresía global
        onRefresh();
      }
    } catch (err) {
      console.error("[dashboard] fetch org:", err);
    }
  }, [orgId, onRefresh]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (members.length === 0 && !loadingMembers) fetchOrgDetails();
  }, [fetchOrgDetails, members.length, loadingMembers]);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Resumen", icon: LayoutDashboard },
    { id: "members", label: "Miembros", icon: Users },
    { id: "billing", label: "Facturación", icon: CreditCard },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  const seatActiveCount = members.filter((m: any) => m.status === "active" && m.user_id).length;
  const pendingCount = invitations.length;
  const planConfig = ENTERPRISE_PLANS[(membership.org.plan as EnterprisePlan) ?? "team"];

  return (
    <div className="min-h-screen bg-[#f7f7f9] dark:bg-[#0a0a0f]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1890FF] flex items-center justify-center text-white font-black">
              {membership.org.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none">{membership.org.name}</h1>
              <p className="text-[11px] text-muted-foreground">
                Plan {planConfig.name} · Rol {roleLabel(role)}
              </p>
            </div>
          </div>
          <button
            onClick={onLeaveOrg}
            className="text-xs font-semibold text-muted-foreground hover:text-[#f7525f] flex items-center gap-1.5"
            title={canAdmin ? "Transferir propiedad antes de salir" : "Salir de la organización"}
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar tabs */}
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = t.id === tab;
              const disabled = !canManage && (t.id === "billing" || t.id === "settings");
              return (
                <button
                  key={t.id}
                  onClick={() => !disabled && setTab(t.id)}
                  disabled={disabled}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    active
                      ? "bg-[#1890FF] text-white shadow-sm shadow-[#1890FF]/30"
                      : disabled
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="min-w-0">
            {tab === "overview" && (
              <OverviewTab
                membership={membership}
                members={members}
                subscription={subscription}
                seatActiveCount={seatActiveCount}
                pendingCount={pendingCount}
                onGoToMembers={() => setTab("members")}
              />
            )}
            {tab === "members" && (
              <MembersTab
                orgId={orgId}
                role={role}
                members={members}
                invitations={invitations}
                loading={loadingMembers}
                seatActiveCount={seatActiveCount}
                seatCount={seatCount}
                onChange={() => { fetchMembers(); }}
              />
            )}
            {tab === "billing" && canManage && (
              <BillingTab
                orgId={orgId}
                membership={membership}
                subscription={subscription}
                seatCount={seatCount}
                onSeatsUpdated={(n) => setSeatCount(n)}
                canAdmin={canAdmin}
              />
            )}
            {tab === "settings" && canManage && (
              <SettingsTab
                orgId={orgId}
                membership={membership}
                onUpdated={onRefresh}
                canAdmin={canAdmin}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function roleLabel(role: OrgRole) {
  return role === "owner" ? "Propietario" : role === "admin" ? "Administrador" : "Miembro";
}