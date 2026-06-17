export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted z-[9999] overflow-hidden select-none pointer-events-none">
      <div 
        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-[shimmer_1.2s_infinite]" 
        style={{ 
          width: '40%', 
          backgroundSize: '200% 100%' 
        }} 
      />
    </div>
  );
}
