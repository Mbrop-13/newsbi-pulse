"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useDiamondStore } from "@/lib/stores/diamond-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AuthModals } from "@/components/auth-modals";

const DIAMOND_IMAGES = [
  "https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-1.png?v=1774402513",
  "https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-2.png?v=1774402529",
  "https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-3.png?v=1774402551",
  "https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-4.png?v=1774402566",
  "https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-5.png?v=1774402584",
  "https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-6.png?v=1774402601",
  "https://cdn.shopify.com/s/files/1/0564/3812/8712/files/diamante-7.png?v=1774402620"
];

export default function MisDiamantesPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { balance, consecutiveDays, lastClaimDate, loadDiamonds, claimDiamonds, canClaimToday, isLoading } = useDiamondStore();
  const [justClaimed, setJustClaimed] = useState(false);
  const [authModal, setAuthModal] = useState({ isOpen: false, view: "login" as "login" | "register" });
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [streakTimeLeftStr, setStreakTimeLeftStr] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const interval = setInterval(() => {
      if (!lastClaimDate) {
        setTimeLeftStr("");
        setStreakTimeLeftStr("");
        return;
      }
      const now = new Date().getTime();
      const lastClaim = new Date(lastClaimDate).getTime();
      const diff = now - lastClaim;
      const ONE_DAY = 24 * 60 * 60 * 1000;

      if (!canClaimToday) {
        const remaining = ONE_DAY - diff;
        if (remaining <= 0) {
          setTimeLeftStr("00h 00m 00s");
        } else {
          const h = Math.floor(remaining / (1000 * 60 * 60)).toString().padStart(2, '0');
          const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
          const s = Math.floor((remaining % (1000 * 60)) / 1000).toString().padStart(2, '0');
          setTimeLeftStr(`${h}h ${m}m ${s}s`);
        }
      } else {
        const streakRemaining = (2 * ONE_DAY) - diff;
        if (streakRemaining > 0 && streakRemaining <= ONE_DAY) {
           const h = Math.floor(streakRemaining / (1000 * 60 * 60)).toString().padStart(2, '0');
           const m = Math.floor((streakRemaining % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
           const s = Math.floor((streakRemaining % (1000 * 60)) / 1000).toString().padStart(2, '0');
           setStreakTimeLeftStr(`${h}h ${m}m ${s}s`);
        } else {
           setStreakTimeLeftStr("");
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, lastClaimDate, canClaimToday]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDiamonds(user.id);
    }
  }, [isAuthenticated, user, loadDiamonds]);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      setAuthModal({ isOpen: true, view: "login" });
      return;
    }
    const res = await claimDiamonds();
    if (res.success) {
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 3000);
    }
  };

  const getRewardForDay = (day: number) => {
    if (day >= 1 && day <= 3) return 10;
    if (day >= 4 && day <= 6) return 20;
    if (day === 7) return 50;
    return 10;
  };

  let isStreakLost = false;
  if (lastClaimDate) {
    const diff = new Date().getTime() - new Date(lastClaimDate).getTime();
    if (diff >= 48 * 60 * 60 * 1000) isStreakLost = true;
  }
  const targetDay = isStreakLost ? 1 : (canClaimToday ? (consecutiveDays % 7) + 1 : consecutiveDays || 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">Mis diamantes de Reclu</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl">Consigue diamantes de Reclu y canjéalos por recompensas exclusivas y ofertas especiales.</p>
      </div>

      {/* Big Blue Balance Card */}
      <div className="relative w-full h-[180px] sm:h-[220px] bg-[#3B71F7] rounded-2xl sm:rounded-3xl p-5 sm:p-10 overflow-hidden shadow-xl mb-4 sm:mb-6 flex flex-col justify-between group">
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
         <div className="absolute bottom-[-20%] right-[-8%] w-80 h-80 group-hover:scale-105 transition-transform duration-700 opacity-90 pointer-events-none">
            <img 
               src={DIAMOND_IMAGES[4]} 
               alt="Background Decoration"
               className="w-full h-full object-contain drop-shadow-2xl rotate-6 brightness-110" 
            />
         </div>

         <div className="relative z-10 flex flex-col items-start gap-4">
            <span className="text-white/80 font-bold text-base sm:text-lg">Mis diamantes</span>
            <span className="text-5xl sm:text-7xl font-black text-white tracking-tight drop-shadow-lg">
               {isAuthenticated ? balance : '--'}
            </span>
         </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col gap-4 mb-2 mt-4 sm:mt-8">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Recoge tus diamantes todos los días.</h3>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 min-h-[20px]">
            {isAuthenticated && !canClaimToday && timeLeftStr ? (
               <span className="text-amber-500 dark:text-amber-400 font-medium tracking-wide">
                 Siguiente recompensa en: {timeLeftStr}
               </span>
            ) : isAuthenticated && canClaimToday && streakTimeLeftStr && !isStreakLost ? (
               <span className="text-red-500 font-medium tracking-wide">
                 ⚠️ Corre, perderás tu racha en: {streakTimeLeftStr}
               </span>
            ) : (
               "Inicia sesión durante 7 días seguidos y tus recompensas aumentarán."
            )}
          </p>
        </div>
        
        <button 
          onClick={handleClaim}
          disabled={isLoading || (!canClaimToday && isAuthenticated)}
          className={`w-full sm:w-auto whitespace-nowrap font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-lg ${
            !isAuthenticated 
              ? 'bg-[#3B71F7] hover:bg-blue-600 text-white' 
              : canClaimToday 
                ? 'bg-[#3B71F7] hover:bg-blue-600 text-white hover:scale-105 active:scale-95' 
                : 'bg-gray-200 dark:bg-[#1E2329] text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {!isAuthenticated ? 'Inicia sesión para recopilar' : isLoading ? 'Procesando...' : canClaimToday ? 'Recopilar diamantes' : 'Vuelve mañana'}
        </button>
      </div>

      {/* Square Timeline Map */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3 mb-12">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const reward = getRewardForDay(day);
            let isCurrent = false;
            let isClaimed = false;

            if (canClaimToday || !isAuthenticated) {
              if (day < targetDay) isClaimed = true;
              else if (day === targetDay) isCurrent = true;
            } else {
              if (day <= consecutiveDays) isClaimed = true;
            }

            const baseClasses = "flex flex-col items-center justify-between p-2.5 sm:p-4 rounded-xl sm:rounded-2xl h-24 sm:h-36 transition-all relative border border-transparent";
            const bgClasses = isCurrent 
              ? "bg-[#3B71F7] shadow-xl shadow-blue-500/20 md:hover:-translate-y-1" 
              : isClaimed
              ? "bg-gray-100 dark:bg-[#1E2329] opacity-70 border-green-500/30 dark:border-green-500/20"
              : "bg-gray-100 dark:bg-[#1E2329]";
            const textColor = isCurrent ? "text-white" : "text-gray-500 dark:text-gray-400";
            const activePulse = isCurrent ? "after:absolute after:inset-0 after:ring-4 after:ring-blue-400 after:rounded-2xl after:animate-pulse" : "";

            return (
              <div key={day} className={`${baseClasses} ${bgClasses} ${activePulse}`}>
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest ${textColor}`}>Día {day}</span>
                <div className="flex-1 flex items-center justify-center my-1 sm:my-2 relative z-10 w-full h-10 sm:h-12">
                   <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                      <img 
                        src={DIAMOND_IMAGES[day-1]} 
                        alt={`Día ${day}`} 
                        className={`absolute w-24 h-24 sm:w-32 sm:h-32 max-w-none object-contain transition-transform duration-300 ${isCurrent ? 'scale-110' : 'group-hover:scale-110'}`}
                      />
                   </div>
                   {isClaimed && (
                     <div className="absolute inset-x-0 -bottom-3 mx-auto w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1E2329] z-20">
                       <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                     </div>
                   )}
                </div>
                <span className={`text-sm sm:text-base font-black ${isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  + {reward}
                </span>
              </div>
            );
        })}
      </div>

      <AuthModals
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        defaultView={authModal.view}
      />
    </div>
  );
}
