# --- Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

# --- Runtime ---
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy prisma folder
COPY --from=builder /app/prisma ./prisma
#COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node server.js"]







# # Stage 1: build frontend
# FROM node:20-alpine AS builder
#
# WORKDIR /app
#
# # Install dependencies
# COPY package*.json ./
# RUN npm install
#
# # Copy source files
# COPY tsconfig.json ./
# COPY app ./app
# COPY pages ./pages
# COPY public ./public
# COPY styles ./styles
# COPY components ./components
# COPY hooks ./hooks
# COPY next.config.ts ./
#
# # Build Next.js app
# RUN npm run build
#
# # Stage 2: runtime Node only
# FROM node:20-alpine
#
# WORKDIR /app
#
# # Copy Node server files for SSR
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/package*.json ./
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/public ./public
#
# # Create /srv for Caddy volume and copy static/public files
# RUN mkdir -p /srv
# RUN cp -r public /srv/public   # copy public folder to /srv
#
# # Optional: copy static folder if you have one
# # RUN cp -r static /srv/static
#
# EXPOSE 3000
#
# # Run Next.js SSR
# CMD ["npm", "run", "start"]
