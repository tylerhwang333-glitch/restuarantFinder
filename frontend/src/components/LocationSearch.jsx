import { useState } from 'react';
import { geocode } from '../api/restaurants';
import { MapPinIcon, NavigationIcon } from './Icons';

export default function LocationSearch({ label, onLocate, onUseCurrent }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const place = await geocode(q);
      onLocate(place); // { lat, lon, label }
      setValue('');
    } catch (err) {
      setError(err.message || "Couldn't find that location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <form onSubmit={submit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter a ZIP code or city…"
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="shrink-0 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Go'}
        </button>
        <button
          type="button"
          onClick={onUseCurrent}
          title="Use my current location"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <NavigationIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Current</span>
        </button>
      </form>
      <div className="flex items-center gap-2 px-1 text-xs">
        {label && <span className="text-slate-500">Showing results near <span className="font-medium text-slate-700">{label}</span></span>}
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  );
}
