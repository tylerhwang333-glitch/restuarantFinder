import { NavigationIcon } from './Icons';

export default function LocationBar({ status, onRetry, onUseDefault }) {
  if (status !== 'denied') return null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2 text-amber-800">
        <NavigationIcon className="h-4 w-4 shrink-0" />
        We couldn't access your location. Retry, or browse restaurants in downtown San Francisco.
      </span>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-800 transition hover:bg-amber-100"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onUseDefault}
          className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white transition hover:bg-amber-700"
        >
          Use default location
        </button>
      </div>
    </div>
  );
}
