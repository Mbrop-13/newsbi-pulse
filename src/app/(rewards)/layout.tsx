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
      <div className="w-full flex flex-col md:flex-row gap-0 lg:gap-10">
        
        {/* Left Sidebar Menu (CMC Style) - Docked tightly to the left viewport edge */}
        <aside className="w-full md:w-[240px] shrink-0 pt-0 pb-4 md:pl-6 lg:pl-10 sticky top-24 self-start h-fit z-30">
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
        <main className="flex-1 w-full min-w-0 pr-4 md:pr-10 lg:pr-16 py-8">
          <div className="max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
