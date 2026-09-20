import { useEffect, useMemo, useRef, useState } from 'react';
import PhotoTile from './PhotoTile';
import Badge from './Badge';
import { formatDistance } from '../api/restaurants';
import { MapPinIcon } from './Icons';

const REEL_LENGTH = 48;
const WINNER_INDEX = 42;
const SPIN_MS = 4200;
const ITEM_WIDTH = 176; // px: w-40 (160) + gap (16)

// Build a strip of pool items with `winner` placed at WINNER_INDEX.
function buildStrip(pool, winner) {
  const strip = [];
  for (let i = 0; i < REEL_LENGTH; i += 1) {
    strip.push(i === WINNER_INDEX ? winner : pool[i % pool.length]);
  }
  return strip;
}

export default function SurpriseReel({ pool, winner, onSpinAgain, onClose }) {
  const strip = useMemo(() => buildStrip(pool, winner), [pool, winner]);
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const viewportCenter = viewport ? viewport.clientWidth / 2 : 0;
    const target = WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - viewportCenter;

    const raf = requestAnimationFrame(() => setOffset(target));
    const timer = setTimeout(() => setRevealed(true), SPIN_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    // z-[2000] sits above Leaflet's controls/panes (which go up to z-index
    // 1000); without it the map bleeds over this overlay.
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {!revealed ? (
          <>
            <h2 className="mb-4 text-center text-xl font-bold text-slate-900">Finding your spot…</h2>
            <div ref={viewportRef} className="relative overflow-hidden rounded-xl bg-slate-100 py-6">
              <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-0.5 -translate-x-1/2 bg-blue-600" />
              <div
                className="flex gap-4 px-4"
                style={{
                  transform: `translateX(-${offset}px)`,
                  transition: `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.2, 1)`,
                }}
              >
                {strip.map((r, i) => (
                  <div key={i} className="flex w-40 shrink-0 flex-col items-center gap-2">
                    <PhotoTile photo={r.photo} size="sm" />
                    <span className="w-full truncate text-center text-xs font-medium text-slate-700">
                      {r.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div data-testid="winner-spotlight" className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Your pick</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">{winner.name}</h2>
            <div className="mt-4">
              <PhotoTile photo={winner.photo} size="lg" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-slate-700">
              {winner.categories?.length > 0 && (
                <span className="capitalize">{winner.categories.join(', ').replace(/_/g, ' ')}</span>
              )}
              {formatDistance(winner.distance_m) && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {formatDistance(winner.distance_m)} away
                </span>
              )}
              <Badge openNow={winner.open_now ?? null} />
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {winner.address || 'Address not listed on OpenStreetMap'}
            </p>
            {winner.hours && <p className="text-xs text-slate-400">{winner.hours}</p>}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={onSpinAgain}
                className="rounded-full bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700"
              >
                Spin again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-300 px-5 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
