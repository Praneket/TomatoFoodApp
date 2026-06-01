#!/bin/bash
# ============================================================
# TOMATO PLATFORM - Quick Start Script (Linux/Mac)
# ============================================================

set -e

echo ""
echo "🍅 TOMATO PLATFORM - Starting up..."
echo "============================================================"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

echo ""
echo "[1/5] Starting databases..."
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d postgres mongo redis rabbitmq

echo ""
echo "[2/5] Waiting for databases to be healthy (30s)..."
sleep 30

echo ""
echo "[3/5] Starting all microservices..."
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d \
    api-gateway auth-service user-service restaurant-service \
    catalog-service cart-service order-service payment-service \
    delivery-service notification-service review-service analytics-service

echo ""
echo "[4/5] Starting frontend apps..."
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d \
    customer-app admin-panel delivery-app

echo ""
echo "[5/5] Running DB migration and seeding..."
sleep 15
docker exec tomato-auth-service npx prisma db push --accept-data-loss 2>/dev/null || true
cd scripts && npm install --silent 2>/dev/null && node seed.js
cd ..

echo ""
echo "============================================================"
echo "✅ Platform is running!"
echo "============================================================"
echo ""
echo "  Customer App  : http://localhost:5173"
echo "  Admin Panel   : http://localhost:5174"
echo "  Delivery App  : http://localhost:5175"
echo "  API Gateway   : http://localhost:3000"
echo "  API Docs      : http://localhost:3000/api/docs"
echo "  RabbitMQ UI   : http://localhost:15672  (guest/guest)"
echo ""
echo "  Test Accounts:"
echo "    Customer  : customer@tomato.com  / Password123!"
echo "    Admin     : admin@tomato.com     / Admin123!"
echo "    Owner     : owner@tomato.com     / Owner123!"
echo "    Delivery  : delivery@tomato.com  / Delivery123!"
echo ""
echo "  To stop: docker compose -f infrastructure/docker/docker-compose.dev.yml down"
echo "============================================================"
