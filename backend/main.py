from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import httpx
import math
import random
import time
import os

app = FastAPI(title="Nearby Restaurant Finder")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Overpass mirrors tried in order — the first that answers wins. The default
# overpass-api.de instance is frequently overloaded (30s+ responses and 504s),
# so we prefer the much faster openstreetmap.fr mirror and fall back to the
# others. Override the whole list with a comma-separated OVERPASS_API_URLS.
_default_mirrors = (
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)
OVERPASS_URLS = [
    u.strip()
    for u in os.getenv(
        "OVERPASS_API_URLS",
        os.getenv("OVERPASS_API_URL", ",".join(_default_mirrors)),
    ).split(",")
    if u.strip()
]

NOMINATIM_URL = os.getenv("NOMINATIM_URL", "https://nominatim.openstreetmap.org/search")

USER_AGENT = "restaurantFinder/1.0 (https://github.com/tylerhwang333-glitch/restuarantFinder)"

# Category -> Overpass tag filter (OSM amenity/cuisine tags)
CATEGORY_FILTERS = {
    "fast_food": '["amenity"="fast_food"]',
    "fancy": '["amenity"="restaurant"]',
    "cafe": '["amenity"="cafe"]',
    "bar": '["amenity"="bar"]',
    "pizza": '["amenity"~"restaurant|fast_food"]["cuisine"~"pizza"]',
}
# "All" spans every category we support, not just sit-down restaurants.
DEFAULT_FILTER = '["amenity"~"^(restaurant|fast_food|cafe|bar)$"]'

_cache: dict = {}
CACHE_TTL = 300  # seconds


def _build_query(lat: float, lon: float, category: Optional[str], radius: int) -> str:
    if category:
        tag_filter = CATEGORY_FILTERS.get(category)
        if not tag_filter:
            raise HTTPException(status_code=400, detail=f"Unknown category '{category}'")
    else:
        tag_filter = DEFAULT_FILTER

    return (
        "[out:json][timeout:25];\n"
        "(\n"
        f'  node{tag_filter}(around:{radius},{lat},{lon});\n'
        f'  way{tag_filter}(around:{radius},{lat},{lon});\n'
        ");\n"
        "out center tags;"
    )


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _normalize(element: dict, origin_lat: float, origin_lon: float) -> dict:
    tags = element.get("tags", {})
    addr_parts = [
        tags.get("addr:housenumber"),
        tags.get("addr:street"),
        tags.get("addr:city"),
        tags.get("addr:postcode"),
    ]
    address = (
        tags.get("addr:full")
        or " ".join(part for part in addr_parts if part)
        or tags.get("addr:place")
        or None
    )

    # Nodes carry lat/lon directly; ways/relations carry a "center" object
    # since we query with "out center".
    el_lat = element.get("lat") or element.get("center", {}).get("lat")
    el_lon = element.get("lon") or element.get("center", {}).get("lon")
    distance_m = (
        round(_haversine_m(origin_lat, origin_lon, el_lat, el_lon))
        if el_lat is not None and el_lon is not None
        else None
    )

    return {
        "id": f'{element.get("type")}/{element.get("id")}',
        "name": tags["name"],
        "address": address,
        "categories": [tags.get("cuisine") or tags.get("amenity", "restaurant")],
        "open_now": None,  # OSM has no live open/closed signal, only opening_hours strings
        "hours": tags.get("opening_hours"),
        "phone": tags.get("contact:phone") or tags.get("phone"),
        "website": tags.get("contact:website") or tags.get("website"),
        "image": tags.get("image"),
        "lat": el_lat,
        "lon": el_lon,
        "distance_m": distance_m,
    }


async def fetch_restaurants(lat: float, lon: float, category: Optional[str] = None, radius: int = 3000):
    key = (round(lat, 3), round(lon, 3), category, radius)
    cached = _cache.get(key)
    if cached and time.time() - cached["ts"] < CACHE_TTL:
        return cached["data"]

    query = _build_query(lat, lon, category, radius)
    headers = {"User-Agent": USER_AGENT}

    elements = None
    last_error: Optional[Exception] = None
    async with httpx.AsyncClient(timeout=35.0) as client:
        for url in OVERPASS_URLS:
            try:
                resp = await client.post(url, data={"data": query}, headers=headers)
                resp.raise_for_status()
                elements = resp.json().get("elements", [])
                break
            except (httpx.HTTPError, ValueError) as exc:
                # Timeout, 429/504, or malformed body — move on to the next mirror.
                last_error = exc
                continue

    if elements is None:
        raise HTTPException(
            status_code=503,
            detail="All map data providers are busy right now. Please try again in a moment.",
        ) from last_error

    # De-dupe by OSM id (a node and its containing way can both match the
    # same filter) and sort by distance so results are stable and ordered
    # nearest-first, regardless of the order Overpass happens to return.
    by_id = {}
    for el in elements:
        if not el.get("tags", {}).get("name"):
            continue
        record = _normalize(el, lat, lon)
        by_id[record["id"]] = record

    results = sorted(
        by_id.values(),
        key=lambda r: (r["distance_m"] is None, r["distance_m"] or 0, r["name"]),
    )

    _cache[key] = {"ts": time.time(), "data": results}
    return results


@app.get("/restaurants")
async def list_restaurants(
    lat: float = Query(...),
    lon: float = Query(...),
    category: Optional[str] = Query(None, description="fast_food, fancy, cafe, bar, pizza"),
):
    return await fetch_restaurants(lat, lon, category)


@app.get("/restaurants/random")
async def random_restaurant(
    lat: float = Query(...),
    lon: float = Query(...),
    category: Optional[str] = Query(None),
):
    places = await fetch_restaurants(lat, lon, category)
    if not places:
        raise HTTPException(status_code=404, detail="No restaurants found nearby")
    return random.choice(places)


@app.get("/geocode")
async def geocode(q: str = Query(..., min_length=1, description="ZIP code or place name")):
    """Resolve a ZIP code or place name to coordinates via OSM Nominatim."""
    params = {"q": q, "format": "json", "limit": 1, "addressdetails": 1}
    headers = {"User-Agent": USER_AGENT}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(NOMINATIM_URL, params=params, headers=headers)
            resp.raise_for_status()
            results = resp.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail="Location lookup is unavailable right now.") from exc

    if not results:
        raise HTTPException(status_code=404, detail=f"Couldn't find a location for '{q}'.")

    top = results[0]
    addr = top.get("address", {})
    # Build a short, friendly label (e.g. "94103, San Francisco") rather than
    # Nominatim's very long display_name.
    parts = [
        addr.get("postcode"),
        addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county"),
        addr.get("state"),
    ]
    label = ", ".join(dict.fromkeys(p for p in parts if p)) or top.get("display_name")
    return {"lat": float(top["lat"]), "lon": float(top["lon"]), "label": label}
