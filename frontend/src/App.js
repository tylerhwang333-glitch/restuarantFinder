import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRestaurants, getRandom } from './api/restaurants';
import { useGeolocation } from './hooks/useGeolocation';
import LocationBar from './components/LocationBar';
import LocationSearch from './components/LocationSearch';
import CategoryFilter from './components/CategoryFilter';
import RestaurantList from './components/RestaurantList';
import SurpriseReel from './components/SurpriseReel';
import MapView from './components/MapView';
import { ListIcon, MapIcon, SearchIcon } from './components/Icons';

// How many results to render at once. Overpass can return 2,000+ places for a
// dense area; rendering every card and map marker at once is slow, so we page
// through them with a "Show more" button.
const PAGE_SIZE = 50;

export default function App() {
  const { coords, status: locStatus, label: locLabel, request, useDefault, setManualLocation } =
    useGeolocation();
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'idle'
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map'
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [reelOpen, setReelOpen] = useState(false);
  const [winner, setWinner] = useState(null);
  const [reelKey, setReelKey] = useState(0);

  const load = useCallback(async () => {
    if (!coords) return;
    setStatus('loading');
    setError(null);
    try {
      const list = await getRestaurants({ lat: coords.lat, lon: coords.lon, category });
      setRestaurants(list);
      setStatus('idle');
    } catch (e) {
      setError(e.message || 'Failed to load restaurants.');
      setStatus('error');
    }
  }, [coords, category]);

  useEffect(() => {
    load();
  }, [load]);

  const spin = useCallback(async () => {
    if (!coords) return;
    try {
      const pick = await getRandom({ lat: coords.lat, lon: coords.lon, category });
      setWinner(pick);
      setSelectedId(pick.id);
      setReelKey((k) => k + 1); // force a fresh reel animation each spin
      setReelOpen(true);
    } catch (e) {
      setError(e.message || 'No restaurants to pick from.');
      setStatus('error');
    }
  }, [coords, category]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => r.name.toLowerCase().includes(q));
  }, [restaurants, query]);

  // Only render up to `limit` at a time (cards + map markers).
  const shown = useMemo(() => visible.slice(0, limit), [visible, limit]);

  // Reset paging when the underlying set changes.
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [restaurants, query]);

  const relocate = useCallback(
    (place) => {
      setManualLocation({ lat: place.lat, lon: place.lon }, place.label);
      setSelectedId(null);
    },
    [setManualLocation]
  );

  const canSpin = status === 'idle' && restaurants.length > 0;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      <header className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur">
              🍽️
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">Restaurant Finder</h1>
              <p className="text-xs text-blue-100">Discover great food nearby</p>
            </div>
          </div>
          <button
            type="button"
            onClick={spin}
            disabled={!canSpin}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🎰 Surprise me
          </button>
        </div>
      </header>

      <div className="z-20 shrink-0 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6">
          <div className="mb-3">
            <LocationBar status={locStatus} onRetry={request} onUseDefault={useDefault} />
          </div>

          <LocationSearch label={locLabel} onLocate={relocate} onUseCurrent={request} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants by name…"
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex shrink-0 rounded-full border border-slate-200 bg-slate-50 p-1 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  mobileView === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <ListIcon className="h-4 w-4" /> List
              </button>
              <button
                type="button"
                onClick={() => setMobileView('map')}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  mobileView === 'map' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <MapIcon className="h-4 w-4" /> Map
              </button>
            </div>
          </div>

          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 gap-4 px-0 py-0 lg:grid-cols-[440px_1fr] lg:gap-6 lg:px-6 lg:py-6">
        <div className={`min-h-0 overflow-y-auto px-4 py-4 lg:block lg:px-0 lg:py-0 ${mobileView === 'list' ? 'block' : 'hidden'}`}>
          {status === 'idle' && (
            <p className="mb-3 text-sm text-slate-500">
              {visible.length} {visible.length === 1 ? 'place' : 'places'} nearby, closest first
            </p>
          )}
          <RestaurantList
            status={status}
            error={error}
            restaurants={shown}
            onRetry={load}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {status === 'idle' && shown.length < visible.length && (
            <button
              type="button"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-slate-50"
            >
              Show more ({visible.length - shown.length} remaining)
            </button>
          )}
        </div>

        <div
          className={`isolate min-h-0 overflow-hidden bg-slate-200 lg:rounded-2xl lg:shadow-md ${
            mobileView === 'map' ? 'block' : 'hidden'
          } lg:block`}
        >
          <MapView coords={coords} restaurants={shown} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      {reelOpen && winner && (
        <SurpriseReel
          key={reelKey}
          pool={restaurants}
          winner={winner}
          onSpinAgain={spin}
          onClose={() => setReelOpen(false)}
        />
      )}
    </div>
  );
}
