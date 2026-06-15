# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder
ARG TARGETOS=linux
ARG TARGETARCH=amd64
WORKDIR /src
ENV GOTOOLCHAIN=local \
    CGO_ENABLED=0 \
    GOOS=$TARGETOS \
    GOARCH=$TARGETARCH

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -buildvcs=false \
        -ldflags="-s -w" \
        -tags timetzdata \
        -o /out/api ./cmd/api

FROM gcr.io/distroless/static-debian13:nonroot AS runtime
COPY --from=builder /out/api /usr/local/bin/api
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/api"]
