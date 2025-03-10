# Build stage
FROM ubuntu:24.04 AS build

# To bring the env inside.
# ARG TZ

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install Stuff
RUN apt-get update && apt-get install -y \
	curl \
	wget \
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

# Production stage
FROM nginx:alpine

# Set working directory for nginx
WORKDIR /usr/share/nginx/html/

# Copy built files from build stage
COPY --from=build /app/docs/dist .
