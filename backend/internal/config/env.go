package config

import (
	"fmt"
	"os"

	"github.com/gofiber/fiber/v3/log"
	"github.com/joho/godotenv"
)

func LoadEnv() {
	log.Info("Setting up environment variables")
	if err := godotenv.Load(); err != nil {
		log.Warnf("Could not load .env file: %v", err)
	}
}

type AuthConfig struct {
	AppName     string
	BaseURL     string
	Secret      string
	DatabaseURL string
	GoogleOAuth *GoogleOAuthConfig
}

type GoogleOAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

func LoadAuthConfig() (AuthConfig, error) {
	cfg := AuthConfig{
		AppName:     getEnvDefault("APP_NAME", "gps-tracker-api"),
		BaseURL:     os.Getenv("AUTHULA_BASE_URL"),
		Secret:      os.Getenv("AUTHULA_SECRET"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}
	if googleClientID := os.Getenv("GOOGLE_CLIENT_ID"); googleClientID != "" {
		googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
		if googleClientSecret != "" {
			cfg.GoogleOAuth = &GoogleOAuthConfig{
				ClientID:     googleClientID,
				ClientSecret: googleClientSecret,
			}
		}
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
