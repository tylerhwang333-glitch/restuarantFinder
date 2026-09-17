# Restaurant Finder Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A React frontend that finds nearby restaurants, shows them Google-Maps-style, filters by category, and picks one at random via a CS:GO case-opening reel.

**Architecture:** Create React App (react-scripts 5, React 19) styled with Tailwind v3 wired through CRACO. `App.jsx` owns all state and calls a mock API layer (`src/api/restaurants.js`) that is the single swap point for the real FastAPI backend. Presentational components are small and focused. "Surprise me" is a self-contained reel component driven by a CSS transform + a timer.

**Tech Stack:** React 19, react-scripts 5.0.1, CRACO, Tailwind CSS v3, PostCSS, Autoprefixer, React Testing Library, Jest.

## Global Constraints

- Dev server runs on **port 3000** (CRA default). Real backend is `http://localhost:8000`.
- All npm scripts run through **`craco`**, not `react-scripts`.
- Tailwind version is **v3** (`tailwindcss@3`). Not v4.
- Component files use `.jsx`; keep each file to one responsibility.
- Category API values are exactly: `fast_food`, `fancy`, `cafe`, `bar`, `pizza` (omit for all).
- Mock restaurant object shape (superset of backend; extras are additive):
  `{ id, name, address, categories:[], apiCategory, cuisine, open_now, hours, rating, reviewCount, priceLevel(1–4), distanceMi, photo:{emoji, gradient} }`
- Default fallback location = downtown San Francisco: `{ lat: 37.7749, lon: -122.4194 }`.
- All work happens under `frontend/`. Run npm commands from `frontend/`.
- Commit messages end with the Co-Authored-By trailer already used in this repo.

---

### Task 1: Tailwind + CRACO setup

**Files:**
- Create: `frontend/craco.config.js`
- Create: `frontend/tailwind.config.js`
- Modify: `frontend/package.json` (devDependencies + scripts)
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: nothing.
- Produces: Tailwind utility classes usable in any `src/**` component; `npm start/build/test` run via craco.

- [ ] **Step 1: Install dependencies**

Run from `frontend/`:
```bash
npm install -D @craco/craco@^7.1.0 tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

- [ ] **Step 2: Create `frontend/craco.config.js`**

```js
module.exports = {
  style: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
};
```

- [ ] **Step 3: Create `frontend/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 4: Replace `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 5: Update `frontend/package.json` scripts**

Replace the `scripts` block so it reads:
```json
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "react-scripts eject"
  },
```

- [ ] **Step 6: Verify Tailwind compiles**

Run from `frontend/`:
```bash
npm run build
```
Expected: build completes with "Compiled successfully" (no PostCSS/Tailwind errors). This confirms CRACO injected Tailwind into the pipeline.

- [ ] **Step 7: Commit**

```bash
git add craco.config.js tailwind.config.js package.json package-lock.json src/index.css
git commit -m "chore: wire Tailwind v3 into CRA via CRACO

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Mock data + API layer

**Files:**
- Create: `frontend/src/api/restaurants.js`
- Test: `frontend/src/api/restaurants.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `CATEGORIES` — array of `{ value, label }`, where `value` is `null` for "All" then the five API values.
  - `getRestaurants({ lat, lon, category }): Promise<Restaurant[]>` — resolves after ~500ms; filters by `apiCategory === category` when `category` is a non-null string; returns all otherwise.
  - `getRandom({ lat, lon, category }): Promise<Restaurant>` — resolves after ~300ms with one random restaurant from the filtered set; rejects with `Error('No restaurants found nearby')` if the set is empty.
  - `Restaurant` shape per Global Constraints.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/api/restaurants.test.js`:
```js
import { CATEGORIES, getRestaurants, getRandom } from './restaurants';

describe('restaurants api', () => {
  test('CATEGORIES starts with an All option (null value) then five categories', () => {
    expect(CATEGORIES[0]).toEqual({ value: null, label: 'All' });
    const values = CATEGORIES.map((c) => c.value);
    expect(values).toEqual([null, 'fast_food', 'fancy', 'cafe', 'bar', 'pizza']);
  });

  test('getRestaurants returns the full rich shape', async () => {
    const list = await getRestaurants({ lat: 37.77, lon: -122.41, category: null });
    expect(list.length).toBeGreaterThanOrEqual(12);
    const r = list[0];
    expect(r).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        address: expect.any(String),
        categories: expect.any(Array),
        apiCategory: expect.any(String),
        cuisine: expect.any(String),
        rating: expect.any(Number),
        reviewCount: expect.any(Number),
        priceLevel: expect.any(Number),
        distanceMi: expect.any(Number),
        photo: expect.objectContaining({ emoji: expect.any(String), gradient: expect.any(String) }),
      })
    );
    expect(['boolean', 'object']).toContain(typeof r.open_now); // boolean or null
  });

  test('getRestaurants filters by category', async () => {
    const pizza = await getRestaurants({ lat: 0, lon: 0, category: 'pizza' });
    expect(pizza.length).toBeGreaterThan(0);
    expect(pizza.every((r) => r.apiCategory === 'pizza')).toBe(true);
  });

  test('getRandom returns one restaurant from the filtered category', async () => {
    const r = await getRandom({ lat: 0, lon: 0, category: 'cafe' });
    expect(r.apiCategory).toBe('cafe');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/api/restaurants.test.js
```
Expected: FAIL — "Cannot find module './restaurants'".

- [ ] **Step 3: Write the implementation**

Create `frontend/src/api/restaurants.js`:
```js
// ---------------------------------------------------------------------------
// MOCK DATA LAYER
// This is the single swap point for the real backend. To go live, replace the
// bodies of getRestaurants / getRandom with fetch calls, e.g.:
//
//   const params = new URLSearchParams({ lat, lon });
//   if (category) params.set('category', category);
//   const res = await fetch(`http://localhost:8000/restaurants?${params}`);
//   if (!res.ok) throw new Error('Request failed');
//   return res.json();
//
// The real backend returns a subset of the fields below (name, address,
// categories, open_now, hours); rating/reviewCount/priceLevel/distanceMi/photo
// are mock-only until the backend adds them.
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { value: null, label: 'All' },
  { value: 'fast_food', label: 'Fast food' },
  { value: 'fancy', label: 'Fancy' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bar', label: 'Bar' },
  { value: 'pizza', label: 'Pizza' },
];

const PHOTO = {
  fast_food: { emoji: '🍔', gradient: 'from-amber-400 to-orange-600' },
  fancy: { emoji: '🍷', gradient: 'from-rose-500 to-purple-700' },
  cafe: { emoji: '☕', gradient: 'from-yellow-600 to-amber-800' },
  bar: { emoji: '🍸', gradient: 'from-cyan-500 to-blue-700' },
  pizza: { emoji: '🍕', gradient: 'from-red-500 to-orange-600' },
};

// make(id, name, apiCategory, cuisine, categories, rating, reviewCount,
//      priceLevel, distanceMi, open_now, hours, address)
function make(id, name, apiCategory, cuisine, categories, rating, reviewCount, priceLevel, distanceMi, open_now, hours, address) {
  return {
    id,
    name,
    apiCategory,
    cuisine,
    categories,
    rating,
    reviewCount,
    priceLevel,
    distanceMi,
    open_now,
    hours,
    address,
    photo: PHOTO[apiCategory],
  };
}

const RESTAURANTS = [
  make('1', 'The Burger Joint', 'fast_food', 'American', ['Fast Food'], 4.3, 812, 1, 0.3, true, 'Open until 11 PM', '221 Market St, San Francisco, CA'),
  make('2', 'In-N-Out Style', 'fast_food', 'Burgers', ['Fast Food'], 4.6, 2140, 1, 0.9, true, 'Open until 1 AM', '333 Jefferson St, San Francisco, CA'),
  make('3', 'Le Petit Château', 'fancy', 'French', ['Fine Dining'], 4.8, 431, 4, 1.2, false, 'Opens 5 PM', '18 Montgomery St, San Francisco, CA'),
  make('4', 'Sakura Omakase', 'fancy', 'Japanese', ['Fine Dining'], 4.9, 289, 4, 2.1, true, 'Open until 10 PM', '900 Post St, San Francisco, CA'),
  make('5', 'Blue Bottle Corner', 'cafe', 'Coffee', ['Cafe'], 4.5, 1503, 2, 0.2, true, 'Open until 6 PM', '66 Mint St, San Francisco, CA'),
  make('6', 'Ritual Roasters', 'cafe', 'Coffee', ['Cafe'], 4.4, 980, 2, 0.7, true, 'Open until 7 PM', '1026 Valencia St, San Francisco, CA'),
  make('7', 'The Tipsy Owl', 'bar', 'Cocktails', ['Bar'], 4.2, 654, 3, 0.5, true, 'Open until 2 AM', '450 Broadway, San Francisco, CA'),
  make('8', 'Hop & Vine', 'bar', 'Wine Bar', ['Bar'], 4.6, 377, 3, 1.0, false, 'Opens 4 PM', '77 Geary St, San Francisco, CA'),
  make('9', "Tony's Pizza Napoletana", 'pizza', 'Italian', ['Pizza Place'], 4.7, 3201, 2, 1.4, true, 'Open until 11 PM', '1570 Stockton St, San Francisco, CA'),
  make('10', 'Slice House', 'pizza', 'Pizza', ['Pizza Place'], 4.1, 512, 1, 0.6, true, 'Open until midnight', '55 4th St, San Francisco, CA'),
  make('11', 'Golden Wok', 'fast_food', 'Chinese', ['Fast Food'], 4.0, 288, 1, 1.1, true, 'Open until 10 PM', '842 Clay St, San Francisco, CA'),
  make('12', 'Marina Bistro', 'fancy', 'Californian', ['Fine Dining'], 4.5, 642, 3, 2.6, true, 'Open until 10 PM', '2100 Chestnut St, San Francisco, CA'),
  make('13', 'Verve Cafe', 'cafe', 'Brunch', ['Cafe'], 4.3, 720, 2, 1.8, false, 'Opens 7 AM', '2101 Market St, San Francisco, CA'),
  make('14', 'Neon Lounge', 'bar', 'Cocktails', ['Bar'], 4.4, 415, 3, 0.8, true, 'Open until 2 AM', '199 Valencia St, San Francisco, CA'),
  make('15', 'Deep Dish Co.', 'pizza', 'Chicago Pizza', ['Pizza Place'], 4.2, 366, 2, 2.3, true, 'Open until 11 PM', '3200 16th St, San Francisco, CA'),
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function filterByCategory(category) {
  if (!category) return RESTAURANTS;
  return RESTAURANTS.filter((r) => r.apiCategory === category);
}

// eslint-disable-next-line no-unused-vars
export async function getRestaurants({ lat, lon, category }) {
  await delay(500);
  return filterByCategory(category);
}

// eslint-disable-next-line no-unused-vars
export async function getRandom({ lat, lon, category }) {
  await delay(300);
  const pool = filterByCategory(category);
  if (pool.length === 0) throw new Error('No restaurants found nearby');
  return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/api/restaurants.test.js
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/api/restaurants.js src/api/restaurants.test.js
git commit -m "feat: add rich mock restaurant API layer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Presentational primitives (Stars, PriceLevel, Badge, PhotoTile)

**Files:**
- Create: `frontend/src/components/Stars.jsx`
- Create: `frontend/src/components/PriceLevel.jsx`
- Create: `frontend/src/components/Badge.jsx`
- Create: `frontend/src/components/PhotoTile.jsx`
- Test: `frontend/src/components/primitives.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `<Stars rating={number} reviewCount={number} />` — renders `rating.toFixed(1)` and `(reviewCount)`.
  - `<PriceLevel level={1|2|3|4} />` — renders `level` `$` characters; has `aria-label` `"Price level {level} of 4"`.
  - `<Badge openNow={boolean|null} />` — renders "Open" (green) / "Closed" (red) / "Hours unknown" (gray).
  - `<PhotoTile photo={{emoji, gradient}} size="sm"|"lg" />` — gradient box with the emoji centered.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/primitives.test.js`:
```js
import { render, screen } from '@testing-library/react';
import Stars from './Stars';
import PriceLevel from './PriceLevel';
import Badge from './Badge';
import PhotoTile from './PhotoTile';

test('Stars shows rating and review count', () => {
  render(<Stars rating={4.5} reviewCount={321} />);
  expect(screen.getByText('4.5')).toBeInTheDocument();
  expect(screen.getByText('(321)')).toBeInTheDocument();
});

test('PriceLevel renders the right number of dollar signs', () => {
  render(<PriceLevel level={3} />);
  expect(screen.getByLabelText('Price level 3 of 4')).toHaveTextContent('$$$');
});

test('Badge reflects open state', () => {
  const { rerender } = render(<Badge openNow={true} />);
  expect(screen.getByText('Open')).toBeInTheDocument();
  rerender(<Badge openNow={false} />);
  expect(screen.getByText('Closed')).toBeInTheDocument();
  rerender(<Badge openNow={null} />);
  expect(screen.getByText('Hours unknown')).toBeInTheDocument();
});

test('PhotoTile renders its emoji', () => {
  render(<PhotoTile photo={{ emoji: '🍕', gradient: 'from-red-500 to-orange-600' }} />);
  expect(screen.getByText('🍕')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/primitives.test.js
```
Expected: FAIL — cannot find `./Stars`.

- [ ] **Step 3: Create `frontend/src/components/Stars.jsx`**

```jsx
export default function Stars({ rating, reviewCount }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500" aria-hidden="true">★</span>
      <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
      <span className="text-gray-500">({reviewCount})</span>
    </span>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/PriceLevel.jsx`**

```jsx
export default function PriceLevel({ level }) {
  return (
    <span className="text-sm text-gray-600" aria-label={`Price level ${level} of 4`}>
      {'$'.repeat(level)}
    </span>
  );
}
```

- [ ] **Step 5: Create `frontend/src/components/Badge.jsx`**

```jsx
export default function Badge({ openNow }) {
  let label = 'Hours unknown';
  let classes = 'bg-gray-100 text-gray-600';
  if (openNow === true) {
    label = 'Open';
    classes = 'bg-green-100 text-green-700';
  } else if (openNow === false) {
    label = 'Closed';
    classes = 'bg-red-100 text-red-700';
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 6: Create `frontend/src/components/PhotoTile.jsx`**

```jsx
export default function PhotoTile({ photo, size = 'sm' }) {
  const dims = size === 'lg' ? 'h-40 w-full text-6xl' : 'h-24 w-24 text-4xl';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${photo.gradient} ${dims}`}
    >
      <span>{photo.emoji}</span>
    </div>
  );
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/primitives.test.js
```
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add src/components/Stars.jsx src/components/PriceLevel.jsx src/components/Badge.jsx src/components/PhotoTile.jsx src/components/primitives.test.js
git commit -m "feat: add presentational primitives (Stars, PriceLevel, Badge, PhotoTile)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: RestaurantCard

**Files:**
- Create: `frontend/src/components/RestaurantCard.jsx`
- Test: `frontend/src/components/RestaurantCard.test.js`

**Interfaces:**
- Consumes: `Stars`, `PriceLevel`, `Badge`, `PhotoTile` from Task 3; `Restaurant` shape.
- Produces: `<RestaurantCard restaurant={Restaurant} />` — horizontal Maps-style card.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/RestaurantCard.test.js`:
```js
import { render, screen } from '@testing-library/react';
import RestaurantCard from './RestaurantCard';

const r = {
  id: '1',
  name: "Tony's Pizza",
  address: '1570 Stockton St, San Francisco, CA',
  categories: ['Pizza Place'],
  apiCategory: 'pizza',
  cuisine: 'Italian',
  open_now: true,
  hours: 'Open until 11 PM',
  rating: 4.7,
  reviewCount: 3201,
  priceLevel: 2,
  distanceMi: 1.4,
  photo: { emoji: '🍕', gradient: 'from-red-500 to-orange-600' },
};

test('RestaurantCard shows the key details', () => {
  render(<RestaurantCard restaurant={r} />);
  expect(screen.getByText("Tony's Pizza")).toBeInTheDocument();
  expect(screen.getByText('4.7')).toBeInTheDocument();
  expect(screen.getByText(/Italian/)).toBeInTheDocument();
  expect(screen.getByText(/1\.4 mi/)).toBeInTheDocument();
  expect(screen.getByText('Open')).toBeInTheDocument();
  expect(screen.getByText(r.address)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/RestaurantCard.test.js
```
Expected: FAIL — cannot find `./RestaurantCard`.

- [ ] **Step 3: Create `frontend/src/components/RestaurantCard.jsx`**

```jsx
import Stars from './Stars';
import PriceLevel from './PriceLevel';
import Badge from './Badge';
import PhotoTile from './PhotoTile';

export default function RestaurantCard({ restaurant }) {
  const { name, address, cuisine, open_now, hours, rating, reviewCount, priceLevel, distanceMi, photo } = restaurant;
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <PhotoTile photo={photo} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-semibold text-gray-900">{name}</h3>
          <Badge openNow={open_now} />
        </div>
        <div className="mt-1">
          <Stars rating={rating} reviewCount={reviewCount} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
          <PriceLevel level={priceLevel} />
          <span aria-hidden="true">·</span>
          <span>{cuisine}</span>
          <span aria-hidden="true">·</span>
          <span>{distanceMi.toFixed(1)} mi</span>
        </div>
        <p className="mt-1 truncate text-sm text-gray-500">{address}</p>
        <p className="text-xs text-gray-400">{hours}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/RestaurantCard.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/RestaurantCard.jsx src/components/RestaurantCard.test.js
git commit -m "feat: add Google-Maps-style RestaurantCard

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: CategoryFilter

**Files:**
- Create: `frontend/src/components/CategoryFilter.jsx`
- Test: `frontend/src/components/CategoryFilter.test.js`

**Interfaces:**
- Consumes: `CATEGORIES` from Task 2.
- Produces: `<CategoryFilter selected={string|null} onSelect={(value)=>void} />` — chip row; clicking a chip calls `onSelect` with that category value.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/CategoryFilter.test.js`:
```js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryFilter from './CategoryFilter';

test('renders a chip per category and reports clicks', async () => {
  const onSelect = jest.fn();
  render(<CategoryFilter selected={null} onSelect={onSelect} />);
  expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Pizza' }));
  expect(onSelect).toHaveBeenCalledWith('pizza');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/CategoryFilter.test.js
```
Expected: FAIL — cannot find `./CategoryFilter`.

- [ ] **Step 3: Create `frontend/src/components/CategoryFilter.jsx`**

```jsx
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
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              active
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/CategoryFilter.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/CategoryFilter.jsx src/components/CategoryFilter.test.js
git commit -m "feat: add CategoryFilter chip row

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: RestaurantList (states)

**Files:**
- Create: `frontend/src/components/RestaurantList.jsx`
- Test: `frontend/src/components/RestaurantList.test.js`

**Interfaces:**
- Consumes: `RestaurantCard` from Task 4.
- Produces: `<RestaurantList status={'loading'|'error'|'idle'} error={string|null} restaurants={Restaurant[]} onRetry={()=>void} />`.
  - `status==='loading'` → 3 skeleton cards (`data-testid="skeleton-card"`).
  - `status==='error'` → error message + a "Retry" button that calls `onRetry`.
  - empty (`status==='idle'` and `restaurants.length===0`) → "No restaurants match this filter."
  - otherwise → one `RestaurantCard` per restaurant.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/RestaurantList.test.js`:
```js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RestaurantList from './RestaurantList';

const one = [{
  id: '1', name: 'Slice House', address: '55 4th St', categories: ['Pizza Place'],
  apiCategory: 'pizza', cuisine: 'Pizza', open_now: true, hours: 'Open until midnight',
  rating: 4.1, reviewCount: 512, priceLevel: 1, distanceMi: 0.6,
  photo: { emoji: '🍕', gradient: 'from-red-500 to-orange-600' },
}];

test('shows skeletons while loading', () => {
  render(<RestaurantList status="loading" error={null} restaurants={[]} onRetry={() => {}} />);
  expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
});

test('shows error with a working retry button', async () => {
  const onRetry = jest.fn();
  render(<RestaurantList status="error" error="Something broke" restaurants={[]} onRetry={onRetry} />);
  expect(screen.getByText('Something broke')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /retry/i }));
  expect(onRetry).toHaveBeenCalled();
});

test('shows empty state', () => {
  render(<RestaurantList status="idle" error={null} restaurants={[]} onRetry={() => {}} />);
  expect(screen.getByText(/no restaurants match/i)).toBeInTheDocument();
});

test('renders cards when there is data', () => {
  render(<RestaurantList status="idle" error={null} restaurants={one} onRetry={() => {}} />);
  expect(screen.getByText('Slice House')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/RestaurantList.test.js
```
Expected: FAIL — cannot find `./RestaurantList`.

- [ ] **Step 3: Create `frontend/src/components/RestaurantList.jsx`**

```jsx
import RestaurantCard from './RestaurantCard';

function Skeleton() {
  return (
    <div data-testid="skeleton-card" className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="h-24 w-24 shrink-0 animate-pulse rounded-lg bg-gray-200" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function RestaurantList({ status, error, restaurants, onRetry }) {
  if (status === 'loading') {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">{error || 'Something went wrong.'}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        No restaurants match this filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {restaurants.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/RestaurantList.test.js
```
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/RestaurantList.jsx src/components/RestaurantList.test.js
git commit -m "feat: add RestaurantList with loading/error/empty/data states

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: LocationBar + geolocation hook

**Files:**
- Create: `frontend/src/hooks/useGeolocation.js`
- Create: `frontend/src/components/LocationBar.jsx`
- Test: `frontend/src/hooks/useGeolocation.test.js`

**Interfaces:**
- Consumes: `DEFAULT_LOCATION` (defined here).
- Produces:
  - `DEFAULT_LOCATION = { lat: 37.7749, lon: -122.4194 }` (exported from `useGeolocation.js`).
  - `useGeolocation(): { coords, status, request, useDefault }` where `status` is `'prompting'|'granted'|'denied'`, `coords` is `{lat, lon}|null`, `request()` re-asks the browser, `useDefault()` sets coords to `DEFAULT_LOCATION` and status `'granted'`.
  - `<LocationBar status={string} onRetry={()=>void} onUseDefault={()=>void} />` — banner shown only while `status==='denied'`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/hooks/useGeolocation.test.js`:
```js
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation, DEFAULT_LOCATION } from './useGeolocation';

test('grants coords when the browser resolves', async () => {
  const getCurrentPosition = jest.fn((success) =>
    success({ coords: { latitude: 1.5, longitude: 2.5 } })
  );
  global.navigator.geolocation = { getCurrentPosition };

  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => expect(result.current.status).toBe('granted'));
  expect(result.current.coords).toEqual({ lat: 1.5, lon: 2.5 });
});

test('marks denied on error, and useDefault falls back to SF', async () => {
  const getCurrentPosition = jest.fn((success, error) => error({ code: 1 }));
  global.navigator.geolocation = { getCurrentPosition };

  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => expect(result.current.status).toBe('denied'));

  act(() => result.current.useDefault());
  expect(result.current.status).toBe('granted');
  expect(result.current.coords).toEqual(DEFAULT_LOCATION);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/hooks/useGeolocation.test.js
```
Expected: FAIL — cannot find `./useGeolocation`.

- [ ] **Step 3: Create `frontend/src/hooks/useGeolocation.js`**

```js
import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_LOCATION = { lat: 37.7749, lon: -122.4194 };

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('prompting');

  const request = useCallback(() => {
    setStatus('prompting');
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus('granted');
      },
      () => {
        setStatus('denied');
      }
    );
  }, []);

  const useDefault = useCallback(() => {
    setCoords(DEFAULT_LOCATION);
    setStatus('granted');
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { coords, status, request, useDefault };
}
```

- [ ] **Step 4: Create `frontend/src/components/LocationBar.jsx`**

```jsx
export default function LocationBar({ status, onRetry, onUseDefault }) {
  if (status !== 'denied') return null;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-amber-800">
        We couldn't access your location. Retry, or browse restaurants in downtown San Francisco.
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-800 hover:bg-amber-100"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onUseDefault}
          className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium text-white hover:bg-amber-700"
        >
          Use default location
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/hooks/useGeolocation.test.js
```
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useGeolocation.js src/components/LocationBar.jsx src/hooks/useGeolocation.test.js
git commit -m "feat: add geolocation hook and LocationBar fallback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: SurpriseReel (CS:GO reel + winner spotlight)

**Files:**
- Create: `frontend/src/components/SurpriseReel.jsx`
- Test: `frontend/src/components/SurpriseReel.test.js`

**Interfaces:**
- Consumes: `PhotoTile`, `Stars`, `PriceLevel`, `Badge` from Tasks 3; `Restaurant` shape.
- Produces: `<SurpriseReel pool={Restaurant[]} winner={Restaurant} onSpinAgain={()=>void} onClose={()=>void} />`.
  - Builds a strip of `REEL_LENGTH = 48` items from `pool` (repeated/shuffled) with `winner` fixed at index `WINNER_INDEX = 42`.
  - Animates the strip left via a CSS `transform`/`transition`; after `SPIN_MS = 4200` reveals a winner spotlight card (name, big photo, rating, price, cuisine, open/closed, address) with "Spin again" and "Close".
  - Reveal is driven by a `setTimeout(SPIN_MS)` (not `transitionend`, which jsdom doesn't fire) so it is testable.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/SurpriseReel.test.js`:
```js
import { render, screen, act } from '@testing-library/react';
import SurpriseReel from './SurpriseReel';

const mk = (id, name) => ({
  id, name, address: `${id} Main St`, categories: ['Pizza Place'], apiCategory: 'pizza',
  cuisine: 'Pizza', open_now: true, hours: 'Open until 11 PM', rating: 4.5, reviewCount: 100,
  priceLevel: 2, distanceMi: 1.0, photo: { emoji: '🍕', gradient: 'from-red-500 to-orange-600' },
});

const pool = [mk('1', 'Alpha'), mk('2', 'Beta'), mk('3', 'Gamma')];
const winner = mk('2', 'Beta');

test('reveals the winner spotlight after the spin completes', () => {
  jest.useFakeTimers();
  render(<SurpriseReel pool={pool} winner={winner} onSpinAgain={() => {}} onClose={() => {}} />);

  // Winner spotlight is not shown until the spin finishes.
  expect(screen.queryByRole('button', { name: /spin again/i })).not.toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(4300);
  });

  expect(screen.getByRole('button', { name: /spin again/i })).toBeInTheDocument();
  expect(screen.getByTestId('winner-spotlight')).toHaveTextContent('Beta');
  jest.useRealTimers();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/SurpriseReel.test.js
```
Expected: FAIL — cannot find `./SurpriseReel`.

- [ ] **Step 3: Create `frontend/src/components/SurpriseReel.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import PhotoTile from './PhotoTile';
import Stars from './Stars';
import PriceLevel from './PriceLevel';
import Badge from './Badge';

const REEL_LENGTH = 48;
const WINNER_INDEX = 42;
const SPIN_MS = 4200;
const ITEM_WIDTH = 176; // px: w-40 (160) + gap (16)

// Build a strip of pool items with `winner` placed at WINNER_INDEX.
// index-seeded pick keeps it deterministic (no Math.random at module scope needed).
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
    // Center the winning item under the ticker.
    const viewport = viewportRef.current;
    const viewportCenter = viewport ? viewport.clientWidth / 2 : 0;
    const target = WINNER_INDEX * ITEM_WIDTH + ITEM_WIDTH / 2 - viewportCenter;

    // Kick off the transition on the next frame so the browser animates it.
    const raf = requestAnimationFrame(() => setOffset(target));
    const timer = setTimeout(() => setRevealed(true), SPIN_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        {!revealed ? (
          <>
            <h2 className="mb-4 text-center text-xl font-bold text-gray-900">Finding your spot…</h2>
            <div ref={viewportRef} className="relative overflow-hidden rounded-xl bg-gray-100 py-6">
              {/* center ticker */}
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
                    <span className="w-full truncate text-center text-xs font-medium text-gray-700">
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
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{winner.name}</h2>
            <div className="mt-4">
              <PhotoTile photo={winner.photo} size="lg" />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-gray-700">
              <Stars rating={winner.rating} reviewCount={winner.reviewCount} />
              <PriceLevel level={winner.priceLevel} />
              <span>{winner.cuisine}</span>
              <span>{winner.distanceMi.toFixed(1)} mi</span>
              <Badge openNow={winner.open_now} />
            </div>
            <p className="mt-2 text-sm text-gray-500">{winner.address}</p>
            <p className="text-xs text-gray-400">{winner.hours}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={onSpinAgain}
                className="rounded-lg bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700"
              >
                Spin again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/components/SurpriseReel.test.js
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SurpriseReel.jsx src/components/SurpriseReel.test.js
git commit -m "feat: add CS:GO-style SurpriseReel with winner spotlight

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: App wiring

**Files:**
- Modify: `frontend/src/App.js` (replace default CRA content)
- Delete: `frontend/src/App.css` (unused; Tailwind replaces it)
- Modify: `frontend/src/App.test.js` (replace stale "learn react" test)
- Delete: `frontend/src/logo.svg` (unused)

**Interfaces:**
- Consumes: everything above — `getRestaurants`, `getRandom`, `CATEGORIES`, `useGeolocation`, `LocationBar`, `CategoryFilter`, `RestaurantList`, `SurpriseReel`.
- Produces: the wired app. `App` owns `category`, `restaurants`, `status`, `error`, and reel state.

- [ ] **Step 1: Write the failing test**

Replace `frontend/src/App.test.js` with:
```js
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.navigator.geolocation = {
    getCurrentPosition: (success) => success({ coords: { latitude: 37.77, longitude: -122.41 } }),
  };
});

test('loads and shows restaurants for the granted location', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /restaurant finder/i })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText("The Burger Joint")).toBeInTheDocument());
});

test('shows the Surprise me button', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByRole('button', { name: /surprise me/i })).toBeInTheDocument());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/App.test.js
```
Expected: FAIL — `App` still renders the CRA template (no "restaurant finder" heading).

- [ ] **Step 3: Replace `frontend/src/App.js`**

```jsx
import { useCallback, useEffect, useState } from 'react';
import { getRestaurants, getRandom } from './api/restaurants';
import { useGeolocation } from './hooks/useGeolocation';
import LocationBar from './components/LocationBar';
import CategoryFilter from './components/CategoryFilter';
import RestaurantList from './components/RestaurantList';
import SurpriseReel from './components/SurpriseReel';

export default function App() {
  const { coords, status: locStatus, request, useDefault } = useGeolocation();
  const [category, setCategory] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'idle'
  const [error, setError] = useState(null);

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
      setReelKey((k) => k + 1); // force a fresh reel animation each spin
      setReelOpen(true);
    } catch (e) {
      setError(e.message || 'No restaurants to pick from.');
      setStatus('error');
    }
  }, [coords, category]);

  const canSpin = status === 'idle' && restaurants.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Finder</h1>
          <button
            type="button"
            onClick={spin}
            disabled={!canSpin}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            🎰 Surprise me
          </button>
        </header>

        <div className="mb-4">
          <LocationBar status={locStatus} onRetry={request} onUseDefault={useDefault} />
        </div>

        <div className="mb-6">
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>

        <RestaurantList status={status} error={error} restaurants={restaurants} onRetry={load} />
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
```

- [ ] **Step 4: Delete unused CRA assets and their imports**

Run from `frontend/`:
```bash
git rm src/App.css src/logo.svg
```
(These were only referenced by the old `App.js`, which is now replaced. No remaining imports reference them.)

- [ ] **Step 5: Run tests to verify they pass**

Run from `frontend/`:
```bash
npm test -- --watchAll=false src/App.test.js
```
Expected: PASS (2 tests).

- [ ] **Step 6: Run the full test suite**

Run from `frontend/`:
```bash
npm test -- --watchAll=false
```
Expected: all suites PASS.

- [ ] **Step 7: Verify the app builds**

Run from `frontend/`:
```bash
npm run build
```
Expected: "Compiled successfully".

- [ ] **Step 8: Commit**

```bash
git add src/App.js src/App.test.js
git commit -m "feat: wire restaurant finder app together

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Manual verification (after Task 9)

Run `npm start` from `frontend/` and confirm at `http://localhost:3000`:
1. On load, the browser asks for location; restaurants appear.
2. Deny location → amber banner appears; "Use default location" loads SF restaurants.
3. Category chips filter the list; skeletons flash during each load.
4. "Surprise me" opens the reel; it spins, decelerates, lands on a winner, and shows the spotlight card.
5. "Spin again" re-spins; "Close" dismisses the reel.

## Notes for the real-backend swap (future)

In `src/api/restaurants.js`, replace the bodies of `getRestaurants`/`getRandom` with `fetch` calls to `http://localhost:8000`. The backend's CORS currently allows `localhost:5173` (Vite); since this app runs on **port 3000**, update the backend's CORS to allow `http://localhost:3000` (or run the frontend on 5173). Backend responses lack `rating/reviewCount/priceLevel/distanceMi/photo` — either extend the backend or map defaults in the API layer so cards still render.
```
