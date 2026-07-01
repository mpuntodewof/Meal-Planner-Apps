# 🍽️ Meal Planner App

A modern full-stack Meal Planner application built with **React** and **ASP.NET Core Web API** that helps users organize weekly meals, manage recipes, and plan healthier eating habits.

This project was built as a portfolio application to demonstrate production-ready backend architecture, RESTful API design, clean code practices, and modern frontend development.

---

## 🚀 Overview

Meal Planner helps users:

- Create meal plans
- Organize meals by date
- Manage recipes
- Track planned meals
- Maintain a structured weekly schedule

Rather than being just a CRUD application, the project focuses on demonstrating real-world software engineering practices including:

- Clean Architecture
- REST API Design
- Component-based UI
- Repository Pattern
- Dependency Injection
- Separation of Concerns

---

# ✨ Features

## Meal Management

- Create meals
- Update meal information
- Delete meals
- View meal history

## Weekly Planner

- Organize meals by date
- Weekly planning
- Daily meal schedule

## Recipe Management

- Add recipes
- Edit recipes
- Remove recipes
- Browse recipe collection

## Responsive UI

- Mobile friendly
- Desktop friendly
- Clean Material Design

---

# 🛠 Tech Stack

## Frontend

- React
- React Router
- Axios
- Material UI / Bootstrap
- JavaScript

## Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core

## Database

- SQL Server

## Development Tools

- Visual Studio
- VS Code
- Postman
- Git
- GitHub

---

# 🏗 Architecture

```
                React Frontend
                       │
                REST API (HTTP)
                       │
          ASP.NET Core Web API
                       │
          Service / Business Logic
                       │
             Repository Layer
                       │
               Entity Framework
                       │
                  SQL Server
```

### Backend Layers

```
Controllers
    ↓
Services
    ↓
Repositories
    ↓
Database
```

This layered architecture improves:

- Maintainability
- Testability
- Scalability
- Separation of concerns

---

# 📂 Project Structure

```
MealPlannerApp
│
├── ClientApp
│   ├── components
│   ├── pages
│   ├── services
│   ├── hooks
│   └── utils
│
├── MealPlanner.API
│   ├── Controllers
│   ├── Services
│   ├── Repositories
│   ├── Models
│   ├── DTOs
│   ├── Data
│   └── Migrations
│
└── README.md
```

---

# 🔌 REST API

Example endpoints:

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/meals | Get all meals |
| GET | /api/meals/{id} | Get meal |
| POST | /api/meals | Create meal |
| PUT | /api/meals/{id} | Update meal |
| DELETE | /api/meals/{id} | Delete meal |

---

# 💾 Database

Example entities:

```
Meal

- Id
- Name
- Category
- Date
- Calories
- CreatedAt
```

Relationships are managed using Entity Framework Core.

---

# ⚙️ Installation

Clone repository

```bash
git clone https://github.com/mpuntodewof/Meal-Planner-Apps.git
```

Backend

```bash
cd backend

dotnet restore

dotnet ef database update

dotnet run
```

Frontend

```bash
cd frontend

npm install

npm start
```

---

# 🔧 Environment Variables

Backend

```
ConnectionStrings__DefaultConnection=
```

Frontend

```
REACT_APP_API_URL=
```

---

# 🧪 Testing

Example API testing performed using:

- Postman
- Swagger UI

---

# 📈 Engineering Decisions

This project follows several engineering practices:

- RESTful API conventions
- Dependency Injection
- Repository Pattern
- DTO pattern
- Entity Framework Core
- Async/Await
- Reusable React Components
- Centralized API layer
- Error handling
- Input validation

---

# 🚀 Future Improvements

- Authentication (JWT)
- Role-based authorization
- Docker support
- Unit Testing
- Integration Testing
- CI/CD Pipeline
- Redis Caching
- Logging with Serilog
- Pagination
- Search & Filtering
- File Upload
- Meal Recommendation using AI

---

# 💡 What This Project Demonstrates

This project showcases practical software engineering skills including:

- Full-stack application development
- REST API implementation
- Database design
- Clean architecture principles
- Frontend component architecture
- State management
- API integration
- Git workflow
- Production-ready project organization

---

# 📷 Screenshots

> Add screenshots here

- Dashboard
- Meal List
- Meal Details
- Planner
- Mobile View

