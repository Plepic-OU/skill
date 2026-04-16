# Stage 1: Build the SPA
FROM node:22-slim AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

ARG VITE_EMULATOR_HOST
RUN VITE_EMULATOR_HOST=${VITE_EMULATOR_HOST} pnpm build

# Stage 2: Runtime
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    openjdk-21-jre-headless \
    curl \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g firebase-tools@15

WORKDIR /app

# Copy built SPA
COPY --from=build /app/web /app/web

# Copy preview config files
COPY preview/nginx.conf /etc/nginx/conf.d/default.conf
COPY preview/firebase.json /app/firebase.json
COPY preview/startup.sh /app/preview/startup.sh
COPY preview/seed.sh /app/preview/seed.sh

# Copy Firestore rules and indexes for emulator
COPY firestore.rules /app/firestore.rules
COPY firestore.indexes.json /app/firestore.indexes.json

# Remove default nginx site if it exists
RUN rm -f /etc/nginx/sites-enabled/default

RUN chmod +x /app/preview/startup.sh /app/preview/seed.sh

EXPOSE 8080

CMD ["/app/preview/startup.sh"]
