export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-muted/50 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-6 w-40 bg-muted/50 rounded animate-pulse" />
            <div className="h-3 w-56 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/30 border border-border/30 p-4 animate-pulse">
              <div className="h-3 w-16 bg-muted/40 rounded mb-2" />
              <div className="h-7 w-24 bg-muted/50 rounded" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="rounded-xl bg-muted/20 border border-border/30 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/20 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted/40" />
              <div className="h-4 w-24 bg-muted/50 rounded" />
              <div className="flex-1" />
              <div className="h-4 w-16 bg-muted/40 rounded" />
              <div className="h-4 w-14 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
