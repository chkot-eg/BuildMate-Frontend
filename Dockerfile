# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including dev dependencies needed for build)
RUN npm ci

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy source code
COPY . .

# Build the Angular app for production
RUN npm run build:prod

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist/ibmi-chatbot/browser /usr/share/nginx/html

# Copy custom nginx config for Angular routing
COPY nginx-angular.conf /etc/nginx/conf.d/default.conf

# Create entrypoint script for runtime config
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4200

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]