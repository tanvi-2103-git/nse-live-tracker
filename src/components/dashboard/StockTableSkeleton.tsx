export function StockTableSkeleton() {
  return (
    <div className="space-y-1">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 py-3 px-4 border-b border-border/50">
        <div className="w-8 h-4 skeleton-shimmer rounded" />
        <div className="w-32 h-4 skeleton-shimmer rounded" />
        <div className="flex-1" />
        <div className="w-20 h-4 skeleton-shimmer rounded" />
        <div className="w-16 h-4 skeleton-shimmer rounded" />
        <div className="w-16 h-4 skeleton-shimmer rounded hidden lg:block" />
        <div className="w-24 h-4 skeleton-shimmer rounded hidden xl:block" />
        <div className="w-20 h-4 skeleton-shimmer rounded hidden md:block" />
        <div className="w-16 h-4 skeleton-shimmer rounded hidden sm:block" />
      </div>

      {/* Row Skeletons */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-4 px-4 border-b border-border/30"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="w-8 h-8 skeleton-shimmer rounded-full" />
          <div className="space-y-2">
            <div className="w-24 h-4 skeleton-shimmer rounded" />
            <div className="w-40 h-3 skeleton-shimmer rounded" />
          </div>
          <div className="flex-1" />
          <div className="w-24 h-5 skeleton-shimmer rounded" />
          <div className="w-16 h-5 skeleton-shimmer rounded" />
          <div className="w-20 h-6 skeleton-shimmer rounded-md" />
          <div className="w-16 h-4 skeleton-shimmer rounded hidden lg:block" />
          <div className="w-32 h-3 skeleton-shimmer rounded hidden xl:block" />
          <div className="w-20 h-8 skeleton-shimmer rounded hidden md:block" />
          <div className="w-16 h-3 skeleton-shimmer rounded hidden sm:block" />
        </div>
      ))}
    </div>
  );
}
