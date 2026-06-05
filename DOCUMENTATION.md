# 🍅 Tomato — Full-Stack Food Delivery Platform

> Production-ready microservices food delivery platform built with Node.js, React, MongoDB, PostgreSQL, Redis, RabbitMQ, and Python FastAPI.

**Live Demo:** https://tomato-customer.vercel.app  
**API Gateway:** https://tomato-api-gateway.onrender.com  
**API Docs:** https://tomato-api-gateway.onrender.com/api/docs

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Design (HLD)](#2-high-level-design-hld)
3. [Low-Level Design (LLD)](#3-low-level-design-lld)
4. [Services Deep Dive](#4-services-deep-dive)
5. [Key Design Patterns](#5-key-design-patterns)
6. [Database Design](#6-database-design)
7. [Security Architecture](#7-security-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Infrastructure & Deployment](#9-infrastructure--deployment)
10. [API Reference Summary](#10-api-reference-summary)

---

## 1. Project Overview

Tomato is a full-stack food delivery platform that mirrors production-grade systems like Zomato and Swiggy. It is built using a **microservices architecture** where each business domain is an independent deployable service communicating over HTTP (sync) and RabbitMQ (async/events).

### Core Features

| Feature | Description |
|---------|-------------|
| User Auth | JWT + Google OAuth, OTP email verification, RBAC |
| Restaurant Discovery | Search, filter by cuisine/city, ratings |
| Food Catalog | Trending items, categories, full-text search |
| Cart | Redis-backed cart with coupon support, in-memory fallback |
| Order Management | Full order lifecycle with Saga pattern |
| Payments | Stripe, Razorpay, Cash on Delivery |
| Real-time Tracking | Socket.IO order status updates |
| Notifications | Email (Nodemailer) + SMS (Twilio) via RabbitMQ |
| Reviews | Ratings, sentiment analysis, owner replies |
| Analytics | Revenue, sales trends, customer insights |
| AI Features | GPT-3.5 chatbot, recommendations, smart search |
| Delivery Tracking | Partner management, live GPS updates |

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Redux Toolkit, Framer Motion |
| API Gateway | Node.js, Express, http-proxy-middleware |
| Auth | Node.js, Prisma ORM, PostgreSQL (Neon), Passport.js |
| Core Services | Node.js, Express, MongoDB (Atlas), Mongoose |
| Cache/Cart | Redis (Upstash) |
| Message Broker | RabbitMQ (CloudAMQP) |
| AI Service | Python, FastAPI, OpenAI GPT-3.5 |
| Deployment | Render (backend), Vercel (frontend) |
| CI/CD | GitHub Actions |

---

## 2. High-Level Design (HLD)

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                               │
│   Customer App (Vercel)    Admin Panel (Vercel)                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼─────────────────────────────────────┐
│                  API GATEWAY  :3000                                │
│  • Rate Limiting (express-rate-limit)                             │
│  • JWT Auth Middleware                                            │
│  • Reverse Proxy (http-proxy-middleware v3)                       │
│  • Request ID injection                                           │
│  • Morgan logging                                                 │
└──┬───┬───┬───┬───┬───┬───┬───┬───┬───┬──────────────────────────┘
   │   │   │   │   │   │   │   │   │   │
  3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 8000
  Auth User Rest Cat  Cart Ord  Pay  Del  Notif Rev  Ana  AI
   │   │   │   │   │   │   │   │   │   │
┌──▼───▼───▼───▼───▼───▼───▼───▼───▼───▼──────────────────────────┐
│               MESSAGE BROKER (RabbitMQ)                           │
│         Topic Exchange: tomato_events                             │
│   order.placed → [payment, notification, restaurant]             │
│   payment.success → [order, notification]                        │
│   user.registered → [notification]                               │
│   delivery.assigned → [order, notification]                      │
└──────────────────────────────────────────────────────────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL   │  │   MongoDB    │  │    Redis     │
│  (Neon)       │  │   (Atlas)    │  │  (Upstash)   │
│  Auth: users  │  │  6 databases │  │  Cart, Cache │
│  sessions     │  │  per service │  │  TTL 7 days  │
│  otp_codes    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### HLD Principles Applied

**1. Service Independence**  
Each service owns its database. The restaurant-service connects to `tomato_restaurants`, the catalog-service to `tomato_catalog`, the order-service to `tomato_orders`, etc. No service queries another service's database directly.

**2. Synchronous vs Asynchronous Communication**
- Sync (HTTP via Gateway): User-facing requests — login, browse restaurants, view catalog
- Async (RabbitMQ): Side-effects that should not block the response — send email, update analytics, trigger delivery assignment

**3. Single Entry Point**  
All client traffic enters through the API Gateway on port 3000. The gateway handles auth, rate limiting, and request routing. Internal services are not exposed publicly.

**4. Resilience**  
- Services start their HTTP server immediately and connect to MongoDB in the background
- If Redis is unavailable, cart-service falls back to in-memory storage
- If RabbitMQ is unavailable, event publishing is skipped with a warning (non-blocking)
- Proxy errors return 503 instead of crashing the gateway

---

## 3. Low-Level Design (LLD)

### 3.1 API Gateway — Request Lifecycle

```
Incoming Request
      │
      ▼
trust proxy (1) ← Render sits behind load balancer
      │
      ▼
CORS middleware ← origin: true, credentials: true
      │
      ▼
Rate Limiter ← 500 req/15min global, 50 req/15min auth
      │
      ▼
Request ID injection (UUID v4 or X-Request-ID header)
      │
      ▼
Morgan logging
      │
      ├── /api/auth/*         → authLimiter → proxy(AUTH_SERVICE)
      ├── /api/catalog/*      → proxy(CATALOG_SERVICE)
      ├── /api/restaurants/public/* → proxy(RESTAURANT_SERVICE)
      ├── /api/payments/webhook → raw body → proxy(PAYMENT_SERVICE)
      │
      ├── [protected routes]
      │     authMiddleware() → JWT verify → set req.user
      │         │
      │         ├── /api/users/*    → proxy(USER_SERVICE)
      │         ├── /api/cart/*     → proxy(CART_SERVICE)
      │         ├── /api/orders/*   → proxy(ORDER_SERVICE)
      │         ├── /api/payments/* → paymentLimiter → proxy(PAYMENT_SERVICE)
      │         └── ...
      │
      ▼
proxyReq handler:
  - Sets proxyReq.path = req.originalUrl  ← restores full path (HPM v3 strips prefix)
  - Sets X-Request-ID, X-Forwarded-For
  - Sets X-User-ID, X-User-Role (from decoded JWT)
  - Does NOT parse body ← raw stream passes through untouched
```

**Critical design decision — no body parsing on proxy routes:**  
`express.json()` consumes the readable stream. If the gateway parses the body, the proxy has nothing to forward. The gateway skips body parsing for all `/api/*` routes and lets `http-proxy-middleware` stream the raw body directly to the downstream service.

### 3.2 Auth Service — JWT Flow

```
Register:
  validate input → check duplicate → bcrypt.hash(12) → prisma.user.create
  → createOtp(EMAIL_VERIFICATION) → sendVerificationEmail (non-blocking)
  → publishEvent('user.registered') (non-blocking)
  → return 201

Login:
  validate → prisma.user.findUnique → bcrypt.compare
  → generateAccessToken(user) ← JWT, 15min, RS256
  → generateRefreshToken() ← crypto.randomUUID, stored in sessions table
  → saveRefreshToken(userId, token, userAgent, ip)
  → return { accessToken, refreshToken, user }

Token Refresh:
  find session by refreshToken → check expiry
  → delete old session → create new session (rotation)
  → return new { accessToken, refreshToken }
```

**Token Rotation:** Every refresh invalidates the old refresh token and issues a new one. This prevents refresh token reuse attacks.

### 3.3 Order Service — Saga Pattern

The Saga pattern is used to manage distributed transactions across payment, delivery, and notification services without a two-phase commit.

```
placeOrder()
  │
  ▼
Order.create() — status: 'pending', sagaState: 'ORDER_CREATED'
  │
  ▼
new OrderSaga(order).execute()  ← runs async, does NOT block response
  │
  ├─ step_reserveInventory()
  │    → sagaState: 'RESERVING_INVENTORY'
  │    → publish 'order.placed' to RabbitMQ
  │    → completedSteps.push('RESERVE_INVENTORY')
  │
  ├─ step_processPayment()
  │    → sagaState: 'PROCESSING_PAYMENT'
  │    → publish 'payment.initiated'
  │    → completedSteps.push('PROCESS_PAYMENT')
  │
  ├─ step_assignDelivery()
  │    → sagaState: 'ASSIGNING_DELIVERY'
  │    → publish 'delivery.assign_request'
  │    → completedSteps.push('ASSIGN_DELIVERY')
  │
  ├─ step_notifyParties()
  │    → sagaState: 'NOTIFYING'
  │    → publish 'notification.order_placed'
  │    → completedSteps.push('NOTIFY')
  │
  └─ sagaState: 'SAGA_COMPLETED'

On failure at any step → compensate():
  Reverse through completedSteps:
    NOTIFY           → no-op
    ASSIGN_DELIVERY  → publish 'delivery.cancel'
    PROCESS_PAYMENT  → publish 'payment.refund'
    RESERVE_INVENTORY → publish 'inventory.release'
  → Order.status = 'cancelled', sagaState = 'SAGA_FAILED'
```

### 3.4 Cart Service — Redis with In-Memory Fallback

```javascript
// getRedisOrMem() — transparent fallback
const getRedisOrMem = () => {
  const redis = getRedis();
  if (redis) return redis;
  return {
    get:   (k)        => Promise.resolve(memStore.get(k) ?? null),
    setEx: (k, _t, v) => { memStore.set(k, v); return Promise.resolve(); },
    del:   (k)        => { memStore.delete(k); return Promise.resolve(); },
  };
};
```

Cart data is stored as a JSON string under key `cart:{userId}` with TTL of 7 days. The in-memory Map is used when Redis is unavailable (e.g., cold start or connection failure on Render free tier).

### 3.5 Notification Service — RabbitMQ Consumer

```
startConsumer():
  connect to RabbitMQ → createChannel
  → assertExchange('tomato_events', 'topic', { durable: true })
  → assertQueue('notification_service_queue', { durable: true })
  → bindQueue to routing keys:
      user.registered, order.placed, order.delivered,
      order.cancelled, payment.success, payment.failed,
      notification.email, notification.sms, ...

  On message:
    parse JSON → match routing key → select handler
    → sendEmail() or sendSMS()
    → ch.ack(msg) on success
    → ch.nack(msg, false, false) on error ← discard, no requeue
```

**Dead Letter Queue pattern:** Failed messages are nack'd without requeue to prevent poison messages from blocking the queue in an infinite retry loop.

### 3.6 Real-time Order Tracking — Socket.IO

```
Client connects → provides JWT in handshake.auth.token
  → socket.user = jwt.verify(token)
  → socket.join('user_{userId}')   ← personal room

Client emits 'join:order' with orderId
  → socket.join('order_{orderId}')  ← order room

When order status changes (updateOrderStatus):
  → io.to('order_{orderId}').emit('order:status_update', {...})
  → io.to('user_{userId}').emit('order:status_update', {...})

Delivery partner emits 'driver:location' with { orderId, lat, lng }
  → io.to('order_{orderId}').emit('driver:location_update', {...})
```

---

## 4. Services Deep Dive

### Auth Service (Port 3001)
**Stack:** Node.js, Express, Prisma, PostgreSQL (Neon), Redis, Passport.js  
**Database:** PostgreSQL — `users`, `sessions`, `otp_codes`

| Function | Description |
|----------|-------------|
| `register` | Validates input, hashes password (bcrypt, 12 rounds), creates user, sends OTP email |
| `login` | Verifies credentials, issues JWT access + refresh token pair |
| `refreshToken` | Rotates refresh token — invalidates old, issues new |
| `verifyEmail` | Validates OTP, marks `isVerified: true` |
| `forgotPassword` | Sends OTP to email (always returns 200 to prevent enumeration) |
| `googleCallback` | Passport.js Google OAuth callback, issues JWT and redirects to frontend |

### User Service (Port 3002)
**Stack:** Node.js, Express, MongoDB  
Manages user profiles, saved addresses, and favorites. Receives `user.registered` events from RabbitMQ to create a corresponding profile record.

### Restaurant Service (Port 3003)
**Stack:** Node.js, Express, MongoDB, Redis  
**Database:** `tomato_restaurants`

| Function | Description |
|----------|-------------|
| `getPublicRestaurants` | Paginated listing with filters (city, cuisine, category), Redis cached 5min |
| `getPublicRestaurantById` | Single restaurant with full menu, Redis cached 5min |
| `createRestaurant` | Restaurant owner creates their restaurant (one per owner) |
| `addMenuItem` | Adds item to embedded `menu` array |
| `toggleOpen` | Flips `isOpen` boolean |
| `verifyRestaurant` | Admin sets `isVerified: true, isActive: true` |

### Catalog Service (Port 3004)
**Stack:** Node.js, Express, MongoDB, Redis  
**Database:** `tomato_catalog`  
Serves the food item catalog independently from restaurants. Supports trending items, category listing, and full-text search.

### Cart Service (Port 3005)
**Stack:** Node.js, Express, Redis  
Stateless service — all state lives in Redis. Cart key: `cart:{userId}`. Handles restaurant conflict detection (items from different restaurants), coupon application, and totals calculation (subtotal + delivery fee + 5% tax − discount).

### Order Service (Port 3006)
**Stack:** Node.js, Express, MongoDB, Socket.IO  
**Database:** `tomato_orders`  
Core transactional service. Implements the Saga orchestration pattern. Generates order ID in format `TOM-{timestamp}-{random}`. Validates status transitions (e.g., `preparing → ready` is valid, `pending → delivered` is not). Generates PDF invoices using PDFKit.

### Payment Service (Port 3007)
**Stack:** Node.js, Express, MongoDB  
**Database:** `tomato_payments`  
Supports three payment gateways: Stripe (card), Razorpay (UPI/cards), and COD. Stripe webhook handler uses raw body for signature verification (`stripe.webhooks.constructEvent`).

### Delivery Service (Port 3008)
**Stack:** Node.js, Express, MongoDB  
**Database:** `tomato_delivery`  
Manages delivery partner onboarding, availability toggling, and order assignment. Listens to `delivery.assign_request` events from RabbitMQ.

### Notification Service (Port 3009)
**Stack:** Node.js, Express, Nodemailer, Twilio, RabbitMQ  
Pure event consumer — no database. Gracefully degrades: if SMTP credentials are missing, emails are mocked to console. If Twilio is not configured, SMS is mocked. Retries RabbitMQ connection every 5 seconds on failure.

### Review Service (Port 3010)
**Stack:** Node.js, Express, MongoDB  
**Database:** `tomato_reviews`  
Customers leave reviews after delivery. Owners can reply. Users can mark reviews as helpful. Sentiment scoring is delegated to the AI service.

### Analytics Service (Port 3011)
**Stack:** Node.js, Express, MongoDB (aggregation pipeline)  
Provides platform-wide, restaurant-level, and customer-level analytics using MongoDB `$group`, `$match`, `$sort` aggregation stages. Access restricted to `admin` and `restaurant_owner` roles.

### AI Service (Port 8000)
**Stack:** Python, FastAPI, OpenAI  
Four routers:

| Router | Path | Description |
|--------|------|-------------|
| Chatbot | `/api/ai/chat` | GPT-3.5 powered food assistant |
| Recommendations | `/api/ai/recommendations/personalized` | Collaborative filtering |
| Sentiment | `/api/ai/sentiment` | Review sentiment scoring |
| Search | `/api/ai/search` | NLP query understanding |

---

## 5. Key Design Patterns

### 5.1 Saga Pattern (Distributed Transaction)

**Problem:** Placing an order requires actions across 4 services (restaurant inventory, payment, delivery, notification). A failure in step 3 should undo steps 1 and 2.

**Solution:** `OrderSaga` class maintains a `completedSteps` array. On failure, it iterates in reverse and calls the compensation function for each completed step.

```javascript
// OrderSaga.compensate() — reverse rollback
for (const step of [...this.completedSteps].reverse()) {
  await compensations[step]();
}
```

### 5.2 Event-Driven Architecture (Topic Exchange)

RabbitMQ uses a **topic exchange** (`tomato_events`) so multiple services can consume the same event independently:

```
order.placed  →  payment-service (charge card)
              →  notification-service (send email)
              →  restaurant-service (update dashboard)
```

Each service binds its own durable queue to the routing keys it cares about. If a service is down, messages queue up and are consumed when it recovers.

### 5.3 API Gateway Pattern

Single ingress point that handles:
- **Authentication:** JWT verification, attaches `req.user`
- **Authorization:** Role-based access (`allowedRoles` array)
- **Rate Limiting:** Global (500/15min) + per-route (auth: 50/15min, payment: 10/min)
- **Reverse Proxy:** `http-proxy-middleware` with path restoration
- **Request Tracing:** UUID injection via `X-Request-ID` header

### 5.4 Repository Pattern (Mongoose Models)

Each service defines its own Mongoose models, even if they overlap (e.g., a lean `User` model in the cart service just for userId lookup). This maintains service autonomy — no cross-service model imports.

### 5.5 Circuit Breaker (Soft)

The gateway's proxy error handler returns 503 immediately without retrying, preventing cascade failures:

```javascript
on: {
  error: (err, req, res) => {
    if (res.headersSent) return;
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
}
```

### 5.6 Database per Service

| Service | Database | Why |
|---------|----------|-----|
| Auth | PostgreSQL (Neon) | ACID transactions, relational sessions |
| Cart | Redis | TTL support, O(1) get/set, no persistence needed |
| Restaurants | MongoDB `tomato_restaurants` | Flexible schema, embedded menus |
| Catalog | MongoDB `tomato_catalog` | Full-text search indexes |
| Orders | MongoDB `tomato_orders` | Rich nested documents, status history array |
| Payments | MongoDB `tomato_payments` | Flexible payment provider schemas |

---

## 6. Database Design

### PostgreSQL — Auth Service (Prisma Schema)

```
users
  id            UUID PK
  name          String
  email         String UNIQUE
  phone         String UNIQUE
  passwordHash  String
  role          Enum(CUSTOMER, RESTAURANT_OWNER, DELIVERY_PARTNER, ADMIN, SUPER_ADMIN)
  isVerified    Boolean default false
  isActive      Boolean default true
  googleId      String UNIQUE
  loyaltyPoints Int default 0
  referralCode  String UNIQUE
  createdAt     DateTime

sessions
  id            UUID PK
  userId        FK → users.id CASCADE DELETE
  refreshToken  String UNIQUE
  deviceInfo    String
  ipAddress     String
  expiresAt     DateTime

otp_codes
  id        UUID PK
  userId    FK → users.id CASCADE DELETE
  code      String
  type      Enum(EMAIL_VERIFICATION, PHONE_VERIFICATION, PASSWORD_RESET, TWO_FACTOR)
  expiresAt DateTime
  used      Boolean default false
```

### MongoDB — Order Schema (Key Fields)

```
orders
  orderId           String UNIQUE  (TOM-{timestamp}-{rand})
  userId            String  (indexed)
  restaurantId      String  (indexed)
  items[]
    foodId, name, price, quantity, image, customizations[]
  deliveryAddress
    line1, city, state, pincode, lat, lng
  status            Enum(pending → confirmed → preparing → ready →
                        picked_up → out_for_delivery → delivered | cancelled)
  statusHistory[]   { status, timestamp, note, updatedBy }
  paymentMethod     Enum(stripe, razorpay, cod)
  paymentStatus     Enum(pending, processing, completed, failed, refunded)
  sagaState         String  (ORDER_CREATED → SAGA_COMPLETED | SAGA_FAILED)
  subtotal, deliveryFee, taxAmount, discountAmount, totalAmount
  estimatedDelivery DateTime
```

### Redis — Cart Schema

```
Key:   cart:{userId}
Value: JSON string
TTL:   604800 seconds (7 days)

{
  "restaurantId": "abc123",
  "items": [
    { "foodId": "...", "name": "Butter Chicken", "price": 320,
      "quantity": 2, "image": "...", "customizations": [] }
  ],
  "couponCode": "WELCOME10",
  "coupon": { "type": "percent", "value": 10, "maxDiscount": 100 }
}
```

---

## 7. Security Architecture

### JWT Strategy
- Access token: 15 minutes, signed with `JWT_ACCESS_SECRET`
- Refresh token: 7 days, stored in PostgreSQL `sessions` table
- Token rotation: every refresh revokes old token and issues new pair
- Gateway verifies access token and attaches `{ id, role }` to `X-User-ID` / `X-User-Role` headers

### Password Security
- bcrypt with 12 salt rounds (deliberately slow to resist brute force)
- Password never stored or logged — only `passwordHash`

### Rate Limiting
- `trust proxy: 1` ensures real client IP is used (not Render's internal IP)
- Global: 500 requests / 15 minutes per IP
- Auth routes: 50 requests / 15 minutes per IP
- Payment routes: 10 requests / 1 minute per IP

### Other Security Measures
- Helmet.js: sets 11 security headers (XSS protection, HSTS, etc.)
- CORS: explicit origin whitelist in production
- Stripe webhook: `stripe.webhooks.constructEvent` signature verification
- Input validation: `express-validator` on all auth routes
- Non-enumerable errors: `forgotPassword` always returns 200 regardless of email existence

---

## 8. Frontend Architecture

### Customer App (React + Vite)

```
src/
├── pages/          Route-level components
├── components/     Reusable UI components
├── services/api.js Axios instance + all API methods
├── store/index.js  Redux Toolkit store
└── hooks/          Custom React hooks
```

### Redux Store Slices

| Slice | State | Key Actions |
|-------|-------|-------------|
| `auth` | user, accessToken, refreshToken | `setCredentials`, `updateTokens`, `logout` |
| `cart` | items, restaurantId, totals | `setCart`, `clearCartState` |
| `ui` | theme, searchQuery, selectedCity | `toggleTheme`, `setSelectedCity` |

### Axios Interceptors

**Request:** Attaches `Authorization: Bearer {accessToken}` to every request.

**Response (401 handling):**
```
401 received → check if refresh in progress
  → if yes: queue request, wait for token
  → if no: call /api/auth/refresh with refreshToken
      → success: dispatch updateTokens, retry original request
      → failure: dispatch logout, redirect to login
```

This implements a **request queue** pattern so concurrent requests during token refresh don't all independently try to refresh.

### API Service Pattern

All API calls are grouped by domain in `api.js`:

```javascript
export const authAPI = { register, login, logout, refresh, verifyEmail, ... }
export const catalogAPI = { getFoods, getTrending, search, ... }
export const restaurantAPI = { getAll, getById }
export const cartAPI = { get, add, update, remove, clear, applyCoupon }
export const orderAPI = { place, getAll, getById, cancel, invoice }
```

---

## 9. Infrastructure & Deployment

### Render Deployment (Backend)

12 services deployed on Render free tier. Each service is a separate `web` service in `render.yaml`:

```yaml
- type: web
  name: tomato-auth-service
  runtime: node
  rootDir: services/auth-service
  buildCommand: npm install && npx prisma generate && npx prisma db push || true
  startCommand: npm start
```

Key patterns:
- `prisma db push || true` — migration failure doesn't block deployment
- Services connect to their databases lazily (non-blocking startup)
- UptimeRobot pings `/health` every 5 minutes to prevent free-tier sleep

### Vercel Deployment (Frontend)

Each frontend app has a `vercel.json` with SPA fallback:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

Environment variable `VITE_API_URL` points to the Render API gateway URL.

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `seed.yml` | Manual (`workflow_dispatch`) | Seed MongoDB + create users + set roles |
| `keep-alive.yml` | Every 14 minutes (cron) | Ping all service health endpoints |
| `ci-cd.yml` | Push to main | Lint, test, deploy |

### Docker Support

Every service has a `Dockerfile` using multi-stage builds:
```dockerfile
FROM node:20-alpine AS base     # lightweight base
FROM base AS deps               # install dependencies
FROM base AS production         # copy deps + source, generate Prisma client
```

Non-root user (`nodejs:1001`) for security. `dumb-init` for proper signal handling.

---

## 10. API Reference Summary

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register new user |
| POST | `/api/auth/login` | None | Login, returns tokens |
| POST | `/api/auth/refresh` | None | Rotate refresh token |
| POST | `/api/auth/logout` | None | Revoke refresh token |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/auth/google` | None | Start Google OAuth |

### Catalog
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/catalog/foods` | None | List food items |
| GET | `/api/catalog/trending` | None | Trending items |
| GET | `/api/catalog/categories` | None | All categories |
| GET | `/api/catalog/search?q=` | None | Full-text search |

### Restaurants
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/restaurants/public` | None | List restaurants (paginated) |
| GET | `/api/restaurants/public/:id` | None | Restaurant + full menu |
| POST | `/api/restaurants` | Owner | Create restaurant |
| POST | `/api/restaurants/:id/menu` | Owner | Add menu item |

### Cart
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cart` | Customer | Get cart |
| POST | `/api/cart/add` | Customer | Add item |
| PATCH | `/api/cart/update` | Customer | Update quantity |
| DELETE | `/api/cart/clear` | Customer | Clear cart |
| POST | `/api/cart/coupon` | Customer | Apply coupon |

### Orders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/orders` | Customer | Place order (triggers Saga) |
| GET | `/api/orders` | Customer | My orders |
| GET | `/api/orders/:orderId` | Customer/Owner | Order details |
| PATCH | `/api/orders/:orderId/status` | Owner/Driver | Update status |
| POST | `/api/orders/:orderId/cancel` | Customer | Cancel order |
| GET | `/api/orders/:orderId/invoice` | Customer | Download PDF invoice |

---

## Coupons (Built-in)

| Code | Type | Value | Min Order |
|------|------|-------|-----------|
| `WELCOME10` | 10% off | max ₹100 | ₹0 |
| `FLAT50` | ₹50 off | — | ₹200 |
| `SAVE20` | 20% off | max ₹200 | ₹300 |
| `FREEDEL` | Free delivery | — | ₹100 |

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@tomato.com | Password123! |
| Admin | admin@tomato.com | Admin123! |
| Restaurant Owner | owner@tomato.com | Owner123! |
| Delivery Partner | delivery@tomato.com | Delivery123! |

---

*Built with the MERN Stack + Microservices Architecture*
