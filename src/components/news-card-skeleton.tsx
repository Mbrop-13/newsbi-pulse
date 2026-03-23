import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  index?: number;
  className?: string;
}

export function NewsCardSkeleton({ index = 0, className }: Props) {
  const isFirst = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "group block bg-white dark:bg-[#1E293B]/50 border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-none",
        isFirst ? "flex flex-col md:flex-row h-full w-full" : "flex flex-col h-full",
        className
      )}
    >
      {/* Image Skeleton */}
      <div
        className={cn(
          "relative overflow-hidden bg-gray-200 dark:bg-gray-800 animate-pulse",
          isFirst ? "w-full md:w-[45%] lg:w-[50%] aspect-video md:aspect-auto" : "w-full aspect-video"
        )}
      >
        <div className="absolute top-4 left-4 w-20 h-6 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className={cn("flex flex-col p-6 flex-grow", isFirst ? "md:w-[55%] lg:w-[50%] justify-center" : "")}>
        {/* Source & Tags */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 flex-1 overflow-hidden">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
            <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
          <div className="w-16 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse shrink-0" />
        </div>

        {/* Title */}
        <div className="space-y-2 mb-4">
          <div className="w-full h-7 sm:h-8 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="w-[85%] h-7 sm:h-8 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>

        {/* Summary (Only for the first main card or to fill space) */}
        {isFirst && (
          <div className="space-y-2 mb-6 hidden sm:block">
            <div className="w-full h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="w-[90%] h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="w-[40%] h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        )}

        {/* Footer Meta */}
        <div className="mt-auto pt-5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="w-24 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <div className="flex items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
