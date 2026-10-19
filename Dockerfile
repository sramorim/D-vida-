# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Install Python + OSINT tools
FROM node:20-slim AS osint
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Install OSINT Python tools
RUN pip3 install --break-system-packages --no-cache-dir \
    maigret \
    holehe \
    instaloader \
    sherlock-project \
    theHarvester \
    photon \
    \
    # Instagram tools
    instagram-private-api \
    \
    # Phone/Email OSINT
    phoneinfoga \
    \
    # General OSINT
    beautifulsoup4 \
    requests \
    aiohttp \
    python-whois \
    dnspython \
    \
    # Crypto
    blockchain \
    \
    # Image forensics
    Pillow \
    exifread

# Stage 3: Build application
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 4: Production
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Python + OSINT tools (complete Python environment)
COPY --from=osint /usr/bin/python3 /usr/bin/python
COPY --from=osint /usr/lib/python3 /usr/lib/python3
COPY --from=osint /usr/local/lib/python3.11/dist-packages /usr/local/lib/python3.11/dist-packages
COPY --from=osint /usr/local/bin /usr/local/bin

# Copy public assets
COPY --from=builder /app/public ./public

# Copy Next.js output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create data directory for user storage
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
