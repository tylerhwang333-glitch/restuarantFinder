# restuarantFinder

An application that lists nearby restaurants, categorizes them, and can choose one for you.
Especially helpful for when your girlfriend does not care where you eat but says no to everything.

## Status

| Part | State |
| --- | --- |
| Backend (FastAPI) | Working — three endpoints against the Overpass API (OpenStreetMap) and Nominatim |
| Frontend (React) | Working — wired to the live backend, with a real Leaflet map. Design and build plan live in [`docs/`](docs/superpowers) |

## Stack

- **Backend:** Python, [FastAPI](https://fastapi.tiangolo.com/), `httpx`, [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) (place search) and [Nominatim](https://nominatim.org/) (geocoding) — both OpenStreetMap data, no API key required
- **Frontend:** React 19 via Create React App (`react-scripts` 5.0.1) with CRACO, Tailwind CSS v3, [Leaflet](https://leafletjs.com/) for the map view

## Repository layout

```
backend/
  main.py     FastAPI app — endpoints, Overpass/Nominatim clients, response cache
frontend/
  src/
    api/         fetch wrapper around the FastAPI backend (restaurants + geocode)
    components/  presentational UI (list, map, filters, search, reel, etc.)
    hooks/       useGeolocation
    App.js       owns state, wires everything together
docs/
  superpowers/specs/    frontend design doc
  superpowers/plans/    frontend implementation plan
```

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install fastapi uvicorn httpx
```

No API key needed — the backend queries public Overpass and Nominatim instances by
default. Place search tries a short list of Overpass mirrors in order (the default
`overpass-api.de` instance is often slow/overloaded) and falls back through the rest on
timeout or error. Override either service via env vars if needed:

```
OVERPASS_API_URLS=https://overpass.example.org/api/interpreter,https://overpass-api.de/api/interpreter
NOMINATIM_URL=https://your-nominatim-instance/search
```

Run the dev server:

```bash
uvicorn main:app --reload
```

The API is then on `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`. CORS is restricted to `http://localhost:3000` (the CRA
dev server origin below).

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs on `http://localhost:3000` and calls the backend at `http://localhost:8000` by
default. Override with a `REACT_APP_API_BASE_URL` env var (e.g. in `frontend/.env.local`)
if the backend runs elsewhere.

On load it asks for browser geolocation; deny it (or use the "Use default location"
button) to fall back to downtown San Francisco. You can also type a ZIP code or city
into the search box, which resolves via `/geocode`. Category chips filter the list, the
list/map toggle (map view uses real OpenStreetMap tiles via Leaflet) switches how
results are shown, and "Surprise me" spins a reel and lands on one random pick via
`/restaurants/random`.

## API

All endpoints require `lat` and `lon` (except `/geocode`, which takes `q`). The optional
`category` on the restaurant endpoints narrows the search to one of: `fast_food`,
`fancy`, `cafe`, `bar`, `pizza`. An unrecognized category returns `400`.

### `GET /restaurants`

Lists every restaurant Overpass finds within a 3 km radius, sorted nearest-first, deduped
by OSM id. Dense areas can return hundreds of results — the frontend paginates
client-side rather than the API capping the response.

```bash
curl "http://localhost:8000/restaurants?lat=40.7128&lon=-74.0060&category=pizza"
```

```json
[
  {
    "id": "node/123456789",
    "name": "Joe's Pizza",
    "address": "7 Carmine St New York 10014",
    "categories": ["pizza"],
    "open_now": null,
    "hours": "Mo-Su 10:00-04:00",
    "phone": "+1 212-366-1182",
    "website": "https://joespizzanyc.com",
    "image": null,
    "lat": 40.7306,
    "lon": -74.0027,
    "distance_m": 1830
  }
]
```

`categories`, `hours`, `phone`, `website`, and `image` come straight from OpenStreetMap
tags (`cuisine`/`amenity`, `opening_hours`, `contact:*`, `image`), so coverage and
formatting vary by contributor and are often `null`. `open_now` is always `null` — OSM
only exposes raw opening-hours strings, not a live open/closed signal. `distance_m` is
computed server-side (haversine) from the query point.

### `GET /restaurants/random`

Picks one nearby restaurant at random — the "just decide for me" endpoint. Returns the
same object shape as `/restaurants`. Returns `404` when nothing is found nearby.

```bash
curl "http://localhost:8000/restaurants/random?lat=40.7128&lon=-74.0060"
```

### `GET /geocode`

Resolves a ZIP code or place name to coordinates via Nominatim, for the frontend's
manual location search.

```bash
curl "http://localhost:8000/geocode?q=94103"
```

```json
{ "lat": 37.7729, "lon": -122.4131, "label": "94103, San Francisco, California" }
```

Returns `404` if nothing matches, `503` if Nominatim is unreachable.

### Caching

`/restaurants` and `/restaurants/random` responses are cached in memory for 5 minutes,
keyed on location (rounded to three decimal places), category, and radius. The cache is
per-process, so it resets on restart. `/geocode` is not cached.

## Available frontend scripts

Standard Create React App scripts, run from `frontend/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Dev server with hot reload on port 3000 |
| `npm test` | Test runner in watch mode |
| `npm run build` | Production build into `build/` |

See the [Create React App docs](https://facebook.github.io/create-react-app/docs/getting-started)
for the full reference.

## Roadmap

The frontend design is specified in
[`docs/superpowers/specs/2026-09-17-restaurant-finder-frontend-design.md`](docs/superpowers/specs/2026-09-17-restaurant-finder-frontend-design.md).
Implemented, wired to the live backend:

- Browser geolocation with a manual fallback (default: downtown San Francisco), plus
  ZIP/city search via `/geocode`
- Category filter chips
- List view and a real Leaflet map view, kept in sync (selecting one highlights the other)
- A "Surprise me" random pick with a case-opening reel animation
- Client-side pagination ("Show more") since Overpass results aren't capped

Known gaps: no star ratings, price level, or real photos — OSM doesn't reliably carry
this data, so cards use a category-derived gradient/emoji tile instead (the `image` field
exists but is `null` for most places). `open_now` is always `null` for the same reason.
Test coverage is a single `App.test.js` smoke test (renders, waits for a mocked
restaurant list); `MapView`, `LocationSearch`, and geocode/distance behavior aren't
covered. Adding richer fields would mean layering in a provider like Google Places
(paid, API key required) rather than relying on OSM tags alone.
