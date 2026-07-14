FROM node:22-slim

# Install pnpm
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies without frozen-lockfile to avoid the mismatch error
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the code
COPY . .

# Build the project
RUN pnpm build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
