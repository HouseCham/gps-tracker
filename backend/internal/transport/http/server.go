package http

import (
	"context"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
)

type Server struct {
	app *fiber.App
	cfg ServerConfig
}

type ServerConfig struct {
	Addr            string
	ShutdownTimeout time.Duration
	Logger          *slog.Logger
}

func NewServer(app *fiber.App, cfg ServerConfig) *Server {
	if cfg.ShutdownTimeout == 0 {
		cfg.ShutdownTimeout = 30 * time.Second
	}
	if cfg.Logger == nil {
		cfg.Logger = slog.Default()
	}
	return &Server{app: app, cfg: cfg}
}

func (s *Server) Run(ctx context.Context) error {
	s.cfg.Logger.Info("http server starting", "addr", s.cfg.Addr)
	return s.app.Listen(s.cfg.Addr, fiber.ListenConfig{
		GracefulContext: ctx,
		ShutdownTimeout: s.cfg.ShutdownTimeout,
	})
}
