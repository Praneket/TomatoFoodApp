from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class SentimentRequest(BaseModel):
    text: str
    reviewId: Optional[str] = None

POSITIVE_WORDS = {"great","excellent","amazing","delicious","love","perfect","best","wonderful","fantastic","good","tasty","fresh","hot","crispy","juicy","flavorful","quick","friendly","clean"}
NEGATIVE_WORDS = {"bad","terrible","awful","horrible","worst","disgusting","cold","late","wrong","poor","disappointing","stale","rude","slow","dirty","overpriced","bland","soggy"}

def analyze(text: str) -> dict:
    words = set(text.lower().split())
    pos = len(words & POSITIVE_WORDS)
    neg = len(words & NEGATIVE_WORDS)
    total = pos + neg or 1
    if pos > neg:
        return {"sentiment": "positive", "score": round(pos / total, 2), "confidence": round(0.6 + (pos / total) * 0.4, 2)}
    if neg > pos:
        return {"sentiment": "negative", "score": round(-neg / total, 2), "confidence": round(0.6 + (neg / total) * 0.4, 2)}
    return {"sentiment": "neutral", "score": 0.0, "confidence": 0.5}

@router.post("/analyze")
async def analyze_sentiment(req: SentimentRequest):
    result = analyze(req.text)
    return {"success": True, "data": {**result, "text": req.text[:100]}}

@router.post("/batch")
async def batch_analyze(texts: List[str]):
    results = [{"text": t[:100], **analyze(t)} for t in texts]
    return {"success": True, "data": {"results": results, "count": len(results)}}
