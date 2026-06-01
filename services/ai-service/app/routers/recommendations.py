from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter()

class RecommendationRequest(BaseModel):
    userId: str
    restaurantId: Optional[str] = None
    limit: int = 10

class FoodRecommendation(BaseModel):
    foodId: str
    name: str
    score: float
    reason: str

# Collaborative filtering simulation
# In production: use real ML model trained on order history
def get_recommendations(user_id: str, limit: int = 10):
    # Placeholder: return trending items with personalization score
    # Real implementation: cosine similarity on user-item matrix
    categories = ["Biryani", "Pizza", "Burger", "Sushi", "Pasta", "Tacos", "Salad", "Dessert"]
    recommendations = []
    for i in range(limit):
        recommendations.append({
            "foodId": f"food_{random.randint(1, 100)}",
            "name": f"{random.choice(categories)} Special",
            "score": round(random.uniform(0.7, 1.0), 2),
            "reason": random.choice([
                "Based on your order history",
                "Popular in your area",
                "Frequently ordered together",
                "Trending this week",
                "You might like this",
            ]),
        })
    return sorted(recommendations, key=lambda x: x["score"], reverse=True)

@router.post("/personalized")
async def get_personalized_recommendations(req: RecommendationRequest):
    recs = get_recommendations(req.userId, req.limit)
    return {"success": True, "data": {"recommendations": recs, "userId": req.userId}}

@router.get("/trending")
async def get_trending(limit: int = Query(default=10, le=50)):
    # In production: aggregate from order DB sorted by totalOrders in last 7 days
    trending = [
        {"foodId": f"food_{i}", "name": f"Trending Item {i}", "orders": random.randint(100, 1000), "score": round(random.uniform(0.8, 1.0), 2)}
        for i in range(1, limit + 1)
    ]
    return {"success": True, "data": {"trending": sorted(trending, key=lambda x: x["orders"], reverse=True)}}

@router.get("/frequently-bought-together/{foodId}")
async def get_frequently_bought_together(foodId: str, limit: int = Query(default=5, le=10)):
    # In production: association rule mining (Apriori/FP-Growth) on order items
    suggestions = [
        {"foodId": f"food_{i}", "name": f"Goes well with item {i}", "confidence": round(random.uniform(0.5, 0.95), 2)}
        for i in range(1, limit + 1)
    ]
    return {"success": True, "data": {"foodId": foodId, "suggestions": suggestions}}
