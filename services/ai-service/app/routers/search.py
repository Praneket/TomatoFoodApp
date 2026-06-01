from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

class SearchRequest(BaseModel):
    query: str
    userId: Optional[str] = None
    city: Optional[str] = None

# Intent detection for natural language food search
INTENT_MAP = {
    "spicy":      {"tags": ["spicy"], "boost": "rating"},
    "healthy":    {"tags": ["healthy", "salad", "low-calorie"], "isVeg": True},
    "veg":        {"isVeg": True},
    "vegetarian": {"isVeg": True},
    "cheap":      {"sort": "price_asc", "maxPrice": 200},
    "budget":     {"sort": "price_asc", "maxPrice": 200},
    "fast":       {"sort": "delivery_time"},
    "quick":      {"sort": "delivery_time"},
    "popular":    {"sort": "popular"},
    "trending":   {"sort": "popular"},
    "new":        {"sort": "new"},
    "best":       {"sort": "rating"},
    "top":        {"sort": "rating"},
}

CUISINE_MAP = {
    "indian": "Indian", "chinese": "Chinese", "italian": "Italian",
    "mexican": "Mexican", "thai": "Thai", "japanese": "Japanese",
    "pizza": "Italian", "biryani": "Indian", "sushi": "Japanese",
    "burger": "American", "pasta": "Italian", "tacos": "Mexican",
}

def parse_query(query: str) -> dict:
    lower = query.lower()
    params = {"search": query, "sort": "popular"}

    for keyword, intent in INTENT_MAP.items():
        if keyword in lower:
            params.update(intent)

    for keyword, cuisine in CUISINE_MAP.items():
        if keyword in lower:
            params["cuisine"] = cuisine
            break

    return params

@router.get("/")
async def smart_search(q: str = Query(..., min_length=1), userId: Optional[str] = None):
    parsed = parse_query(q)
    return {
        "success": True,
        "data": {
            "query": q,
            "parsedIntent": parsed,
            "message": f"Searching for '{q}' with smart filters applied",
        },
    }

@router.post("/nlp")
async def nlp_search(req: SearchRequest):
    parsed = parse_query(req.query)
    suggestions = generate_suggestions(req.query)
    return {
        "success": True,
        "data": {
            "query": req.query,
            "parsedParams": parsed,
            "suggestions": suggestions,
        },
    }

def generate_suggestions(query: str) -> List[str]:
    base = query.lower()
    suggestions = [query]
    if "pizza" in base:
        suggestions += ["Margherita Pizza", "Pepperoni Pizza", "BBQ Chicken Pizza"]
    elif "burger" in base:
        suggestions += ["Classic Burger", "Cheese Burger", "Veggie Burger"]
    elif "biryani" in base:
        suggestions += ["Chicken Biryani", "Mutton Biryani", "Veg Biryani"]
    return suggestions[:5]
