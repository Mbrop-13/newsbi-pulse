export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Category pills skeleton */}
        <div className="flex gap-2 mb-6 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 rounded-full bg-muted/50 animate-pulse" style={{ width: `${60 + i * 12}px` }} />
          ))}
        </div>

        {/* Hero card skeleton */}
        <div className="mb-8 rounded-2xl bg-muted/30 border border-border/30 overflow-hidden animate-pulse">
          <div className="aspect-[21/9] bg-muted/50" />
          <div className="p-6 space-y-3">
            <div className="h-4 w-24 bg-muted/60 rounded" />
            <div className="h-7 w-3/4 bg-muted/60 rounded" />
            <div className="h-4 w-full bg-muted/40 rounded" />
            <div className="h-4 w-2/3 bg-muted/40 rounded" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-muted/30 border border-border/30 overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted/50" />
              <div className="p-4 space-y-2.5">
                <div className="h-3 w-20 bg-muted/60 rounded" />
                <div className="h-5 w-full bg-muted/60 rounded" />
                <div className="h-5 w-3/4 bg-muted/60 rounded" />
                <div className="h-3 w-1/2 bg-muted/40 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
