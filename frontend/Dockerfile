FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# The official nginx image substitutes ${VAR} references in any file under
# /etc/nginx/templates/*.template at container start, writing the result
# to /etc/nginx/conf.d/<name>.conf.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Default for local docker-compose; override at runtime (e.g. on Fly:
# `BACKEND_HOST=bridge-backend.internal:8080`).
ENV BACKEND_HOST=backend:8080
EXPOSE 80
