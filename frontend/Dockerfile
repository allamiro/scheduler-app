# =============================================================================
# Frontend — Multi-stage Dockerfile (Next.js standalone)
# =============================================================================
# Stage 1 (deps):    install production dependencies only
# Stage 2 (builder): install all deps and build the Next.js application
# Stage 3 (runner):  minimal runtime image with only the standalone artefacts
# =============================================================================

# ---- deps -------------------------------------------------------------------
FROM node:18-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
# Install production deps only; devDeps are brought in by the builder stage.
RUN npm install --omit=dev


# ---- builder ----------------------------------------------------------------
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
# Full install (dev + prod) needed to run the Next.js build
RUN npm install

COPY . .

# Ensure a public directory exists (Next.js requires it for standalone output)
RUN mkdir -p public

# NEXT_PUBLIC_* variables are baked into the JS bundle at build time.
# This ARG is set from docker-compose build.args (or the .env file via compose).
ARG NEXT_PUBLIC_API_URL=http://localhost:8001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# next.config.js has output: 'standalone' which produces a self-contained server
RUN npm run build


# ---- runner -----------------------------------------------------------------
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry in production containers
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user matching the uid used by the official Next.js Docker example
RUN addgroup -g 1001 -S nodejs \
 && adduser  -u 1001 -S nextjs -G nodejs

# Copy the standalone server and its bundled node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets alongside the server
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public folder (created in builder if missing)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=15s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000', function(r){process.exit(r.statusCode<400?0:1)}).on('error',function(){process.exit(1)})"

# The standalone build produces server.js at the root of the standalone folder
CMD ["node", "server.js"]
