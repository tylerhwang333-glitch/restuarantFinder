const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const CATEGORIES = [
  { value: null, label: 'All', emoji: '🍽️' },
  { value: 'fast_food', label: 'Fast food', emoji: '🍔' },
  { value: 'fancy', label: 'Fancy', emoji: '🍷' },
  { value: 'cafe', label: 'Cafe', emoji: '☕' },
  { value: 'bar', label: 'Bar', emoji: '🍸' },
  { value: 'pizza', label: 'Pizza', emoji: '🍕' },
];

const PHOTO_BY_CATEGORY = {
  fast_food: { emoji: '🍔', gradient: 'from-amber-400 to-orange-600' },
  fancy: { emoji: '🍷', gradient: 'from-rose-500 to-purple-700' },
  cafe: { emoji: '☕', gradient: 'from-yellow-600 to-amber-800' },
  bar: { emoji: '🍸', gradient: 'from-cyan-500 to-blue-700' },
  pizza: { emoji: '🍕', gradient: 'from-red-500 to-orange-600' },
};
const DEFAULT_PHOTO = { emoji: '🍽️', gradient: 'from-slate-500 to-slate-700' };

function photoFor(category, restaurant) {
  const base = PHOTO_BY_CATEGORY[category] || DEFAULT_PHOTO;
  return restaurant.image ? { ...base, imageUrl: restaurant.image } : base;
}

// Human-friendly distance, matching how Google Maps formats it (m under 1km, else km).
export function formatDistance(distanceM) {
  if (distanceM == null) return null;
  if (distanceM < 1000) return `${Math.round(distanceM / 10) * 10} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

function withPhoto(restaurant, category) {
  return {
    ...restaurant,
    // Backend always sends a stable OSM-derived id; the name/address fallback
    // only exists so older cached responses and tests without an id still work.
    id: restaurant.id || restaurant.name + '|' + (restaurant.address || ''),
    photo: photoFor(category, restaurant),
  };
}

async function fetchJson(path, { lat, lon, category }) {
  const params = new URLSearchParams({ lat, lon });
  if (category) params.set('category', category);

  const res = await fetch(`${API_BASE_URL}${path}?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function getRestaurants({ lat, lon, category }) {
  const list = await fetchJson('/restaurants', { lat, lon, category });
  return list.map((r) => withPhoto(r, category));
}

export async function getRandom({ lat, lon, category }) {
  const pick = await fetchJson('/restaurants/random', { lat, lon, category });
  return withPhoto(pick, category);
}

export async function geocode(q) {
  const res = await fetch(`${API_BASE_URL}/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail || `Couldn't find that location (${res.status})`);
  }
  return res.json(); // { lat, lon, label }
}
