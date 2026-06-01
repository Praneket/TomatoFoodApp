from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
from app.routers import recommendations, chatbot, sentiment, search

load_dotenv()

app = FastAPI(
    title="Tomato AI Service",
    description="AI-powered features: recommendations, chatbot, sentiment analysis, smart search",
    version="1.0.0",
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router, prefix="/api/ai/recommendations", tags=["Recommendations"])
app.include_router(chatbot.router,         prefix="/api/ai/chat",            tags=["Chatbot"])
app.include_router(sentiment.router,       prefix="/api/ai/sentiment",       tags=["Sentiment"])
app.include_router(search.router,          prefix="/api/ai/search",          tags=["Smart Search"])

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-service"}

@app.get("/")
async def root():
    return {"name": "Tomato AI Service", "version": "1.0.0"}
