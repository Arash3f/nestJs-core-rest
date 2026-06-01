# nest-core-rest

A production-ready REST API boilerplate built with [NestJS](https://nestjs.com/), featuring a clean architecture, error handling, and modern development tools.

## ✨ Features

- 🚀 **NestJS** - Progressive Node.js framework
- 🗄️ **Prisma ORM** - Type-safe database client with PostgreSQL  
- 🐳 **Docker** - Containerized development environment
- 🧪 **Jest** - Complete testing suite (unit + e2e)
- ⚙️ **Config Module** - Environment configuration management
- 🧱 **Init Module** - Application initialization & bootstrap logic
- 🛡️ **Global Error Handling** - Centralized exception filter for consistent error responses
- 👥 **User Management** - Complete CRUD APIs for user model

## 🏗️ Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS     | Backend framework |
| Prisma     | ORM & database migrations |
| PostgreSQL | Relational database |
| Docker     | Containerization |
| Jest       | Testing |

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/arash.alfooneh/nest-core-rest.git
cd nest-core-rest
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a .env.dev file in the project root based on .env.example.

### 4. Setup database & run migrations

```bash
# Generate Prisma client
pnpm run prisma:generate:dev

# Run migrations
pnpm run prisma:migrate:dev

# (Optional) Seed database
# pnpm run prisma:push:dev
```

### 5. Run the application

#### Development mode:

```bash
npm run start:dev
```

#### Using Docker (recommended):

```bash
docker-compose up -d
```

#### Production mode:

```bash
pnpm run start:build
pnpm run start:prod
```

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# Test coverage
npm run test:cov
```

## 🐳 Docker Commands

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Stop and remove volumes (clear database)
docker-compose down -v
```

## 🔧 Configuration

The Config module supports different environments through `.env` files:

- `.env.dev` - Development environment
- `.env.prod` - Production environment  
- `.env.test` - Test environment
---

# 🗺 Roadmap / Pending Work

The following features are planned or not yet fully implemented:

- ☐ Update dockers
- ☐ Add github actions
- ☐ Update error filter
- ☐ test:
  - ☐ unit
  - ☐ integration
- ...

---
## 📝 License

[MIT](LICENSE)

## 👥 Author

Your Name - [@arash alfooneh](https://github.com/arash.alfooneh)


**Built with ❤️ using NestJS**