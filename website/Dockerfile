# Stage 1 — Build
FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS builder

# Alpine 3.24 backports the musl regcomp fix; refresh the build trust store too.
RUN apk add --no-cache --upgrade 'musl>=1.2.6-r3' 'musl-utils>=1.2.6-r3' \
    'ca-certificates>=20261020-r0' 'ca-certificates-bundle>=20261020-r0'

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .
RUN npm run build

# Stage 2 — Serve
FROM nginx:1.31.7-alpine@sha256:892bb2152464f0c5d8972593a5f5afaf8054552580b699d95f8ff4af08c2d33d

# Keep the Alpine 3.24 musl and eMudhra trust-store fixes in the served image.
RUN apk add --no-cache --upgrade 'musl>=1.2.6-r3' 'musl-utils>=1.2.6-r3' \
    'ca-certificates>=20261020-r0' 'ca-certificates-bundle>=20261020-r0'

# Copy built output
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
