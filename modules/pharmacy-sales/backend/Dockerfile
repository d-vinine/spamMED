# Build Stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install build dependencies
# Not needed for pure Go build
# RUN apk add --no-cache gcc musl-dev

# Copy go mod and sum files
# Copy strictly what is needed.
COPY go.mod go.sum* ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
# CGO_ENABLED=0 is required for pure Go build (avoids gcc requirement)
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server/main.go

# Run Stage
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .
COPY --from=builder /app/inventory.db* ./inventory.db
# Note: inventory.db might be overwritten by volume mount in compose

# Expose port
EXPOSE 8081

CMD ["./main"]
