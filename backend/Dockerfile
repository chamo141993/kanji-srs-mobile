# ==========================================
# STAGE 1: The Builder
# ==========================================
# We use a standard Node image to install dependencies and build the app
FROM node:24-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install ALL dependencies (including express, helmet, winston, etc.)
RUN npm ci

# Copy the rest of the application code
COPY . .

# ==========================================
# STAGE 2: The Distroless Production Image
# ==========================================
# We use Google's distroless Node image for maximum OS hardening
FROM gcr.io/distroless/nodejs20-debian11

# Set the working directory
WORKDIR /app

# Copy the application code and built node_modules from the builder stage
COPY --from=builder /app /app

# Set the environment variable to production
ENV NODE_ENV=production

# Expose the port your server runs on
EXPOSE 8080

# Start the application
CMD ["server.js"]
