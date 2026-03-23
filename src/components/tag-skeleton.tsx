import { motion } from "framer-motion";

export function TagSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-3 py-1.5 rounded-full h-[28px] w-20 bg-gray-200 dark:bg-gray-800 animate-pulse"
    />
  );
}
