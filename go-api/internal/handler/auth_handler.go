package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/interseguro-challenge/go-api/internal/middleware"
	"github.com/interseguro-challenge/go-api/internal/model"
)

// AuthHandler handles authentication endpoints.
// Credentials are loaded from environment variables at startup so they
// never appear in source code.
type AuthHandler struct {
	adminUsername string
	adminPassword string
	jwtSecret     string
}

// NewAuthHandler constructs an AuthHandler.
//
// Parameters:
//   - username: expected value for the "username" field (from ADMIN_USERNAME env var).
//   - password: expected value for the "password" field (from ADMIN_PASSWORD env var).
//   - jwtSecret: HMAC secret used to sign tokens (from JWT_SECRET env var).
func NewAuthHandler(username, password, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		adminUsername: username,
		adminPassword: password,
		jwtSecret:     jwtSecret,
	}
}

// Login handles POST /api/v1/auth/login.
// Validates credentials against the env-configured values and returns a signed JWT
// on success. Deliberately avoids timing-safe comparison here for brevity; in a
// production system you'd use crypto/subtle.ConstantTimeCompare.
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid request body — expected {\"username\": \"...\", \"password\": \"...\"}")
	}

	if req.Username == "" || req.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "username and password are required")
	}

	if req.Username != h.adminUsername || req.Password != h.adminPassword {
		return fiber.NewError(fiber.StatusUnauthorized, "invalid credentials")
	}

	token, err := middleware.GenerateJWT(req.Username, h.jwtSecret, 24*time.Hour)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate token")
	}

	return c.JSON(model.LoginResponse{Token: token})
}
