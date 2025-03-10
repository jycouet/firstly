# Base stage for shared dependencies
FROM ubuntu:24.04

# To bring the env inside.
# ARG TZ

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install Stuff
RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  git \
  && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install all dependencies
RUN npm i -g pnpm@10.5.2
RUN pnpm install --production=false

# Build the application
RUN pnpm -F docs build

# Production stage with Nginx for serving static files
FROM nginx:alpine

# Copy the built files from the builder stage to Nginx's serve directory
COPY --from=builder /docs/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80
