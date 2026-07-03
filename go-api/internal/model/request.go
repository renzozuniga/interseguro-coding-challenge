package model

// QRRequest is the payload received by the POST /api/v1/qr-decompose endpoint.
// Matrix must be a non-empty rectangular m×n array with m >= n >= 1.
type QRRequest struct {
	Matrix [][]float64 `json:"matrix"`
}

// LoginRequest is the payload for the POST /api/v1/auth/login endpoint.
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
