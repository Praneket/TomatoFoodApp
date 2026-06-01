@echo off
REM ============================================================
REM TOMATO PLATFORM - Quick Start Script (Windows)
REM ============================================================

echo.
echo  ████████╗ ██████╗ ███╗   ███╗ █████╗ ████████╗ ██████╗
echo     ██╔══╝██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝██╔═══██╗
echo     ██║   ██║   ██║██╔████╔██║███████║   ██║   ██║   ██║
echo     ██║   ██║   ██║██║╚██╔╝██║██╔══██║   ██║   ██║   ██║
echo     ██║   ╚██████╔╝██║ ╚═╝ ██║██║  ██║   ██║   ╚██████╔╝
echo     ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝    ╚═════╝
echo.
echo  Food Delivery Platform - Starting up...
echo  ============================================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not running.
    echo         Please install Docker Desktop from https://docker.com
    pause
    exit /b 1
)

echo [1/5] Starting databases...
docker compose -f infrastructure/docker/docker-compose.dev.yml --env-file .env up -d postgres mongo redis rabbitmq
if %errorlevel% neq 0 goto :error

echo.
echo [2/5] Waiting for databases to be healthy (30s)...
ping -n 31 127.0.0.1 > nul

echo.
echo [3/5] Starting all microservices...
docker compose -f infrastructure/docker/docker-compose.dev.yml --env-file .env up -d ^
    api-gateway auth-service user-service restaurant-service ^
    catalog-service cart-service order-service payment-service ^
    delivery-service notification-service review-service analytics-service
if %errorlevel% neq 0 goto :error

echo.
echo [4/5] Starting frontend apps...
docker compose -f infrastructure/docker/docker-compose.dev.yml --env-file .env up -d customer-app admin-panel delivery-app
if %errorlevel% neq 0 goto :error

echo.
echo [5/5] Running Prisma DB migration and seeding data...
ping -n 16 127.0.0.1 > nul
docker exec tomato-auth-service npx prisma db push --accept-data-loss >nul 2>&1
cd scripts && npm install --silent >nul 2>&1 && node seed.js
cd ..

echo.
echo  ============================================================
echo  Platform is running!
echo  ============================================================
echo.
echo  Customer App   : http://localhost:5173
echo  Admin Panel    : http://localhost:5174
echo  Delivery App   : http://localhost:5175
echo  API Gateway    : http://localhost:3000
echo  API Docs       : http://localhost:3000/api/docs
echo  RabbitMQ UI    : http://localhost:15672  (guest/guest)
echo.
echo  Test Accounts:
echo    Customer  : customer@tomato.com  / Password123!
echo    Admin     : admin@tomato.com     / Admin123!
echo    Owner     : owner@tomato.com     / Owner123!
echo    Delivery  : delivery@tomato.com  / Delivery123!
echo.
echo  To stop: docker compose -f infrastructure/docker/docker-compose.dev.yml --env-file .env down
echo  ============================================================
goto :end

:error
echo.
echo [ERROR] Something went wrong. Check Docker logs:
echo   docker compose -f infrastructure/docker/docker-compose.dev.yml logs
pause
exit /b 1

:end
pause
