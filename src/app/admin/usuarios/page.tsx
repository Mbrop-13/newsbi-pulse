"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Filter, Shield, Crown, RefreshCw, MoreVertical, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
  lastSignIn: string | null;
  plan: "free" | "pro" | "max" | "ultra";
  status: string;
  isAdmin: boolean;
}

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<"all" | "free" | "premium" | "admin">("all");

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setErrorMsg(data.error || "Error desconocido al cargar usuarios");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error de red al cargar usuarios");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) || 
                          u.name.toLowerCase().includes(search.toLowerCase());
    
    let matchesFilter = true;
    if (filterPlan === "free") matchesFilter = u.plan === "free" && !u.isAdmin;
    if (filterPlan === "premium") matchesFilter = ["pro", "max", "ultra"].includes(u.plan) && !u.isAdmin;
    if (filterPlan === "admin") matchesFilter = u.isAdmin;

    return matchesSearch && matchesFilter;
  });

  const totalPremium = users.filter(u => ["pro", "max", "ultra"].includes(u.plan) && !u.isAdmin).length;
  const totalAdmins = users.filter(u => u.isAdmin).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Gestión de Usuarios
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm">
            Administra los usuarios registrados y revisa el estado de sus suscripciones.
          </p>
        </div>
        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold hover:text-blue-500 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Usuarios</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{users.length}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-2xl border border-transparent shadow-lg shadow-indigo-500/20 text-white">
          <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1 flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> Suscriptores Premium</p>
          <p className="text-3xl font-black">{totalPremium}</p>
        </div>
        <div className="bg-slate-900 dark:bg-slate-800 p-5 rounded-2xl border border-slate-800 dark:border-white/5 text-white shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Administradores</p>
          <p className="text-3xl font-black">{totalAdmins}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por correo o nombre..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={filterPlan} 
            onChange={(e) => setFilterPlan(e.target.value as any)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white cursor-pointer"
          >
            <option value="all">Todos los planes</option>
            <option value="free">Solo Gratuitos</option>
            <option value="premium">Solo Premium</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Plan / Rol</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Registro</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                    <p className="mt-2 text-slate-500 text-sm">Cargando usuarios...</p>
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-red-500">
                    Error: {errorMsg}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron usuarios con esos filtros.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=1890FF&color=fff`} 
                          alt="" 
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {u.name}
                            {u.isAdmin && <Shield className="w-3.5 h-3.5 text-blue-500" title="Administrador" />}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20">
                          <Shield className="w-3 h-3" /> ADMIN
                        </span>
                      ) : u.plan !== "free" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20 uppercase tracking-wide">
                          <Crown className="w-3 h-3" /> {u.plan}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 dark:text-gray-300 font-medium">
                        {format(new Date(u.createdAt), "dd MMM yyyy", { locale: es })}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Último acceso: {u.lastSignIn ? format(new Date(u.lastSignIn), "dd/MM/yyyy") : "Nunca"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
