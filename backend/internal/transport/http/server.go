package http

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

type Server struct {
	app *fiber.App
	cfg ServerConfig
}

type ServerConfig struct {
	Addr            string
	ShutdownTimeout time.Duration
}

func NewServer(app *fiber.App, cfg ServerConfig) *Server {
	if cfg.ShutdownTimeout == 0 {
		cfg.ShutdownTimeout = 30 * time.Second
	}
	return &Server{app: app, cfg: cfg}
}

func (s *Server) Run(ctx context.Context) error {
	log.Info("http server starting", "addr", s.cfg.Addr)
	return s.app.Listen(s.cfg.Addr, fiber.ListenConfig{
		GracefulContext: ctx,
		ShutdownTimeout: s.cfg.ShutdownTimeout,
	})
}
