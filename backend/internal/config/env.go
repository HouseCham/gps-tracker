package config

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v3/log"
	"github.com/joho/godotenv"
)

// init calls loadEnv
func init() {
	loadEnv()
}

// loads environment variables from a .env file if it exists and logs the process.
func loadEnv() {
	log.Info("Setting up environment variables")
	if err := godotenv.Load(); err != nil {
		log.Warnf("Could not load .env file: %v", err)
	}
}

// AuthConfig carries the Authula-specific environment values consumed
// by internal/auth.Bootstrap. Loading is centralised here so the main
// entrypoint can fail fast with a single, descriptive error when a
// required variable is missing.
type AuthConfig struct {
	AppName     string
	BaseURL     string
	Secret      string
	DatabaseURL string
}

// LoadAuthConfig reads the Authula configuration from the
// environment. It returns an error if AUTHULA_SECRET is missing (it is
// the only required value; the rest have sensible defaults that match
// Authula's own internal defaults).
//
// Required: AUTHULA_SECRET
// Optional: APP_NAME, AUTHULA_BASE_URL, DATABASE_URL
func LoadAuthConfig() (AuthConfig, error) {
	cfg := AuthConfig{
		AppName:     getEnvDefault("APP_NAME", "gps-tracker-api"),
		BaseURL:     os.Getenv("AUTHULA_BASE_URL"),
		Secret:      os.Getenv("AUTHULA_SECRET"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}
	if cfg.Secret == "" {
		return AuthConfig{}, fmt.Errorf("AUTHULA_SECRET is required")
	}
	if cfg.DatabaseURL == "" {
		return AuthConfig{}, fmt.Errorf("DATABASE_URL is required")
	}
	return cfg, nil
}

func getEnvDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
