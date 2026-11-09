# ShopVerse - Modern Full-Stack E-Commerce Platform

> An enterprise-ready E-Commerce system built with **NestJS**, **React (TypeScript)**, **PostgreSQL (Prisma ORM)**, **Docker**, and **VNPAY Sandbox Payment Gateway**.

---

## 🏛 System Architecture & Tech Stack

- **Client (`client/`)**: React 18 (Vite) + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + Zustand
- **Server (`server/`)**: NestJS (TypeScript) + Prisma ORM + JWT Auth (Access + Refresh Token) + RBAC + Swagger OpenAPI
- **Database**: PostgreSQL 16
- **Payment Gateway**: VNPAY Sandbox (IPN Webhook, Return URL & HMAC-SHA512 verification)
- **DevOps**: Docker, Docker Compose, GitHub Actions CI

---

## 📂 Project Structure

```text
ShopVerse-ECommerce/
├── .github/              # CI/CD Workflows (GitHub Actions)
│   └── workflows/
├── client/               # Frontend Application (React + Vite + TypeScript)
├── server/               # Backend API Application (NestJS + Prisma)
├── docker/               # Docker configuration files
├── docker-compose.yml    # Multi-container orchestration (DB, API, Client)
├── .editorconfig         # Code styling standard across editors
├── .gitignore            # Git ignore specification
├── package.json          # Monorepo root management scripts
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose
- Git

### Quick Setup

```bash
# 1. Clone repository
git clone https://github.com/your-username/ShopVerse-ECommerce.git
cd ShopVerse-ECommerce

# 2. Start PostgreSQL via Docker Compose
docker compose up postgres -d

# 3. Setup backend
cd server
npm install
npx prisma migrate dev
npm run start:dev

# 4. Setup frontend (in a separate terminal)
cd ../client
npm install
npm run dev
```

---

## 📜 Git Workflow Guidelines
- **Branches**: `feature/<feature-name>`, `fix/<bug-name>`, merged via Pull Requests.
- **Commit Style**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- **Atomic Commits**: Each commit represents a single, logically complete, and tested change.
