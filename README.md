# FoodRecipe Integrated Workspace

This project wraps both the **FoodRecipe-API** (ASP.NET Core / C#) and **FoodRecipe-Frontend** (React / TS) repositories in a single workspace.

## Project Structure

```
elegant-brahmagupta/
├── API/                 # ASP.NET Core Web API (port 5128)
├── Frontend/            # React + TypeScript Frontend (port 3000)
├── docker-compose.yml   # MySQL Database container
├── package.json         # Workspace orchestration scripts
└── README.md            # You are here
```

---

## Prerequisites

Make sure you have the following tools installed:
- [Node.js](https://nodejs.org/) (v18+)
- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the MySQL database)

---

## Getting Started

### 1. Install Dependencies
Run the following command at the root of the workspace to install dependencies for both the root (wrapper orchestration) and the frontend:
```bash
npm run install:all
```

### 2. Start the Database
The API expects a MySQL instance running on port `3306` with database `foodfest`, user `root`, and password `root`. You can spin this up automatically using:
```bash
npm run db:up
```

### 3. Run the Services
To start both the API and the React frontend concurrently, run:
```bash
npm run dev
```

Alternatively, you can run them individually:
* **Start API**: `npm run start:api`
* **Start Frontend**: `npm run start:frontend`

---

## Configuration & Ports

* **Frontend**: Runs on `http://localhost:3000`
* **API (HTTP)**: Runs on `http://localhost:5128` (with Swagger API UI available at `http://localhost:5128/swagger`)
* **MySQL Database**: Listening on `localhost:3306`
