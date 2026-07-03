// Package main is the entry point for the Go QR decomposition API.
// It wires together the Fiber application, middleware, handlers, and environment config.
package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/interseguro-challenge/go-api/internal/client"
	"github.com/interseguro-challenge/go-api/internal/handler"
	"github.com/interseguro-challenge/go-api/internal/middleware"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file when running locally; in Docker, env vars are injected directly.
	if err := godotenv.Load(); err != nil {
		log.Println("no .env file found, reading env vars from the environment")
	}

	jwtSecret := requireEnv("JWT_SECRET")
	nodeAPIURL := requireEnv("NODE_API_URL")
	adminUsername := requireEnv("ADMIN_USERNAME")
	adminPassword := requireEnv("ADMIN_PASSWORD")
	port := getEnv("PORT", "8080")

	// Register the centralized error handler so every unhandled error is
	// returned as { "error": "..." } JSON rather than the Fiber default HTML.
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	// Recover from panics in handlers to keep the server alive.
	app.Use(recover.New())

	// Structured request logging: method, path, status, latency.
	app.Use(logger.New())

	// CORS: allow any origin so the frontend (served from a different port in dev,
	// or from the nginx container in docker-compose) can reach the API.
	// In a production deployment you would restrict AllowOrigins to known domains.
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Authorization",
	}))

	// Health check — no auth required; used by Docker and load balancers.
	app.Get("/health", handler.HealthCheck)

	nodeClient := client.NewNodeClient(nodeAPIURL, jwtSecret)
	authHandler := handler.NewAuthHandler(adminUsername, adminPassword, jwtSecret)
	qrHandler := handler.NewQRHandler(nodeClient)

	api := app.Group("/api/v1")

	// Public: issue JWTs for authenticated users.
	api.Post("/auth/login", authHandler.Login)

	// Protected: all routes below require a valid JWT.
	api.Use(middleware.JWTMiddleware(jwtSecret))
	api.Post("/qr-decompose", qrHandler.Decompose)

	log.Printf("go-api listening on :%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// requireEnv reads an environment variable and exits immediately if it is not set.
// Failing fast at startup is safer than discovering a missing config mid-request.
func requireEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("required environment variable %q is not set", key)
	}
	return val
}

// getEnv reads an environment variable and returns a default when unset.
func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
