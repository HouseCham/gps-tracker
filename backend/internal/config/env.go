package config

import (
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