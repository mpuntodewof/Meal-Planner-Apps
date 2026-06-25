# ── Stage 1: Build ──────────────────────────────────────────────────
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies (layer-cache friendly)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build production bundle
COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

# Replace default nginx config with our SPA-aware config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the React production build output
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
