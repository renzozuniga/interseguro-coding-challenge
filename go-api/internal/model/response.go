package model

// MatrixStats holds the statistics for a single matrix, as returned by the Node.js API.
type MatrixStats struct {
	Max        float64 `json:"max"`
	Min        float64 `json:"min"`
	Average    float64 `json:"average"`
	Sum        float64 `json:"sum"`
	IsDiagonal bool    `json:"isDiagonal"`
}

// StatsResult groups the statistics for both the Q and R matrices.
type StatsResult struct {
	Q MatrixStats `json:"q"`
	R MatrixStats `json:"r"`
}

// QRResponse is the payload returned to the client after a successful QR decomposition.
// It includes the factored matrices and the statistics computed by the Node.js API.
type QRResponse struct {
	Q     [][]float64 `json:"q"`
	R     [][]float64 `json:"r"`
	Stats StatsResult `json:"stats"`
}

// LoginResponse carries the signed JWT returned after successful authentication.
type LoginResponse struct {
	Token string `json:"token"`
}

// ErrorResponse is the standard error envelope used by all error responses.
type ErrorResponse struct {
	Error string `json:"error"`
}

// NodeStatsPayload is the body sent to the Node.js /api/v1/matrix-stats endpoint.
type NodeStatsPayload struct {
	Q [][]float64 `json:"q"`
	R [][]float64 `json:"r"`
}
