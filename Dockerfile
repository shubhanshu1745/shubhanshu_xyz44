FROM node:20-alpine

WORKDIR /app

# Install wget for health checks
RUN apk add --no-cache wget

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (using npm install instead of npm ci to handle lock file issues)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create uploads directory structure
RUN mkdir -p dist/public/uploads/stories/images \
    dist/public/uploads/stories/videos \
    dist/public/uploads/posts \
    dist/public/uploads/reels \
    dist/public/uploads/profiles \
    dist/public/uploads/messages

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
