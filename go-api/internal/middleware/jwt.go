// Package middleware contains Fiber middleware for JWT validation and error handling.
package middleware

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// JWTMiddleware returns a Fiber handler that validates Bearer JWTs on incoming requests.
// It rejects requests with missing, malformed, or expired tokens before they reach handlers.
// On success it stores the parsed claims under the "claims" key in fiber.Ctx.Locals.
//
// Parameters:
//   - secret: the HMAC-SHA256 signing key (from JWT_SECRET env var).
func JWTMiddleware(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "missing Authorization header")
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid Authorization format — expected 'Bearer <token>'")
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			// Reject tokens that were signed with an unexpected algorithm.
			// Accepting "none" or RS256 here when we expect HS256 would be a security hole.
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing algorithm: %v", t.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			return fiber.NewError(fiber.StatusUnauthorized, "invalid or expired token")
		}

		c.Locals("claims", token.Claims)
		return c.Next()
	}
}

// GenerateJWT creates a signed HS256 JWT with a standard set of claims.
// Used both for user login tokens and for service-to-service calls to the Node API.
//
// Parameters:
//   - subject: the "sub" claim value (username for user tokens, "go-api" for service tokens).
//   - secret: HMAC-SHA256 signing key.
//   - ttl: token lifetime.
func GenerateJWT(subject, secret string, ttl time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"sub": subject,
		"iat": time.Now().Unix(),
		"exp": time.Now().Add(ttl).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
