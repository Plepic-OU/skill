# Stage 1: Build the SPA
FROM node:22-slim AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

ARG VITE_EMULATOR_HOST
# Firebase env vars for build — emulator doesn't validate these, only project ID must match
ENV VITE_FIREBASE_API_KEY=fake-api-key \
    VITE_FIREBASE_AUTH_DOMAIN=skill-plepic-com.firebaseapp.com \
    VITE_FIREBASE_PROJECT_ID=skill-plepic-com \
    VITE_FIREBASE_STORAGE_BUCKET=skill-plepic-com.firebasestorage.app \
    VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000 \
    VITE_FIREBASE_APP_ID=1:000000000000:web:fake
RUN VITE_EMULATOR_HOST=${VITE_EMULATOR_HOST} pnpm build

# Stage 2: Runtime
FROM node:22-slim

# Install Adoptium Temurin JDK 21 (firebase-tools@15 requires Java 21+, Bookworm only ships 17)
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    curl \
    gnupg \
    ca-certificates \
  && curl -fsSL https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /usr/share/keyrings/adoptium.gpg \
  && echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" > /etc/apt/sources.list.d/adoptium.list \
  && apt-get update && apt-get install -y --no-install-recommends temurin-21-jre \
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
COPY preview/demo-accounts.json /app/preview/demo-accounts.json

# Copy Firestore rules and indexes for emulator
COPY firestore.rules /app/firestore.rules
COPY firestore.indexes.json /app/firestore.indexes.json

# Remove default nginx site if it exists
RUN rm -f /etc/nginx/sites-enabled/default

# Pre-download Firebase emulator JARs so they don't download at runtime
RUN firebase setup:emulators:firestore

RUN chmod +x /app/preview/startup.sh /app/preview/seed.sh

EXPOSE 8080

CMD ["/app/preview/startup.sh"]
