// Package client contains HTTP clients for service-to-service communication.
package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/interseguro-challenge/go-api/internal/middleware"
	"github.com/interseguro-challenge/go-api/internal/model"
)

// NodeClient is the HTTP client that calls the Node.js stats API.
// It manages its own http.Client with a timeout to avoid hanging the Go handler
// if the downstream service is slow or unreachable.
type NodeClient struct {
	baseURL    string
	httpClient *http.Client
	jwtSecret  string
}

// NewNodeClient constructs a NodeClient.
//
// Parameters:
//   - baseURL: base URL of the Node.js API, e.g. "http://node-api:3000".
//   - jwtSecret: shared secret used to mint service-to-service tokens.
func NewNodeClient(baseURL, jwtSecret string) *NodeClient {
	return &NodeClient{
		baseURL:   baseURL,
		jwtSecret: jwtSecret,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// ComputeStats sends the Q and R matrices to the Node.js API and returns
// the statistical summary for each matrix.
//
// The Go API mints its own short-lived service token for this call rather than
// forwarding the end-user's token. This keeps the service boundary clean: if a
// user token expires mid-flight, the internal call is still authorized.
//
// Parameters:
//   - q: the orthogonal Q matrix from QR decomposition.
//   - r: the upper-triangular R matrix from QR decomposition.
func (c *NodeClient) ComputeStats(q, r [][]float64) (model.StatsResult, error) {
	payload := model.NodeStatsPayload{Q: q, R: r}

	body, err := json.Marshal(payload)
	if err != nil {
		return model.StatsResult{}, fmt.Errorf("marshaling stats payload: %w", err)
	}

	// Mint a short-lived service token (5 min is more than enough for one request).
	serviceToken, err := middleware.GenerateJWT("go-api", c.jwtSecret, 5*time.Minute)
	if err != nil {
		return model.StatsResult{}, fmt.Errorf("generating service JWT: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, c.baseURL+"/api/v1/matrix-stats", bytes.NewReader(body))
	if err != nil {
		return model.StatsResult{}, fmt.Errorf("building request to node-api: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return model.StatsResult{}, fmt.Errorf("calling node-api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errBody model.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&errBody) //nolint:errcheck — best effort parse
		return model.StatsResult{}, fmt.Errorf("node-api returned HTTP %d: %s", resp.StatusCode, errBody.Error)
	}

	var stats model.StatsResult
	if err := json.NewDecoder(resp.Body).Decode(&stats); err != nil {
		return model.StatsResult{}, fmt.Errorf("decoding node-api response: %w", err)
	}

	return stats, nil
}
