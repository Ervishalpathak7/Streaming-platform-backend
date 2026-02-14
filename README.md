# Streaming Platform Backend

## 🚀 Getting Started with Docker (Recommended)

This project uses **Docker Compose** to orchestrate the Application, Database (PostgreSQL), and Cache (Redis).

### Prerequisites

- Docker & Docker Compose installed.
- `.env` file configured (see `.env.example`).

### How to Run

**1. Start the System**
This command builds the image (using your `.env`) and starts all services in the background.

```bash
docker compose up --build -d
```

**2. Stop the System**

```bash
docker compose down
```

**3. View Logs**

```bash
docker compose logs -f
```

---

## ❓ Common Questions

### Why not use `docker build` directly?

When you run `docker build .`, Docker **does not** read your `.env` file.
However, Prisma Client (`npx prisma generate`) runs _during the build_ and requires a `DATABASE_URL` environment variable to validate your schema.
We fixed this by adding a dummy `ENV DATABASE_URL` inside the `Dockerfile` just for the build step.

### Why not use `docker run` directly?

`docker run` creates an isolated container. It won't be able to talk to your local database or Redis unless you manually configure complex networking.
`docker compose` handles:

1.  **Networking**: Connects App <-> DB <-> Redis.
2.  **Environment**: Automatically injects your `.env` file.
3.  **Ports**: Exposes port 3000 mapping.

---

## 🛠 Manual Local Development (No Docker)

If you prefer running Node.js locally:

1.  Start infrastructure:
    ```bash
    docker compose up -d db redis
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run migrations:
    ```bash
    npx prisma migrate dev
    ```
4.  Start server:
    ```bash
    npm run dev
    ```
