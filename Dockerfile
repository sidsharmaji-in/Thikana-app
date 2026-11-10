# GharDekho Production Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose server port
EXPOSE 4000

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Start server
CMD ["npm", "start"]
