export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-16 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Glow effect */}
        <div className="absolute top-12 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Category pills skeleton row */}
        <div className="flex gap-2.5 mb-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="h-8 rounded-full bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] border border-border/25" 
              style={{ width: `${80 + i * 14}px` }} 
            />
          ))}
        </div>

        {/* Hero card skeleton (Premium layout) */}
        <div className="mb-10 rounded-2xl bg-card border border-border/30 overflow-hidden shadow-sm relative">
          <div className="aspect-[21/9] bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] relative">
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
          <div className="p-6 md:p-8 space-y-4">
            <div className="h-4.5 w-28 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full" />
            <div className="h-8 w-3/4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full" />
            <div className="space-y-2.5 pt-2">
              <div className="h-3.5 w-full bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full" />
              <div className="h-3.5 w-5/6 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full" />
            </div>
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="rounded-2xl bg-card border border-border/30 overflow-hidden shadow-sm flex flex-col h-full"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-video bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="h-3.5 w-20 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full" />
                  <div className="h-5 w-full bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full" />
                  <div className="h-5 w-4/5 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full" />
                </div>
                <div className="h-3 w-1/3 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full pt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
