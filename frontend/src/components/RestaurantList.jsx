import RestaurantCard from './RestaurantCard';

function Skeleton() {
  return (
    <div data-testid="skeleton-card" className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="h-28 w-28 shrink-0 animate-pulse rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function RestaurantList({ status, error, restaurants, onRetry, selectedId, onSelect }) {
  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-700">{error || 'Something went wrong.'}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
        No restaurants match this filter nearby.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {restaurants.map((r) => (
        <RestaurantCard
          key={r.id}
          restaurant={r}
          selected={r.id === selectedId}
          onSelect={() => onSelect?.(r.id)}
        />
      ))}
    </div>
  );
}
