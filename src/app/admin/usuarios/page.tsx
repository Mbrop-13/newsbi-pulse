"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Shield,
  Crown,
  RefreshCw,
  Mail,
  Calendar,
  X,
  Activity,
  Cpu,
  Building2,
  Headphones,
  Flame,
  Snowflake,
  Clock,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  plan: string;
  subStatus: string;
  periodEnd: string | null;
  isAdmin: boolean;
  activity: "active" | "warm" | "cold" | "never";
  daysSinceSignIn: number | null;
  daysSinceSignup: number;
  usage: {
    monthlyTokens: number;
    lifetimeTokens: number;
    weeklyTokens: number;
    aiMessages: number;
  };
  openTickets: number;
  org: { organization_id: string; role: string } | null;
}

type PlanFilter = "all" | "free" | "premium" | "admin" | "pro" | "max" | "ultra";
type ActivityFilter = "all" | "active" | "warm" | "cold" | "never";
type SortKey = "newest" | "oldest" | "last_active" | "tokens_week" | "tokens_month";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n || 0);
}

function PlanPill({ plan, isAdmin }: { plan: string; isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase">
        <Shield className="w-3 h-3" /> Admin
      </span>
    );
  }
  if (plan === "free") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
        Free
      </span>
    );
  }
  const colors: Record<string, string> = {
    pro: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    max: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    ultra: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    ultra_x20: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${colors[plan] || colors.pro}`}
    >
      <Crown className="w-3 h-3" />
      {plan === "ultra_x20" ? "Ultra x20" : plan}
    </span>
  );
}

function ActivityPill({ activity }: { activity: AdminUser["activity"] }) {
  const map = {
    active: {
      label: "Activo",
      cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: Flame,
    },
    warm: {
      label: "Cálido",
      cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      icon: Activity,
    },
    cold: {
      label: "Frío",
      cls: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
      icon: Snowflake,
    },
    never: {
      label: "Sin login",
      cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      icon: Clock,
    },
  } as const;
  const m = map[activity];
  const Icon = m.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${m.cls}`}
    >
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
}

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<PlanFilter>("all");
  const [filterActivity, setFilterActivity] = useState<ActivityFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users?analytics=0");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setErrorMsg(data.error || "Error al cargar usuarios");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    let list = users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      let matchesPlan = true;
      if (filterPlan === "free") matchesPlan = u.plan === "free" && !u.isAdmin;
      if (filterPlan === "premium")
        matchesPlan =
          ["pro", "max", "ultra", "ultra_x20"].includes(u.plan) && !u.isAdmin;
      if (filterPlan === "admin") matchesPlan = u.isAdmin;
      if (filterPlan === "pro") matchesPlan = u.plan === "pro";
      if (filterPlan === "max") matchesPlan = u.plan === "max";
      if (filterPlan === "ultra")
        matchesPlan = u.plan === "ultra" || u.plan === "ultra_x20";

      let matchesActivity = true;
      if (filterActivity !== "all") matchesActivity = u.activity === filterActivity;

      return matchesSearch && matchesPlan && matchesActivity;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "last_active": {
          const ta = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
          const tb = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
          return tb - ta;
        }
        case "tokens_week":
          return b.usage.weeklyTokens - a.usage.weeklyTokens;
        case "tokens_month":
          return (
            Math.max(b.usage.monthlyTokens, b.usage.lifetimeTokens) -
            Math.max(a.usage.monthlyTokens, a.usage.lifetimeTokens)
          );
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [users, search, filterPlan, filterActivity, sortKey]);

  const stats = useMemo(() => {
    const premium = users.filter(
      (u) => ["pro", "max", "ultra", "ultra_x20"].includes(u.plan) && !u.isAdmin
    ).length;
    const active = users.filter((u) => u.activity === "active").length;
    const never = users.filter((u) => u.activity === "never").length;
    return {
      total: users.length,
      premium,
      active,
      never,
      admins: users.filter((u) => u.isAdmin).length,
    };
  }, [users]);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Usuarios
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm">
            Tracking de registros, planes, actividad y consumo de tokens.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold hover:text-blue-500 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Users },
          { label: "Premium", value: stats.premium, icon: Crown },
          { label: "Activos 7d", value: stats.active, icon: Flame },
          { label: "Sin login", value: stats.never, icon: Clock },
          { label: "Admins", value: stats.admins, icon: Shield },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <s.icon className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-wider">{s.label}</p>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar email, nombre o user id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value as PlanFilter)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium outline-none dark:text-white cursor-pointer"
          >
            <option value="all">Todos los planes</option>
            <option value="free">Free</option>
            <option value="premium">Premium (todos)</option>
            <option value="pro">Pro</option>
            <option value="max">Max</option>
            <option value="ultra">Ultra / x20</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value as ActivityFilter)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium outline-none dark:text-white cursor-pointer"
          >
            <option value="all">Toda actividad</option>
            <option value="active">Activos 7d</option>
            <option value="warm">Cálidos 30d</option>
            <option value="cold">Fríos</option>
            <option value="never">Sin login</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium outline-none dark:text-white cursor-pointer"
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="last_active">Último acceso</option>
            <option value="tokens_week">Tokens 7d ↓</option>
            <option value="tokens_month">Tokens mes/vida ↓</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Filter className="w-3.5 h-3.5" />
        Mostrando <strong className="text-slate-700 dark:text-gray-300">{filteredUsers.length}</strong>{" "}
        de {users.length} usuarios
      </p>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-400">
              <tr>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider">
                  Actividad
                </th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider">
                  Tokens 7d
                </th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider">
                  Mes / vida
                </th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider">
                  Registro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-slate-500 text-sm">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500">
                    {errorMsg}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No hay usuarios con esos filtros.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            u.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=1890FF&color=fff`
                          }
                          alt=""
                          className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            {u.name}
                            {u.openTickets > 0 && (
                              <span
                                title={`${u.openTickets} ticket(s) abiertos`}
                                className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400"
                              >
                                <Headphones className="w-3 h-3" />
                                {u.openTickets}
                              </span>
                            )}
                            {u.org && (
                              <span title="Miembro de organización">
                                <Building2 className="w-3 h-3 text-slate-400" />
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <PlanPill plan={u.plan} isAdmin={u.isAdmin} />
                        {u.subStatus !== "none" && !u.isAdmin && (
                          <p className="text-[10px] text-slate-400 capitalize">{u.subStatus}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <ActivityPill activity={u.activity} />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {u.lastSignIn
                          ? formatDistanceToNow(new Date(u.lastSignIn), {
                              addSuffix: true,
                              locale: es,
                            })
                          : "—"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatTokens(u.usage.weeklyTokens)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                        {formatTokens(
                          u.plan === "free"
                            ? u.usage.lifetimeTokens
                            : u.usage.monthlyTokens
                        )}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {u.plan === "free" ? "lifetime" : "mes"}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 dark:text-gray-300 font-medium text-xs">
                        {format(new Date(u.createdAt), "dd MMM yyyy", { locale: es })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        {u.provider}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-white/10 z-50 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        selected.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.name)}&background=1890FF&color=fff`
                      }
                      alt=""
                      className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover"
                    />
                    <div className="min-w-0">
                      <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                        {selected.name}
                      </h2>
                      <p className="text-sm text-slate-500 truncate">{selected.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <PlanPill plan={selected.plan} isAdmin={selected.isAdmin} />
                        <ActivityPill activity={selected.activity} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Identidad
                  </h3>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-xs">User ID</span>
                      <button
                        onClick={() => copyId(selected.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-gray-300 hover:text-blue-500"
                      >
                        {selected.id.slice(0, 8)}…
                        {copied ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    <Row label="Provider" value={selected.provider} />
                    <Row
                      label="Email verificado"
                      value={selected.emailConfirmed ? "Sí" : "No"}
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Suscripción
                  </h3>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 space-y-2 text-sm">
                    <Row label="Plan" value={selected.plan} />
                    <Row label="Estado" value={selected.subStatus} />
                    <Row
                      label="Periodo hasta"
                      value={
                        selected.periodEnd
                          ? format(new Date(selected.periodEnd), "dd MMM yyyy HH:mm", {
                              locale: es,
                            })
                          : "—"
                      }
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    Consumo
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Tokens 7d", value: formatTokens(selected.usage.weeklyTokens) },
                      {
                        label: selected.plan === "free" ? "Lifetime" : "Mes",
                        value: formatTokens(
                          selected.plan === "free"
                            ? selected.usage.lifetimeTokens
                            : selected.usage.monthlyTokens
                        ),
                      },
                      {
                        label: "Msgs AI (mes)",
                        value: String(selected.usage.aiMessages),
                      },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3"
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {c.label}
                        </p>
                        <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                          {c.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Fechas
                  </h3>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 space-y-2 text-sm">
                    <Row
                      label="Registro"
                      value={format(new Date(selected.createdAt), "dd MMM yyyy HH:mm", {
                        locale: es,
                      })}
                    />
                    <Row
                      label="Último acceso"
                      value={
                        selected.lastSignIn
                          ? format(new Date(selected.lastSignIn), "dd MMM yyyy HH:mm", {
                              locale: es,
                            })
                          : "Nunca"
                      }
                    />
                    <Row
                      label="Días desde signup"
                      value={String(selected.daysSinceSignup)}
                    />
                    <Row
                      label="Días sin login"
                      value={
                        selected.daysSinceSignIn === null
                          ? "—"
                          : String(selected.daysSinceSignIn)
                      }
                    />
                  </div>
                </section>

                {(selected.org || selected.openTickets > 0) && (
                  <section className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Extra
                    </h3>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 space-y-2 text-sm">
                      {selected.org && (
                        <Row
                          label="Org"
                          value={`${selected.org.role} · ${selected.org.organization_id.slice(0, 8)}…`}
                        />
                      )}
                      {selected.openTickets > 0 && (
                        <Row
                          label="Tickets abiertos"
                          value={String(selected.openTickets)}
                        />
                      )}
                    </div>
                  </section>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800 dark:text-gray-200 text-right truncate max-w-[60%] capitalize">
        {value}
      </span>
    </div>
  );
}
