package handler

import "github.com/gofiber/fiber/v2"

// HealthCheck handles GET /health.
// Returns a 200 with a simple status payload so container orchestrators
// (Docker, ECS, etc.) can confirm the service is reachable and ready.
func HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
}
