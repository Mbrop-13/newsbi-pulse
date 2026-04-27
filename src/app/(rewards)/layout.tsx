"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Diamond, Gift } from "lucide-react";

export default function RewardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isMisDiamantes = pathname === "/mis-diamantes";
  const isRecompensas = pathname === "/recompensas";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E11] flex flex-col pt-20 font-sans overflow-x-hidden">
      {/* Mobile: Horizontal tabs at top */}
      <div className="md:hidden px-4 pt-4 pb-2">
        <div className="flex gap-2">
          <Link
            href="/mis-diamantes"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isMisDiamantes
                ? 'bg-[#3B71F7] text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-100 dark:bg-[#1E2329] text-gray-500 dark:text-gray-400'
            }`}
          >
            <Diamond className="w-4 h-4" />
            Diamantes
          </Link>
          <Link
            href="/recompensas"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isRecompensas
                ? 'bg-[#3B71F7] text-white shadow-lg shadow-blue-500/20'
                : 'bg-gray-100 dark:bg-[#1E2329] text-gray-500 dark:text-gray-400'
            }`}
          >
            <Gift className="w-4 h-4" />
            Recompensas
          </Link>
        </div>
      </div>

      <div className="w-full flex flex-col md:flex-row gap-0 lg:gap-10">
        {/* Desktop: Left Sidebar */}
        <aside className="hidden md:block w-[240px] shrink-0 pt-0 pb-4 md:pl-6 lg:pl-10 sticky top-24 self-start h-fit z-30">
          <nav className="space-y-1">
            <Link
              href="/mis-diamantes"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isMisDiamantes
                  ? 'bg-blue-50 dark:bg-[#1A202C] text-[#3B71F7] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A202C]/40 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Diamond className={`w-5 h-5 ${isMisDiamantes ? 'text-[#3B71F7]' : 'text-gray-400'}`} />
              Mis diamantes
            </Link>
            <Link
              href="/recompensas"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isRecompensas
                  ? 'bg-blue-50 dark:bg-[#1A202C] text-[#3B71F7] shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A202C]/40 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Gift className={`w-5 h-5 ${isRecompensas ? 'text-[#3B71F7]' : 'text-gray-400'}`} />
              Recompensas
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0 px-4 md:px-0 md:pr-10 lg:pr-16 py-4 md:py-8">
          <div className="max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
