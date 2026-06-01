# 🍅 Tomato - Production-Ready AI-Powered Food Delivery Platform

A complete, production-ready microservices food delivery platform built with modern technologies.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  Customer App (5173) │ Admin Panel (5174) │ Delivery App (5175)     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│                    NGINX (Reverse Proxy + SSL)                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│              API GATEWAY (Port 3000)                                  │
│  Rate Limiting │ Auth Middleware │ Routing │ Logging │ Aggregation   │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┘
   │      │      │      │      │      │      │      │      │
┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐ ┌──▼─┐
│Auth│ │User│ │Rest│ │Cat.│ │Cart│ │Ord.│ │Pay.│ │Del.│ │Notif│
│3001│ │3002│ │3003│ │3004│ │3005│ │3006│ │3007│ │3008│ │3009│
└──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘ └──┬─┘
   │      │      │      │      │      │      │      │      │
┌──▼──────▼──────▼──────▼──────▼──────▼──────▼──────▼──────▼────────┐
│                    MESSAGE BROKER (RabbitMQ :5672)                    │
│              Event-Driven Communication Between Services              │
└─────────────────────────────────────────────────────────────────────┘
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │   MongoDB    │  │    Redis     │
│  (Auth DB)   │  │ (Orders, etc)│  │  (Cache/Cart)│
└──────────────┘  └──────────────┘  └──────────────┘
```

## 📦 Services

| Service | Port | Tech | Description |
|---------|------|------|-------------|
| API Gateway | 3000 | Node.js/Express | Central routing, auth, rate limiting |
| Auth Service | 3001 | Node.js/Prisma/PostgreSQL | JWT, OAuth, OTP, RBAC |
| User Service | 3002 | Node.js/MongoDB | Profiles, addresses, favorites |
| Restaurant Service | 3003 | Node.js/MongoDB | Restaurant management, menus |
| Catalog Service | 3004 | Node.js/MongoDB/Redis | Food listing, search, categories |
| Cart Service | 3005 | Node.js/Redis | Cart management, coupons |
| Order Service | 3006 | Node.js/MongoDB/Socket.IO | Orders, Saga pattern, real-time |
| Payment Service | 3007 | Node.js/Stripe/Razorpay | Payments, refunds, webhooks |
| Delivery Service | 3008 | Node.js/MongoDB | Partner management, live tracking |
| Notification Service | 3009 | Node.js/Nodemailer/Twilio | Email, SMS, push notifications |
| Review Service | 3010 | Node.js/MongoDB | Ratings, reviews, sentiment |
| Analytics Service | 3011 | Node.js/MongoDB | Revenue, sales, insights |
| AI Service | 8000 | Python/FastAPI | Chatbot, recommendations, search |

## 🚀 Quick Start (Docker Compose)

### Prerequisites
- Docker Desktop 24+
- Docker Compose v2+
- Node.js 20+ (for local development)

### 1. Clone and Setup

```bash
git clone https://github.com/your-org/tomato-platform
cd tomato-platform
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Everything

```bash
# Start all services (databases + microservices + frontends)
docker-compose -f infrastructure/docker/docker-compose.dev.yml up --build

# Or start in background
docker-compose -f infrastructure/docker/docker-compose.dev.yml up --build -d
```

### 3. Seed Database

```bash
# Wait for services to start, then seed
node scripts/seed.js
```

### 4. Access the Platform

| App | URL |
|-----|-----|
| Customer App | http://localhost:5173 |
| Admin Panel | http://localhost:5174 |
| API Gateway | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:3000/api/docs |
| RabbitMQ Management | http://localhost:15672 (guest/guest) |
| Grafana | http://localhost:3100 (admin/admin) |
| Prometheus | http://localhost:9090 |

## 🔧 Local Development (Without Docker)

```bash
# Install all dependencies
npm install

# Start databases (requires Docker)
docker-compose -f infrastructure/docker/docker-compose.dev.yml up postgres mongo redis rabbitmq -d

# Run auth service DB migration
cd services/auth-service && npx prisma migrate dev && cd ../..

# Start all services concurrently
npm run services:start

# Start customer app
cd apps/customer-app && npm run dev
```

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required for full functionality:
JWT_ACCESS_SECRET=your_32_char_secret_here
JWT_REFRESH_SECRET=your_32_char_refresh_secret

# Optional (features degrade gracefully without these):
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_test_...
GOOGLE_CLIENT_ID=...
OPENAI_API_KEY=sk-...
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
TWILIO_ACCOUNT_SID=...
```

## 🏛️ Key Design Patterns

### Saga Pattern (Order Service)
```
PlaceOrder → ReserveInventory → ProcessPayment → AssignDelivery → NotifyAll
     ↓ (on failure)
Compensate: CancelDelivery → RefundPayment → ReleaseInventory
```

### Event-Driven Communication (RabbitMQ)
```
order.placed → [payment-service, notification-service, restaurant-service]
payment.success → [order-service, notification-service]
delivery.completed → [order-service, analytics-service]
```

### Redis Caching Strategy
- Cart data: TTL 7 days
- Restaurant listings: TTL 5 minutes
- Food catalog: TTL 5 minutes
- Driver locations: TTL 5 minutes

## 🔐 Security Features

- JWT access tokens (15min) + refresh tokens (7 days)
- Token rotation on refresh
- Google OAuth 2.0
- Helmet.js security headers
- CORS with whitelist
- Rate limiting (global + per-route)
- Input validation (express-validator)
- bcryptjs password hashing (12 rounds)
- Stripe webhook signature verification
- Non-root Docker containers
- Kubernetes secrets management

## 📊 Monitoring

- **Prometheus**: Metrics collection at `:9090`
- **Grafana**: Dashboards at `:3100`
- **Winston**: Structured JSON logging
- **Health checks**: `/health` on every service

## ☸️ Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/manifests/

# Check deployment status
kubectl get pods -n tomato
kubectl get services -n tomato

# Scale a service
kubectl scale deployment api-gateway --replicas=5 -n tomato

# View logs
kubectl logs -f deployment/api-gateway -n tomato
```

## 🚢 Production Deployment (AWS EKS)

```bash
# 1. Create EKS cluster
eksctl create cluster --name tomato-prod --region us-east-1 --nodes 3

# 2. Configure kubectl
aws eks update-kubeconfig --name tomato-prod --region us-east-1

# 3. Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx

# 4. Install cert-manager
helm install cert-manager jetstack/cert-manager --set installCRDs=true

# 5. Deploy platform
kubectl apply -f infrastructure/kubernetes/manifests/

# 6. Verify
kubectl get ingress -n tomato
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific service tests
cd services/auth-service && npm test

# Run with coverage
npm test -- --coverage

# E2E tests (Cypress)
cd apps/customer-app && npx cypress open
```

## 📱 PWA Features

The Customer App is a Progressive Web App:
- Offline support with service worker
- Install to home screen
- Push notifications
- Background sync

## 🤖 AI Features

- **Chatbot**: OpenAI GPT-3.5 powered food assistant
- **Recommendations**: Collaborative filtering
- **Smart Search**: NLP query understanding
- **Sentiment Analysis**: Review sentiment scoring
- **Trending**: Real-time popularity tracking

## 🎨 UI Features

- Glassmorphism design system
- Dark/Light mode
- Framer Motion animations
- Fully responsive (mobile-first)
- Skeleton loading states
- Real-time order tracking with Socket.IO

## 📁 Project Structure

```
tomato-platform/
├── apps/
│   ├── customer-app/          # React + Vite + Tailwind
│   ├── admin-panel/           # Restaurant admin dashboard
│   └── delivery-app/          # Delivery partner app
├── services/
│   ├── api-gateway/           # Central routing (Express)
│   ├── auth-service/          # JWT + OAuth (Prisma + PostgreSQL)
│   ├── user-service/          # User profiles (MongoDB)
│   ├── restaurant-service/    # Restaurant management (MongoDB)
│   ├── catalog-service/       # Food catalog + search (MongoDB + Redis)
│   ├── cart-service/          # Cart management (Redis)
│   ├── order-service/         # Orders + Saga (MongoDB + Socket.IO)
│   ├── payment-service/       # Stripe + Razorpay (MongoDB)
│   ├── delivery-service/      # Delivery tracking (MongoDB)
│   ├── notification-service/  # Email + SMS (RabbitMQ consumer)
│   ├── review-service/        # Reviews + sentiment (MongoDB)
│   ├── analytics-service/     # Analytics (MongoDB aggregation)
│   └── ai-service/            # AI features (Python FastAPI)
├── packages/
│   ├── shared-types/          # Shared constants and types
│   └── utils/                 # Shared utilities
├── infrastructure/
│   ├── docker/                # Docker Compose files
│   ├── kubernetes/            # K8s manifests + Helm charts
│   └── nginx/                 # NGINX configuration
├── scripts/
│   └── seed.js                # Database seeder
├── .github/workflows/         # GitHub Actions CI/CD
├── .env.example               # Environment variables template
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with ❤️ using the MERN Stack + Microservices Architecture
