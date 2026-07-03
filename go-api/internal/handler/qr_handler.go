package handler

import (
	"errors"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/interseguro-challenge/go-api/internal/client"
	"github.com/interseguro-challenge/go-api/internal/model"
	"github.com/interseguro-challenge/go-api/internal/service"
)

// QRHandler handles QR decomposition requests.
type QRHandler struct {
	nodeClient *client.NodeClient
}

// NewQRHandler constructs a QRHandler with an injected Node.js API client.
//
// Parameters:
//   - nodeClient: HTTP client pointing at the Node.js stats service.
func NewQRHandler(nodeClient *client.NodeClient) *QRHandler {
	return &QRHandler{nodeClient: nodeClient}
}

// Decompose handles POST /api/v1/qr-decompose.
//
// Flow:
//  1. Parse and validate the input matrix.
//  2. Run Householder QR decomposition (pure function in the service package).
//  3. Call the Node.js API to compute statistics on Q and R.
//  4. Return the combined payload to the client.
func (h *QRHandler) Decompose(c *fiber.Ctx) error {
	var req model.QRRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid JSON body — expected {\"matrix\": [[...], ...]}")
	}

	if err := validateMatrix(req.Matrix); err != nil {
		return fiber.NewError(fiber.StatusUnprocessableEntity, err.Error())
	}

	result, err := service.DecomposeQR(req.Matrix)
	if err != nil {
		// DecomposeQR only errors on shape problems caught by validateMatrix above.
		// This is a defensive fallback in case that contract ever changes.
		return fiber.NewError(fiber.StatusUnprocessableEntity, err.Error())
	}

	stats, err := h.nodeClient.ComputeStats(result.Q, result.R)
	if err != nil {
		// 502 signals that the Go API itself worked but the upstream stats service failed.
		return fiber.NewError(fiber.StatusBadGateway, "stats service unavailable: "+err.Error())
	}

	return c.JSON(model.QRResponse{
		Q:     result.Q,
		R:     result.R,
		Stats: stats,
	})
}

// validateMatrix checks that the input is a non-empty, rectangular matrix
// with m >= n (required so the R factor is upper-triangular and full-rank).
func validateMatrix(matrix [][]float64) error {
	if len(matrix) == 0 {
		return errors.New("matrix must have at least one row")
	}

	n := len(matrix[0])
	if n == 0 {
		return errors.New("matrix rows must not be empty")
	}

	for i, row := range matrix {
		if len(row) != n {
			return fmt.Errorf(
				"matrix is not rectangular: row 0 has %d column(s) but row %d has %d",
				n, i, len(row),
			)
		}
	}

	m := len(matrix)
	if m < n {
		return fmt.Errorf(
			"matrix has %d row(s) and %d column(s): m must be >= n for QR decomposition",
			m, n,
		)
	}

	return nil
}
