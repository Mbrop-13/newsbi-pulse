export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-muted/50 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-56 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Settings sections */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-muted/20 border border-border/30 p-5 mb-4 animate-pulse">
            <div className="h-5 w-32 bg-muted/50 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-muted/30 rounded-lg" />
              <div className="h-10 w-full bg-muted/30 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
