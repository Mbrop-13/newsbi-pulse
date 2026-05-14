export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-72 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted/40 rounded-xl animate-pulse" />
        </div>

        {/* Market cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/30 border border-border/30 p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-muted/50" />
                <div className="h-4 w-16 bg-muted/50 rounded" />
              </div>
              <div className="h-6 w-20 bg-muted/60 rounded mb-1" />
              <div className="h-4 w-14 bg-muted/40 rounded" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="rounded-2xl bg-muted/20 border border-border/30 p-6 animate-pulse">
          <div className="h-5 w-40 bg-muted/50 rounded mb-4" />
          <div className="h-64 bg-muted/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
