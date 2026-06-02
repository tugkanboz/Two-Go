# Minimal image to run the two-go test suite in a reproducible environment.
# Build:  docker build -t two-go .
# Test:   docker run --rm two-go
FROM node:20-alpine

WORKDIR /app

# two-go has zero runtime dependencies; copy the sources and tests.
COPY package.json ./
COPY src ./src
COPY bin ./bin
COPY test ./test

# Default command runs the unit + end-to-end test suite.
CMD ["npm", "test"]
