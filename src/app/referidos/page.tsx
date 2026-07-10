"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReferralsDialogStore } from "@/lib/stores/referrals-dialog-store";
import { useLanguageStore } from "@/lib/stores/language-store";
import { Loader2 } from "lucide-react";

export default function ReferidosPage() {
  const router = useRouter();
  const setOpen = useReferralsDialogStore((s) => s.setOpen);
  const language = useLanguageStore((s) => s.language);

  useEffect(() => {
    // Open the referrals popup dialog and redirect to main chat area
    setOpen(true);
    router.replace(`/${language}/ai`);
  }, [router, setOpen, language]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-7 h-7 animate-spin text-zinc-500" />
    </div>
  );
}
