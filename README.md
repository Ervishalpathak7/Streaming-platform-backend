# Video Streaming Backend

A production-grade, contract-first backend for a video streaming platform.
Built with **Node.js (Fastify)**, **TypeScript**, **PostgreSQL (Prisma)**, and **AWS S3**.

## 🏗 Architecture

This project follows **Clean Architecture** principles with a **Feature-Based Module** structure.

### Key Layers

- **Routes / Controllers**: Handle HTTP requests, DTO validation (Zod), and response formatting.
- **Services**: Contain pure business logic. Decoupled from HTTP and Database details.
- **Repositories**: Abstract the data access layer (Prisma).
- **Core / Common**: specific implementation of cross-cutting concerns (Logger, Config, Error Handling).

### Technology Choices & Tradeoffs

#### 1. Fastify vs Express

- **Choice**: **Fastify**.
- **Reason**:
  - Significantly higher performance (req/sec).
  - Native support for JSON Schema/Zod validation which aligns with "Contract-First" requirement.
  - Better encapsulation via plugins.
- **Tradeoff**: Smaller ecosystem than Express, but sufficient for modern backend needs.

#### 2. PostgreSQL over MongoDB

- **Choice**: **PostgreSQL**.
- **Reason**:
  - **Relational Data**: Users, Videos, and Comments have inherent relationships. SQL enforces integrity.
  - **ACID Compliance**: Critical for billing or state transitions (video upload status).
  - **Strict Schema**: Aligns with the strict typing goals of the project.
- **Tradeoff**: Vertical scaling is harder than MongoDB sharding, but sufficient for millions of users.

#### 3. Prisma ORM

- **Choice**: **Prisma**.
- **Reason**:
  - **Type Safety**: Best-in-class TypeScript integration.
  - **Schema-First**: The schema is the source of truth, matching our "Contract-First" API philosophy.
- **Tradeoff**: Runtime performance overhead compared to raw SQL, but negligible for most use cases.

#### 4. Authentication

- **Hashing**: **Argon2** (Better resistance to GPU attacks than Bcrypt).
- **Tokens**: **JWT** (Stateless access) + **Refresh Tokens** (Database backed for interactions).

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**

   ```bash
   cp .env.example .env
   # Update .env with your credentials if needed
   ```

3. **Start Database**

   ```bash
   docker-compose up -d postgres
   ```

4. **Run Migrations**

   ```bash
   npx prisma migrate dev
   ```

5. **Start Server**
   ```bash
   npm run dev
   ```
   Server will start at `http://localhost:3000`.

### 📚 API Documentation

OpenAPI Swagger documentation is auto-generated and available at:
👉 **[http://localhost:3000/documentation](http://localhost:3000/documentation)**

## 🧪 Testing

The project includes Integration and Unit tests.

- **Run All Tests**:

  ```bash
  npm test
  ```

- **Unit Tests**: Mocks external dependencies (S3, Database).
- **Integration Tests**: Tests the full request flow against a running database connection.

## 📦 Project Structure

```
src/
├── app.ts                 # App Factory & Plugins
├── server.ts              # Entry Point
├── common/                # Shared Utilities
│   ├── config/            # Env Validation
│   ├── database/          # Prisma Wrapper
│   ├── errors/            # Global Error Handler
│   ├── logger/            # Pino Logger
│   └── middleware/        # Auth & Security
└── modules/               # Feature Modules
    ├── auth/              # Authentication Feature
    └── video/             # Video Upload Feature
```
