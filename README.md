*This project has been created as part of the 42 curriculum by adjeuken, ytsyrend, tchvatal, vnicoles*

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
Google and GitHub social login need:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
APP_URL=https://localhost:8443
```

---

## 🌐 Pages

| URL                                      | Description       |
|------------------------------------------|-------------------|
| `https://localhost:8443/`                | Home              |
| `https://localhost:8443/login`           | Login / Register  |
| `https://localhost:8443/reset-password`  | Password reset    |
| `https://localhost:8443/dashboard`       | Dashboard/Profile |
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

## Team members with assigned roles (PO, PM, Tech Lead, Developers)

- Antoine Djeukeng Momo (adjeuken) - Developer
- Yumzhana Tsyrendorzhieva (ytsyrend) - Developer
- Tomáš Chvátal (tchvatal) - Developer
- Vladimir Nicolescu (vnicoles) - Developer

## Project management approach (how work was organized)

## Technologies used with justifications

## Database schema

## List of features and who implemented them

## Chosen modules with justifications and point calculation

### Major:

- Backend and Frontend on one framework - 2
- A public API to interact with the database - 2
- Advanced permissions system - 2
- Infrastructure for log management using ELK - 2
- Implement real-time features using WebSockets or similar technology - 2
- Implement a complete web-based game where users can play against each - 2
- Multiplayer game (more than two players) - 2

**Major modules total: 14 points**

### Minor:

- Use an ORM for the database - 1
- Implement a complete 2FA (Two-Factor Authentication)  - 1
- Support for additional browsers - e.g. dashboard scrolling for different browsers - 1

**Minor modules total: 3 points**

?Custom-made design system with reusable components, including a proper color palette, typography, and icons - 1 - we don’t have color palette?

?A complete notification system for all creation, update, and deletion actions - 1

?Backend as microservices - 2

?Monitoring system with Prometheus and Grafana - 2

## Individual contributions of each member