# restuarantFinder

An application that lists nearby restaurants, categorizes them, and can choose one for you.
Especially helpful for when your girlfriend does not care where you eat but says no to everything.

## Status

| Part | State |
| --- | --- |
| Backend (FastAPI) | Working — two endpoints against the Foursquare Places API |
| Frontend (React) | Scaffolded only — still the Create React App starter page. Design and build plan live in [`docs/`](docs/superpowers) |

## Stack

- **Backend:** Python, [FastAPI](https://fastapi.tiangolo.com/), `httpx`, [Foursquare Places API](https://location.foursquare.com/places/docs/)
- **Frontend:** React 19 via Create React App (`react-scripts` 5.0.1)

## Repository layout

```
backend/
  main.py     FastAPI app — endpoints, Foursquare client, response cache
  .env        FOURSQUARE_API_KEY (gitignored)
frontend/
  src/        React app (CRA starter at present)
docs/
  superpowers/specs/    frontend design doc
  superpowers/plans/    frontend implementation plan
```

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A Foursquare Places API key — create one in the [Foursquare developer console](https://foursquare.com/developers/home)

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install fastapi uvicorn httpx python-dotenv
```

Put your API key in `backend/.env`:

```
FOURSQUARE_API_KEY=your_key_here
```

Run the dev server:

```bash
uvicorn main:app --reload
```

The API is then on `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm start
```

Runs on `http://localhost:3000`.

## API

Both endpoints require `lat` and `lon`. The optional `category` narrows the search to
one of: `fast_food`, `fancy`, `cafe`, `bar`, `pizza`. An unrecognized category returns
`400`.

### `GET /restaurants`

Lists nearby restaurants within a 3 km radius (up to 50 results).

```bash
curl "http://localhost:8000/restaurants?lat=40.7128&lon=-74.0060&category=pizza"
```

```json
[
  {
    "name": "Joe's Pizza",
    "address": "7 Carmine St, New York, NY 10014",
    "categories": ["Pizzeria"],
    "open_now": true,
    "hours": "Open until 4:00 AM"
  }
]
```

### `GET /restaurants/random`

Picks one nearby restaurant at random — the "just decide for me" endpoint. Returns
`404` when nothing is found nearby.

```bash
curl "http://localhost:8000/restaurants/random?lat=40.7128&lon=-74.0060"
```

```json
{
  "name": "Joe's Pizza",
  "address": "7 Carmine St, New York, NY 10014",
  "category": "all"
}
```

### Caching

Responses are cached in memory for 5 minutes, keyed on location (rounded to three
decimal places), category, and radius. The cache is per-process, so it resets on
restart.

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
[`docs/superpowers/specs/2026-09-17-restaurant-finder-frontend-design.md`](docs/superpowers/specs/2026-09-17-restaurant-finder-frontend-design.md)
and covers:

- Browser geolocation with a manual fallback
- Category filter chips
- A Google-Maps-style restaurant list
- A "Surprise me" random pick with a case-opening reel animation

Built against mock data first, then wired to the endpoints above.
