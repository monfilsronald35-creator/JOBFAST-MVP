import React, { memo } from 'react';

interface SearchSkeletonProps { count?: number; }

const SearchSkeleton = memo(function SearchSkeleton({ count = 6 }: SearchSkeletonProps) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex gap-3">
          <div className="h-14 w-14 flex-shrink-0 rounded-2xl bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-700" />
            <div className="h-2 w-1/2 rounded bg-slate-800" />
            <div className="h-2 w-1/3 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
});

export default SearchSkeleton;