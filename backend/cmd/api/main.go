package main

import (
	"context"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/HouseCham/gps-tracker/backend/internal/app/access"
	"github.com/HouseCham/gps-tracker/backend/internal/app/devices"
	"github.com/HouseCham/gps-tracker/backend/internal/app/users"
	_ "github.com/HouseCham/gps-tracker/backend/internal/config"
	"github.com/gofiber/fiber/v3/log"

	"github.com/HouseCham/gps-tracker/backend/internal/infra/postgres"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http"
	"github.com/HouseCham/gps-tracker/backend/internal/transport/http/handlers"
)

func main() {
	log.Info("Starting server...")
	addr := ""
	if v := os.Getenv("APP_PORT"); v != "" {
		if port, err := strconv.ParseUint(v, 10, 64); err == nil {
			addr = ":" + strconv.FormatUint(port, 10)
		}
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	startCtx, startCancel := context.WithTimeout(context.Background(), 10*time.Second)
	pool, err := postgres.NewPool(startCtx, dsn)
	startCancel()
	if err != nil {
		log.Error("create db pool", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	//-- devices
	devicesRepo := postgres.NewDevicesAdapter(pool)
	devicesService := devices.New(devicesRepo)
	//-- users
	usersRepo := postgres.NewUsersAdapter(pool)
	usersService := users.New(usersRepo)
	//-- access
	accessRepo := postgres.NewAccessAdapter(pool)
	accessService := access.NewAccessService(accessRepo, usersRepo)

	//-- handlers
	healthHandler := handlers.NewHealthHandler()
	devicesHandler := handlers.NewDevicesHandler(devicesService)
	usersHandler := handlers.NewUsersHandler(usersService, devicesService)
	accessHandler := handlers.NewAccessHandler(accessService)

	app := http.NewRouter(http.RouterDeps{
		HealthHandler:  healthHandler,
		DevicesHandler: devicesHandler,
		UsersHandler:   usersHandler,
		AccessHandler:  accessHandler,
		AccessService:  accessService,
	})

	server := http.NewServer(app, http.ServerConfig{
		Addr:            addr,
		ShutdownTimeout: 30 * time.Second,
	})

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := server.Run(ctx); err != nil {
		log.Error("server error", "err", err)
		os.Exit(1)
	}
}
