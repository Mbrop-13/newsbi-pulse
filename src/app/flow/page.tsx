import { Suspense } from "react";
import FlowClient from "./flow-client";
import { BrandFormDialog } from "@/components/flow/brand-form-dialog";
import { BrandAnalysisOverlay } from "@/components/flow/brand-analysis-overlay";
import { PageLoadingSkeleton } from "@/components/page-loading-skeleton";

export default function FlowPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton variant="flow" />}>
      <FlowClient />
      <BrandFormDialog />
      <BrandAnalysisOverlay />
    </Suspense>
  );
}
