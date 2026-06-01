from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import httpx

router = APIRouter()

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    userId: Optional[str] = None

SYSTEM_PROMPT = """You are Tomato AI, a helpful food delivery assistant for the Tomato platform.
You help customers with:
- Food recommendations based on preferences, mood, or dietary needs
- Restaurant suggestions by cuisine, location, or rating
- Order tracking and status updates
- Coupon and offer information
- Nutritional information about food items
- Allergy and dietary restriction guidance

Be friendly, concise, and food-focused. If asked about non-food topics, politely redirect to food-related assistance.
Always respond in the same language the user writes in."""

async def call_openai(messages: list) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        # Fallback responses when no API key
        return get_fallback_response(messages[-1]["content"] if messages else "")

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + messages,
                "max_tokens": 500,
                "temperature": 0.7,
            },
        )
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service unavailable")
        data = response.json()
        return data["choices"][0]["message"]["content"]

def get_fallback_response(user_message: str) -> str:
    msg = user_message.lower()
    if any(w in msg for w in ["recommend", "suggest", "what should"]):
        return "I'd recommend trying our trending Butter Chicken Biryani or the Classic Margherita Pizza! Both are highly rated by customers in your area. 🍕🍛"
    if any(w in msg for w in ["track", "order", "status", "where"]):
        return "You can track your order in real-time on the 'My Orders' page. Your delivery partner's location will be shown on the map once they pick up your order! 📍"
    if any(w in msg for w in ["coupon", "discount", "offer", "promo"]):
        return "Use code **WELCOME10** for 10% off your first order, or **FLAT50** for ₹50 off on orders above ₹200! 🎉"
    if any(w in msg for w in ["veg", "vegetarian", "vegan"]):
        return "We have a great selection of vegetarian options! Filter by 'Veg Only' on the menu to see all plant-based dishes. 🥗"
    return "Hi! I'm Tomato AI, your food assistant. I can help you with food recommendations, order tracking, and finding the best deals. What can I help you with today? 🍅"

@router.post("/")
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    reply = await call_openai(messages)
    return {"success": True, "data": {"reply": reply, "role": "assistant"}}
