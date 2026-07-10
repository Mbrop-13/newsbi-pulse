import { Suspense } from "react";
import FlowClient from "./flow-client";
import { Loader2 } from "lucide-react";

export default function FlowPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <FlowClient />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 min-h-screen bg-white dark:bg-[#07080a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#1890FF]" />
    </div>
  );
}
