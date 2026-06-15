package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	_ "github.com/HouseCham/gps-tracker/backend/internal/config"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	"github.com/HouseCham/gps-tracker/backend/internal/auth"
	"github.com/HouseCham/gps-tracker/backend/internal/config"
	"github.com/HouseCham/gps-tracker/backend/internal/infra/postgres"
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

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		logger.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	startCtx, startCancel := context.WithTimeout(context.Background(), 10*time.Second)
	pool, err := postgres.NewPool(startCtx, dsn)
	startCancel()
	if err != nil {
		logger.Error("create db pool", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	//-- devices
	devicesRepo := postgres.NewDevicesAdapter(pool)
	devicesService := devices.DevicesService(devicesRepo)
	//-- users
	usersRepo := postgres.NewUsersAdapter(pool)
	usersService := users.UsersService(usersRepo)
	//-- access
	accessRepo := postgres.NewAccessAdapter(pool)
	accessService := access.AccessService(accessRepo, usersRepo)

	//-- handlers
	healthHandler := handlers.NewHealthHandler()
	devicesHandler := handlers.NewDevicesHandler(devicesService, logger)
	usersHandler := handlers.NewUsersHandler(usersService, devicesService, logger)
	accessHandler := handlers.NewAccessHandler(accessService, logger)

	//-- auth (Authula). Reads AUTHULA_SECRET and AUTHULA_BASE_URL
	// from the env. Migrations run on first init.
	authCfg, err := config.LoadAuthConfig()
	if err != nil {
		logger.Error("load auth config", "err", err)
		os.Exit(1)
	}
	authInstance, err := auth.Bootstrap(context.Background(), auth.Config{
		AppName:     authCfg.AppName,
		BaseURL:     authCfg.BaseURL,
		Secret:      authCfg.Secret,
		DatabaseURL: authCfg.DatabaseURL,
	})
	if err != nil {
		logger.Error("bootstrap auth", "err", err)
		os.Exit(1)
	}

	app := http.NewRouter(http.RouterDeps{
		Logger:           logger,
		HealthHandler:    healthHandler,
		DevicesHandler:   devicesHandler,
		UsersHandler:     usersHandler,
		AccessHandler:    accessHandler,
		AccessService:    accessService,
		UsersService:     usersService,
		AuthHandler:      authInstance.Handler(),
		AuthJWTValidator: authInstance.NewJWTValidator(),
		AuthUserLookup:   authInstance.NewUserLookup(),
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
