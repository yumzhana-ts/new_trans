# 🎯 Trivia App

A social trivia web app built with **Next.js**, **PostgreSQL**, and **Prisma ORM**, served over HTTPS via **Caddy**.

---

## ⚙️ Commands

```bash
make dev # starts the stack
make logs # live container logs
make ps # check running containers
```

Access at: **<https://localhost:8443>**

```bash
make down # stops containers
make clean # stops containers and removes images
make fclean # stops containers, removes images and volumes!!!

```

---

## 🐳 Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| App      | Next.js (frontend + API routes)  |
| Database | PostgreSQL + Prisma ORM       |
| Gateway  | Caddy (HTTPS, routing)        |
| Docs     | Swagger                       |
| Styling  | Bootstrap                     |

All API routes live under `src/app/api/` and are handled server-side with Prisma. The frontend consumes them via `fetch('/api/...')`.

For optional auth features, local env values can be copied from `.env.dev` into your local `.env`.

---

## 🌐 Pages

| URL                                      | Description       |
|------------------------------------------|-------------------|
| `https://localhost:8443/login`           | Login / Register  |
| `https://localhost:8443/reset-password`  | Password reset    |
| `https://localhost:8443/profile`         | User profile      |
| `https://localhost:8443/dashboard`       | Dashboard         |
| `https://localhost:8443/game`            | Game room         |
| `https://localhost:8443/legal`           | Privacy/Terms     |
| `https://localhost:8443/admin/users`     | User management   |
| `https://localhost:8443/swagger`         | API docs          |

---

## 🔧 Extending

Add a new service in `docker-compose.yml`, connect it to `app-network`, and add a route in the Caddyfile:

```caddyfile
handle_path /myservice/* {
    reverse_proxy myservice:4000
}
```
