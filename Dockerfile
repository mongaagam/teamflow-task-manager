## Multi-stage build to ensure Node 20.19.0 is used for build and runtime

# Frontend build stage
FROM node:20.19.0 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Backend install stage
FROM node:20.19.0 AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./

# Copy frontend build into backend's dist folder
COPY --from=frontend-build /app/frontend/dist /app/backend/frontend/dist

ENV NODE_ENV=production
EXPOSE 5001
WORKDIR /app/backend
CMD ["node", "server.js"]
