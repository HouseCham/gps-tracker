package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	_ "github.com/HouseCham/gps-tracker/backend/internal/infra/config"

	"github.com/HouseCham/gps-tracker/backend/internal/transport/http"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
)

func main() {
	logger := slog.Default()

	addr := ":8080"
	if v := os.Getenv("APP_PORT"); v != "" {
		if port, err := strconv.ParseUint(v, 10, 64); err == nil {
			addr = ":" + strconv.FormatUint(port, 10)
		}
	}

	healthHandler := handlers.NewHealthHandler()
	app := http.NewRouter(http.RouterDeps{
		Logger:        logger,
		HealthHandler: healthHandler,
	})

	server := http.NewServer(app, http.ServerConfig{
		Addr:            addr,
		ShutdownTimeout: 30 * time.Second,
		Logger:          logger,
	})

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := server.Run(ctx); err != nil {
		logger.Error("server error", "err", err)
		os.Exit(1)
	}
}
