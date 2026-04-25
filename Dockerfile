# 1. Build Stage
FROM node:20-slim AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build the app
COPY . .
RUN npm run build

# 2. Production Stage
FROM node:20-slim
WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built assets and the production server
COPY --from=build /app/dist ./dist
COPY server.cjs ./

# Expose port and start the server
EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.cjs"]
