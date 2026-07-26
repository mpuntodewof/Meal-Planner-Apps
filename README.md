# 🍽️ Meal Planner Apps

A full-stack meal-planning platform with **AI-assisted recipe generation**, **nutrition estimation**, and a **behavior-analytics dashboard**. Users plan weekly meals, build recipes (by hand or via an LLM), auto-generate shopping lists, rate and favorite recipes, and see how their planning habits trend over time.

Built with **ASP.NET Core 8** and **React + TypeScript**, containerized with Docker, and covered by an xUnit test suite and CI.

> **Status:** Actively developed portfolio project. The stack runs end-to-end via `docker compose up`.

<!-- Add a live demo link and a dashboard screenshot/GIF here once deployed — see "Deployment" below. -->
<!-- ![Behavior dashboard](docs/screenshot-dashboard.png) -->

---

## Table of contents

- [Highlights](#-highlights)
- [Features](#-features)
- [Tech stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project structure](#-project-structure)
- [Getting started](#-getting-started)
- [Configuration](#-configuration)
- [API overview](#-api-overview)
- [Testing](#-testing)
- [Continuous integration](#-continuous-integration)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)

---

## ⭐ Highlights

The parts of this project that go beyond a standard CRUD app:

- **Resilient LLM integration.** Recipe generation and nutrition estimation call any OpenAI-compatible provider (OpenRouter, OpenAI, Groq, …) through a **model fallback runner**: an ordered chain of models is tried in turn, and on a retryable error (HTTP 429 rate-limit, 402 out-of-credit, or 5xx) the runner automatically falls through to the next model. The retryable-error classification and the model-list parser are unit-tested.
- **Behavior-analytics dashboard.** A tabbed account page aggregates a user's planning behavior: meals-per-week by slot, category mix, recipe variety banding, most-planned recipes, average ratings, and planned per-serving nutrition — plus an admin platform-wide view. Aggregation logic (weekly bucketing, variety classification, insight-line generation) is unit-tested.
- **Merged account experience.** Profile management, a user's own recipes, favorites, and password changes all live as tabs alongside the analytics, behind a single `/dashboard` route.
- **Production concerns addressed.** JWT auth via ASP.NET Identity, image uploads via Cloudinary, transactional email for password reset, a Dockerized three-service stack, and a namespaced design system that coexists with Bootstrap.

---

## ✨ Features

**Recipes**
- Create, edit, delete, and browse recipes (ingredients + step-by-step instructions)
- **AI recipe generation** from a prompt via an LLM
- **AI nutrition estimation** (per-serving calories, protein, fat, carbs)
- Image upload (Cloudinary) with client-side validation
- Ratings (1–5) with aggregated summaries, and favorites

**Meal planning**
- Weekly meal plans organized by date × meal slot (breakfast / lunch / dinner / snack)
- Auto-generated **shopping list** derived from planned recipes

**Account & analytics (`/dashboard`)**
- Overview: KPI tiles + charts of planning behavior (user and admin views)
- Profile editing with avatar upload
- "My Recipes" (recipes you created) and "Favorites"
- In-app password change (separate from the email-token reset flow)

**Auth**
- Register / login (JWT), role-based access (User / Admin)
- Forgot-password via emailed reset link; token-based reset

---

## 🛠 Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Redux Toolkit + RTK Query, React Router 6, React-Bootstrap, custom SVG charts |
| Backend | ASP.NET Core 8 (Web API), C#, Entity Framework Core |
| Auth | ASP.NET Core Identity, JWT bearer tokens |
| Database | MySQL 8 |
| AI | OpenAI-compatible chat-completions API (OpenRouter by default) with a model fallback chain |
| Media | Cloudinary (image hosting) |
| Email | SMTP (password-reset links) |
| Testing | xUnit, EF Core InMemory + SQLite in-memory |
| Infra | Docker, Docker Compose, nginx (SPA serving), GitHub Actions CI |

---

## 🏗 Architecture

```
┌─────────────────────┐      HTTP / JSON       ┌──────────────────────────┐
│  React + TypeScript  │  ───────────────────▶  │   ASP.NET Core 8 Web API  │
│  (RTK Query, nginx)  │  ◀───────────────────  │   Controllers → Helpers   │
└─────────────────────┘                         └────────────┬─────────────┘
                                                             │ EF Core
                                     ┌───────────────────────┼───────────────────────┐
                                     ▼                       ▼                       ▼
                               ┌──────────┐          ┌──────────────┐        ┌──────────────┐
                               │ MySQL 8  │          │ LLM provider │        │  Cloudinary  │
                               │  (data)  │          │ (fallback    │        │  (images)    │
                               └──────────┘          │  chain)      │        └──────────────┘
                                                      └──────────────┘
```

**Backend flow:** Controllers own HTTP concerns and delegate non-trivial logic to focused helpers (`DashboardLogic`, `ShoppingListLogic`, `RatingLogic`, `AiRecipeService`, `NutritionService`, `ChatCompletionRunner`, `ModelListParser`). Responses are wrapped in a consistent `ApiResponse` envelope; EF Core serializes with `ReferenceHandler.Preserve` (arrays arrive as `{ $values: [...] }`, unwrapped at the frontend data boundary).

**Frontend flow:** Each backend area has a dedicated RTK Query API module (`recipeApi`, `authApi`, `dashboardApi`, …) sharing a single configurable origin (`src/api/apiConfig.ts`). UI is component-based; the dashboard uses a namespaced `ds-*` design system to avoid collisions with the global Bootstrap theme.

A deeper write-up lives in [`SystemArchitecture.md`](SystemArchitecture.md).

---

## 📂 Project structure

```
MealPlannerApps/
├── API/                        # ASP.NET Core 8 Web API
│   ├── Controllers/            # Auth, Recipe, MealPlan, ShoppingList, Rating, Favorite, Dashboard, User
│   ├── Helpers/                # AI runner, nutrition, dashboard/rating/shopping-list logic, image service
│   ├── Models/                 # Entities (Recipe, MealPlans, AppUser, …) + DTOs
│   ├── Data/                   # EF Core DbContext
│   ├── Utils/                  # SendEmailService
│   └── Dockerfile
├── API.Tests/                  # xUnit tests (logic + controller-level)
├── Frontend/                   # React + TypeScript SPA
│   ├── src/api/                # RTK Query modules + apiConfig (single API origin)
│   ├── src/pages/              # Home, product, mealPlan, news, auth, dashboard
│   ├── src/redux/              # store + slices
│   ├── nginx.conf              # SPA-aware serving
│   └── Dockerfile
├── .github/workflows/ci.yml    # CI: backend build+test, frontend build
├── docker-compose.yml          # MySQL + API + frontend
├── render.yaml                 # One-click Render deploy blueprint
└── SystemArchitecture.md
```

---

## 🚀 Getting started

### Option A — Docker (recommended)

Requires Docker Desktop.

```bash
git clone https://github.com/mpuntodewof/Meal-Planner-Apps.git
cd Meal-Planner-Apps

cp .env.example .env      # then fill in your LLM provider key (see Configuration)

docker compose up --build
```

- Frontend → http://localhost:3000
- API → http://localhost:5128
- MySQL → localhost:3307 (host) → 3306 (container)

The database is provisioned automatically; data persists in the `mysql_data` volume.

### Option B — Run locally without Docker

**Prerequisites:** .NET 8 SDK, Node.js 18+, a MySQL 8 instance.

```bash
# Backend
cd API
dotnet restore
# set ConnectionStrings__DbConnection (see Configuration), then:
dotnet run          # serves on http://localhost:5128

# Frontend (in a second terminal)
cd Frontend
npm install
npm start           # serves on http://localhost:3000
```

---

## 🔧 Configuration

### Backend

| Variable | Purpose |
| --- | --- |
| `ConnectionStrings__DbConnection` | MySQL connection string |
| `OpenAI__ApiKey` | LLM provider API key |
| `OpenAI__BaseUrl` | Provider endpoint (empty = OpenAI; OpenRouter = `https://openrouter.ai/api/v1`) |
| `OpenAI__Models` | Ordered, comma-separated fallback chain (first = primary). Overrides `OpenAI__Model` |
| `OpenAI__Model` | Single model used when `OpenAI__Models` is unset |
| `OpenAI__Referer`, `OpenAI__Title` | Optional OpenRouter attribution headers |

The AI provider is configured with the `OpenAI__*` prefix **regardless of which provider you use** — the client is OpenAI-compatible. See [`.env.example`](.env.example) for a working OpenRouter setup. Cloudinary and SMTP settings live in `appsettings.json` / environment variables.

### Frontend

| Variable | Purpose |
| --- | --- |
| `REACT_APP_API_URL` | API origin (e.g. `https://your-api.onrender.com`). Defaults to `http://localhost:5128` for local dev. Inlined at build time. |

---

## 🔌 API overview

Base path: `/api`. All responses use the `ApiResponse` envelope (`{ isSuccess, statusCode, result, errorMessages }`).

| Area | Example endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password` |
| Recipes | `GET /recipe`, `GET /recipe/{id}`, `GET /recipe/by-user/{userId}`, `POST /recipe`, `POST /recipe/generate`, `POST /recipe/{id}/estimate-nutrition` |
| Meal plans | `GET`/`POST` `/mealplan`, shopping-list generation |
| Ratings & favorites | rating summaries, add/remove favorite |
| Dashboard | user summary + admin aggregate (weekly buckets, category mix, variety, nutrition) |

---

## 🧪 Testing

The backend has a focused xUnit suite covering business logic and controller behavior, using an in-memory database so tests run without external services.

```bash
dotnet test API.Tests/API.Tests.csproj
```

Covered areas include: the AI model-list parser and chat-completion fallback runner, dashboard aggregation (weekly bucketing, admin projection, insight lines, build summary), rating logic, shopping-list logic, the recipes-by-user and change-password endpoints, and EF relationship mapping.

Frontend correctness is enforced at build time via the TypeScript compiler:

```bash
cd Frontend && npm run build
```

---

## 🔄 Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push and pull request to `master`:

- **Backend job** — restore, build (Release), and run the xUnit test suite.
- **Frontend job** — `npm ci` and a production build (type-check + bundle).

---

## ☁️ Deployment

The stack is deployable via the included [`render.yaml`](render.yaml) blueprint (Render), which provisions a managed MySQL database, the API (from `API/Dockerfile`), and the frontend static site.

1. Create a new **Blueprint** on Render pointing at this repo.
2. After the first deploy, set the secret env vars in the dashboard:
   - API service: `OpenAI__ApiKey`, `OpenAI__BaseUrl`, `OpenAI__Models`.
   - Web service: `REACT_APP_API_URL` = the API service's public URL.
3. Redeploy the web service so the API URL is baked into the bundle.

Any Docker-capable host works too — the two `Dockerfile`s are self-contained and the `docker-compose.yml` documents the required env wiring.

---

## 🗺 Roadmap

- Live hosted demo with a seeded read-only account
- Rate-limiting / usage metering on AI endpoints
- Numbered pagination applied consistently across all list pages
- Frontend component/integration tests (React Testing Library)
- Structured logging (Serilog) and request tracing
- Email verification on registration

---

## License

This project is a personal portfolio application. Feel free to explore the code; reach out before reusing it in production.
