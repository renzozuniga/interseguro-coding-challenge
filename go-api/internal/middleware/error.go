package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/interseguro-challenge/go-api/internal/model"
)

// ErrorHandler is the centralized error handler registered on the Fiber app.
// It converts fiber.Error values (raised via fiber.NewError) into a consistent
// JSON envelope so every error response has the same shape regardless of where
// the error originated in the handler chain.
func ErrorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "internal server error"

	// fiber.NewError wraps errors with an HTTP status code we can unwrap here.
	if fe, ok := err.(*fiber.Error); ok {
		code = fe.Code
		message = fe.Message
	}

	return c.Status(code).JSON(model.ErrorResponse{Error: message})
}
