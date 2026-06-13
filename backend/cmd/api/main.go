package main

import (
	"fmt"
	"os"
	"strconv"

	_ "github.com/HouseCham/gps-tracker/backend/internal/infra/config"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func main() {
	// Get app port from environment variables
	apiPort, err := strconv.ParseUint(os.Getenv("APP_PORT"), 10, 64)
	if err != nil {
		log.Fatalf("Failed to parse APP_PORT: %v", err)
	}

	// Set up the Fiber app
	app := fiber.New()

	// Setting up CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{os.Getenv("CLIENT_ORIGIN")},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Cookie"},
		AllowCredentials: true,
	}))
	
	// Set up the routes and handlers for the app
	// routes.SetupRoutes(app)
	log.Info("Routes are set up")
	
	log.Info("Fiber app is set up")
	log.Infof("Server is running on port %d", apiPort)
	app.Listen(fmt.Sprintf(":%d", apiPort))
}