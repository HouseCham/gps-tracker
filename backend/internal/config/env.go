package config

import (
	"fmt"
	"os"
	"strings"

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
	AppName     string `json:"appName"`
	BaseURL     string `json:"baseURL"`
	Secret      string `json:"-"`
	DatabaseURL string `json:"-"`
	GoogleOAuth *GoogleOAuthConfig
}

type GoogleOAuthConfig struct {
	ClientID     string `json:"clientId"`
	ClientSecret string `json:"-"`
	RedirectURL  string `json:"redirectUrl"`
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
		return AuthConfig{}, fmt.Errorf("authula_secret is required")
	}
	if cfg.DatabaseURL == "" {
		return AuthConfig{}, fmt.Errorf("database_url is required")
	}
	return cfg, nil
}

func getEnvDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// LoadCORSOrigins returns the list of allowed origins for the
// CORS middleware, parsed from the CORS_ALLOWED_ORIGINS env var
// (comma-separated). Empty/missing means CORS is left disabled
// (the router skips mounting the middleware).
func LoadCORSOrigins() []string {
	v := os.Getenv("CORS_ALLOWED_ORIGINS")
	if v == "" {
		return nil
	}
	var origins []string
	for _, o := range strings.Split(v, ",") {
		if o = strings.TrimSpace(o); o != "" {
			origins = append(origins, o)
		}
	}
	return origins
}
