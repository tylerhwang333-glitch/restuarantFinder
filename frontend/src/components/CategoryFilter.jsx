import { CATEGORIES } from '../api/restaurants';

export default function CategoryFilter({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const active = c.value === selected;
        return (
          <button
            key={c.label}
            type="button"
            onClick={() => onSelect(c.value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium shadow-sm transition ${
              active
                ? 'border-blue-600 bg-blue-600 text-white shadow-blue-200'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span aria-hidden="true">{c.emoji}</span>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
