export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Image skeleton */}
        <div className="w-full aspect-[2/1] rounded-2xl bg-muted/40 animate-pulse mb-8" />
        
        {/* Category + date */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-20 rounded-full bg-muted/50 animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-3 mb-6">
          <div className="h-8 w-full bg-muted/50 rounded animate-pulse" />
          <div className="h-8 w-4/5 bg-muted/50 rounded animate-pulse" />
        </div>

        {/* Summary */}
        <div className="h-5 w-full bg-muted/30 rounded animate-pulse mb-2" />
        <div className="h-5 w-3/4 bg-muted/30 rounded animate-pulse mb-8" />

        {/* Content lines */}
        <div className="space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted/25 rounded animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
