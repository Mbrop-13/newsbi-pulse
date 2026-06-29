import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserOrgMembership } from "@/lib/types";
import type { OrgRole } from "@/lib/plan-limits";

interface OrgState {
  memberships: UserOrgMembership[];
  activeOrgId: string | null;
  isLoading: boolean;
  setMemberships: (memberships: UserOrgMembership[]) => void;
  setActiveOrg: (orgId: string | null) => void;
  upsertMembership: (membership: UserOrgMembership) => void;
  removeMembership: (orgId: string) => void;
  clear: () => void;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      memberships: [],
      activeOrgId: null,
      isLoading: false,

      setMemberships: (memberships) => {
        const current = get().activeOrgId;
        const firstId = memberships[0]?.org.id ?? null;
        set({
          memberships,
          // Mantener la org activa si sigue existiendo, si no usar la primera
          activeOrgId: memberships.some((m) => m.org.id === current) ? current : firstId,
        });
      },

      setActiveOrg: (orgId) => set({ activeOrgId: orgId }),

      upsertMembership: (membership) => {
        const existing = get().memberships;
        const idx = existing.findIndex((m) => m.org.id === membership.org.id);
        const next = idx >= 0
          ? existing.map((m) => (m.org.id === membership.org.id ? membership : m))
          : [...existing, membership];
        set({
          memberships: next,
          activeOrgId: get().activeOrgId ?? membership.org.id,
        });
      },

      removeMembership: (orgId) => {
        const next = get().memberships.filter((m) => m.org.id !== orgId);
        set({
          memberships: next,
          activeOrgId: get().activeOrgId === orgId ? (next[0]?.org.id ?? null) : get().activeOrgId,
        });
      },

      clear: () => set({ memberships: [], activeOrgId: null, isLoading: false }),
    }),
    {
      name: "maverlang-org-memberships",
      partialize: (state) => ({ activeOrgId: state.activeOrgId }), // solo persistir el ID activo
    }
  )
);

/** Selectors de conveniencia */
export function useActiveOrg(): UserOrgMembership | null {
  return useOrgStore((s) => {
    if (!s.activeOrgId) return s.memberships[0] ?? null;
    return s.memberships.find((m) => m.org.id === s.activeOrgId) ?? s.memberships[0] ?? null;
  });
}

export function useActiveOrgRole(): OrgRole | null {
  return useOrgStore((s) => {
    const active = s.activeOrgId
      ? s.memberships.find((m) => m.org.id === s.activeOrgId)
      : s.memberships[0];
    return active?.role ?? null;
  });
}
