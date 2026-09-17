from fastapi import FastAPI, HTTPException, Query
from typing import Optional
import httpx
import random
import time
import os
from dotenv import load_dotenv

app = FastAPI(title="Nearby Restaurant Finder")

load_dotenv()
FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY")  # store in an env var in real use
FSQ_BASE_URL = "https://places-api.foursquare.com/places/search"

# Foursquare category IDs (subset) - full list: https://location.foursquare.com/places/docs/categories
CATEGORY_MAP = {
    "fast_food": "13145",
    "fancy": "13065",       # Fine Dining
    "cafe": "13032",
    "bar": "13003",
    "pizza": "13064",
}

_cache: dict = {}
CACHE_TTL = 300  # seconds

async def fetch_restaurants(lat: float, lon: float, category: Optional[str] = None, radius: int = 3000):
    key = (round(lat, 3), round(lon, 3), category, radius)
    cached = _cache.get(key)
    if cached and time.time() - cached["ts"] < CACHE_TTL:
        return cached["data"]
    
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {FOURSQUARE_API_KEY}",
        "X-Places-Api-Version": "2025-06-17",
    }
    params = {
        "ll": f"{lat},{lon}",
        "radius": radius,
        "categories": "13065",  # base "Restaurant" category, tweak as needed
        "limit": 50,
        "fields": "fsq_place_id,name,location,categories,hours"
    }
    if category:
        cat_id = CATEGORY_MAP.get(category)
        if not cat_id:
            raise HTTPException(status_code=400, detail=f"Unknown category '{category}'")
        params["categories"] = cat_id

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(FSQ_BASE_URL, headers=headers, params=params)
        print("STATUS:", resp.status_code)
        print("HEADERS:", dict(resp.headers))
        print("BODY:", resp.text)
        resp.raise_for_status()
        results = resp.json().get("results", [])

    _cache[key] = {"ts": time.time(), "data": results}
    return results


@app.get("/restaurants")
async def list_restaurants(
    lat: float = Query(...),
    lon: float = Query(...),
    category: Optional[str] = Query(None, description="fast_food, fancy, cafe, bar, pizza"),
):
    places = await fetch_restaurants(lat, lon, category)
    return [
    {
        "name": p["name"],
        "address": p.get("location", {}).get("formatted_address"),
        "categories": [c["name"] for c in p.get("categories", [])],
        "open_now": p.get("hours", {}).get("open_now"),
        "hours": p.get("hours", {}).get("display"),
    }
    for p in places
]


@app.get("/restaurants/random")
async def random_restaurant(
    lat: float = Query(...),
    lon: float = Query(...),
    category: Optional[str] = Query(None),
):
    places = await fetch_restaurants(lat, lon, category)
    if not places:
        raise HTTPException(status_code=404, detail="No restaurants found nearby")
    choice = random.choice(places)
    return {
        "name": choice["name"],
        "address": choice.get("location", {}).get("formatted_address"),
        "category": category or "all",
    }