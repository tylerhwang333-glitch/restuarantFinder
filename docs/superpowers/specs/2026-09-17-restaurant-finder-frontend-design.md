# Restaurant Finder Frontend — Design

**Date:** 2026-09-17
**Status:** Approved

## Goal

A React frontend for a nearby-restaurant finder. It gets the user's location,
lets them filter by category, shows a Google-Maps-style list of restaurants, and
has a "Surprise me" feature that picks one at random via a CS:GO case-opening reel
animation.

Built against rich mock data now; the real FastAPI backend fetch is swapped in later.

## Stack

- **Create React App** (`react-scripts` 5.0.1), **React 19**. Dev server on **port 3000**.
- **Tailwind CSS v3** via **CRACO** (`@craco/craco`). CRA does not allow custom
  PostCSS config, so CRACO overrides the build without ejecting. npm scripts
  (`start`/`build`/`test`) change to run `craco`.
- No component library — Tailwind utilities only.

### Setup changes

- Dev deps: `@craco/craco`, `tailwindcss@3`, `postcss`, `autoprefixer`.
- New files: `craco.config.js`, `tailwind.config.js`, `postcss.config.js` (via CRACO).
- `src/index.css` gets the three Tailwind directives.
- `package.json` scripts: `craco start`, `craco build`, `craco test`.

## File structure

```
src/
  api/
    restaurants.js      // rich mock data + async getRestaurants/getRandom; single swap point
  components/
    LocationBar.jsx     // geolocation status, retry, "use default location" fallback
    CategoryFilter.jsx  // filter chips: All / Fast food / Fancy / Cafe / Bar / Pizza
    RestaurantList.jsx  // list container: loading / error / empty / data states
    RestaurantCard.jsx  // Google-Maps-style horizontal card
    PhotoTile.jsx       // gradient + cuisine-emoji placeholder tile
    SurpriseReel.jsx    // CS:GO case-opening reel + winner spotlight
    Badge.jsx           // open/closed badge
    Stars.jsx           // star rating display
    PriceLevel.jsx      // $–$$$$ display
  App.jsx               // owns state, wires everything together
```

## Data & API layer

`src/api/restaurants.js` exports two async functions with a small artificial delay
(so loading states are real):

- `getRestaurants({ lat, lon, category })` → array of restaurant objects
- `getRandom({ lat, lon, category })` → one restaurant object

Behind them: a hand-authored **rich mock** of ~15 restaurants. Shape:

```js
{
  id: string,
  name: string,
  address: string,
  categories: string[],      // real backend field (e.g. ["Pizza Place"])
  cuisine: string,           // display cuisine label
  open_now: boolean | null,  // real backend field
  hours: string,             // real backend field (display string)
  rating: number,            // 0–5, one decimal        [mock-only for now]
  reviewCount: number,       // [mock-only for now]
  priceLevel: 1 | 2 | 3 | 4, // [mock-only for now]
  distanceMi: number,        // [mock-only for now]
  photo: { emoji: string, gradient: string } // [mock-only]; gradient = tailwind classes
}
```

The real backend returns a **subset** (`name`, `address`, `categories`, `open_now`,
`hours`), so these extra fields are purely additive. A clearly-commented block in
`restaurants.js` marks exactly where the real
`fetch('http://localhost:8000/restaurants?...')` call goes. Category values sent to
the API: `fast_food`, `fancy`, `cafe`, `bar`, `pizza` (omit for all).

## UI — list view

**RestaurantCard** (horizontal, Google-Maps style):
- Left: `PhotoTile` — gradient background + large cuisine emoji.
- Right: name; ⭐ `Stars` rating + review count; a meta line of
  `PriceLevel` ($–$$$$) · cuisine · distance; address; open/closed `Badge`.

**CategoryFilter**: chip row (All + 5 categories). Selecting a chip re-queries.

**States** (in `RestaurantList`), all explicit:
- **loading** — skeleton cards.
- **error** — message + Retry button.
- **empty** — "No restaurants match this filter."
- **data** — the list.

## Surprise Me — CS:GO reel

`SurpriseReel`:
1. "Surprise me" button decides the winner up front via `getRandom` (respecting the
   active category).
2. Opens a reel: a horizontal strip of ~40–50 cards built from the filtered set
   (repeated/shuffled), constructed so the **winner sits dead-center at rest**.
3. The strip translates left fast, then decelerates with a cubic ease-out over ~4s
   (pure CSS `transform` + `transition`), settling with the winner under a fixed
   center **ticker line**. Gradient/emoji tiles mean no image-load stutter mid-spin.
4. On settle, the winner animates into a **spotlight detail card** (big photo,
   rating, price, cuisine, open/closed, address) with a **Spin again** button.

## Location handling

- Request geolocation on load.
- On deny/unavailable: show a `LocationBar` banner with **Retry** and a
  **"Use default location" (downtown San Francisco: 37.7749, -122.4194)** fallback,
  so the demo always works without location permission.

## State ownership

`App.jsx` owns: `coords`, `category`, `restaurants`, `status` (idle/loading/error),
`error`, and reel open/winner state. Fetching is triggered by coords or category
changes.

## Testing

Light, React Testing Library:
- API/mock layer: `getRestaurants` returns the expected shape; category filtering
  narrows results.
- `RestaurantList` renders each state (loading/error/empty/data) correctly.
- `SurpriseReel`: smoke test (opens, eventually shows a winner) — animation itself
  is not asserted.

## Out of scope (YAGNI)

- Real map / tiles rendering.
- Pagination / infinite scroll.
- Real photos (gradient/emoji tiles now; swap later).
- Backend changes to add rating/price/photo fields (noted as future work).
