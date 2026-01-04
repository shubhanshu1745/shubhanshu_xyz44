FROM node:20-alpine

WORKDIR /app

# Set production environment early
ENV NODE_ENV=production

# Install wget for health checks
RUN apk add --no-cache wget

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (need devDeps for build)
RUN npm install --production=false

# Copy source code
COPY . .

# Build the application with NODE_ENV=production
RUN NODE_ENV=production npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production

# Create uploads directory structure
RUN mkdir -p dist/public/uploads/stories/images \
    dist/public/uploads/stories/videos \
    dist/public/uploads/posts \
    dist/public/uploads/reels \
    dist/public/uploads/profiles \
    dist/public/uploads/messages

# Railway uses PORT env variable
ENV PORT=5000

# Expose port (Railway will override with its own)
EXPOSE $PORT

# Start the application
CMD ["npm", "run", "start"]
