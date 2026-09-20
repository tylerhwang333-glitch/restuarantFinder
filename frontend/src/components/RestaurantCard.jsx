import Badge from './Badge';
import PhotoTile from './PhotoTile';
import { formatDistance } from '../api/restaurants';
import { ClockIcon, GlobeIcon, MapPinIcon, PhoneIcon } from './Icons';

export default function RestaurantCard({ restaurant, selected, onSelect }) {
  const { name, address, categories, open_now, hours, phone, website, distance_m, photo } = restaurant;
  const distance = formatDistance(distance_m);

  return (
    <div
      onClick={onSelect}
      className={`group flex cursor-pointer gap-4 rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        selected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <PhotoTile photo={photo} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-base font-semibold text-slate-900">{name}</h3>
          {distance && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {distance}
            </span>
          )}
        </div>

        {categories?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700"
              >
                {c.replace(/_/g, ' ')}
              </span>
            ))}
            <Badge openNow={open_now} />
          </div>
        )}

        <div className="mt-2 space-y-1 text-sm text-slate-500">
          <p className="flex items-start gap-1.5">
            <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{address || 'Address not listed on OpenStreetMap'}</span>
          </p>
          {hours && (
            <p className="flex items-start gap-1.5">
              <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{hours}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1.5 text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                {phone}
              </a>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-1.5 text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <GlobeIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Website</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
