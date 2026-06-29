export function LoadingState() {
  return (
    <div className="min-h-screen bg-[#f8f8fb] dark:bg-zinc-950 flex items-center justify-center animate-fade-in">
      <div className="flex flex-col items-center gap-4 text-neutral-400 dark:text-zinc-500">
        <div className="w-9 h-9 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Cargando tu organización…</p>
      </div>
    </div>
  );
}
