"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="min-h-screen bg-[#f8f8fb] dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 animate-fade-in">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-neutral-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-sm shadow-sm">
              {membership.org.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight leading-none truncate max-w-[200px]">{membership.org.name}</h1>
              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5">
                Plan {planConfig.name} · Rol {roleLabel(role)}
              </p>
            </div>
          </div>
          <button
            onClick={onLeaveOrg}
            className="text-xs font-semibold text-neutral-500 dark:text-zinc-400 hover:text-[#f7525f] dark:hover:text-[#f7525f] flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800/60 transition-colors"
            title={canAdmin ? "Transferir propiedad antes de salir" : "Salir de la organización"}
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
          {/* Sidebar tabs */}
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible lg:sticky lg:top-24 lg:self-start">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = t.id === tab;
              const disabled = !canManage && (t.id === "billing" || t.id === "settings");
              return (
                <button
                  key={t.id}
                  onClick={() => !disabled && setTab(t.id)}
                  disabled={disabled}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    active
                      ? "bg-neutral-950 dark:bg-white text-white dark:text-black shadow-sm"
                      : disabled
                      ? "text-neutral-300 dark:text-zinc-700 cursor-not-allowed"
                      : "text-neutral-600 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 hover:text-neutral-900 dark:hover:text-white"
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
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
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
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function roleLabel(role: OrgRole) {
  return role === "owner" ? "Propietario" : role === "admin" ? "Administrador" : "Miembro";
}
