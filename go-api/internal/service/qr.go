// Package service contains the core mathematical logic for QR decomposition.
// All functions here are pure (no I/O, no global state) so they can be unit-tested
// in isolation from the HTTP layer.
package service

import (
	"errors"
	"fmt"
	"math"
)

// QRResult holds the two factors produced by Householder QR factorization.
// For an m×n input matrix A (m >= n): Q is m×m orthogonal, R is m×n upper triangular.
// The factorization satisfies A = Q * R.
type QRResult struct {
	Q [][]float64
	R [][]float64
}

// DecomposeQR performs QR factorization on the input matrix using Householder reflections.
//
// Why Householder over Gram-Schmidt?
// Classical Gram-Schmidt can lose orthogonality due to floating-point cancellation when
// columns are nearly linearly dependent — errors accumulate with each orthogonalization
// step. Modified Gram-Schmidt is better, but Householder reflections are the gold standard
// for numerical stability: each reflector is exactly orthogonal by construction, and the
// backward error is bounded by machine epsilon times a modest polynomial in m and n.
// The trade-off is that Householder computes a full m×m Q (costlier to form than the
// "thin" Q from Gram-Schmidt), but for an interview demo correctness beats micro-optimization.
//
// Parameters:
//   - matrix: a non-empty m×n slice of float64 with m >= n >= 1 and uniform row length.
//
// Returns:
//   - QRResult: Q (m×m orthogonal) and R (m×n upper triangular) with A = Q*R.
//   - error: if the matrix is malformed or under-determined (m < n).
func DecomposeQR(matrix [][]float64) (QRResult, error) {
	m := len(matrix)
	if m == 0 {
		return QRResult{}, errors.New("matrix must have at least one row")
	}

	n := len(matrix[0])
	if n == 0 {
		return QRResult{}, errors.New("matrix must have at least one column")
	}

	// Validate that the matrix is rectangular (all rows the same length).
	for i, row := range matrix {
		if len(row) != n {
			return QRResult{}, fmt.Errorf("row %d has %d columns, expected %d (matrix must be rectangular)", i, len(row), n)
		}
	}

	if m < n {
		return QRResult{}, fmt.Errorf("matrix has %d rows and %d columns: m must be >= n for full-column-rank QR", m, n)
	}

	// Work on a deep copy so the caller's data is never mutated.
	R := copyMatrix(matrix)

	// Q accumulates as a product of Householder reflectors; it starts as I_m.
	Q := identityMatrix(m)

	// We need min(m-1, n) reflectors to zero out all sub-diagonal entries of R.
	steps := n
	if m-1 < n {
		steps = m - 1
	}

	for k := 0; k < steps; k++ {
		// Extract the sub-column x = R[k:m, k] that we want to collapse to ‖x‖·e₁.
		x := make([]float64, m-k)
		for i := k; i < m; i++ {
			x[i-k] = R[i][k]
		}

		norm := l2Norm(x)
		if norm < 1e-14 {
			// This column is already effectively zero below the diagonal; skip.
			continue
		}

		// Build the Householder vector u = x + sign(x₀)·‖x‖·e₁.
		// Using sign(x₀) (same sign as x[0]) prevents catastrophic cancellation
		// when x[0] ≈ ‖x‖: the naive choice -sign would give u[0] ≈ 0, losing precision.
		sign := 1.0
		if x[0] < 0 {
			sign = -1.0
		}

		u := make([]float64, len(x))
		copy(u, x)
		u[0] += sign * norm

		uNorm := l2Norm(u)
		if uNorm < 1e-14 {
			continue
		}

		// Normalize: v = u / ‖u‖  →  the reflector is H = I − 2·v·vᵀ.
		v := make([]float64, len(u))
		for i, val := range u {
			v[i] = val / uNorm
		}

		// Apply H from the left to the active sub-block of R:
		//   R[k:m, j] −= 2·v·(vᵀ·R[k:m, j])  for each column j ∈ [k, n).
		// This zeros out R[k+1:m, k] in one pass and updates the trailing columns.
		for j := k; j < n; j++ {
			dot := 0.0
			for i := range v {
				dot += v[i] * R[k+i][j]
			}
			for i := range v {
				R[k+i][j] -= 2 * dot * v[i]
			}
		}

		// Accumulate Q on the right: Q = Q · Hₖ
		//   Q[i, k:m] −= 2·(Q[i, k:m]·v)·vᵀ  for each row i ∈ [0, m).
		// After all k steps: Q = H₀·H₁·…·H_{steps-1} (each Hₖ is symmetric).
		for i := 0; i < m; i++ {
			dot := 0.0
			for j := range v {
				dot += Q[i][k+j] * v[j]
			}
			for j := range v {
				Q[i][k+j] -= 2 * dot * v[j]
			}
		}
	}

	// Round values within machine-epsilon of zero to exactly zero.
	// This prevents the UI from displaying artifacts like −2.78e−16 in positions
	// that are mathematically zero (e.g. the sub-diagonal entries of R).
	roundNearZero(Q)
	roundNearZero(R)

	return QRResult{Q: Q, R: R}, nil
}

// identityMatrix returns a fresh n×n identity matrix.
func identityMatrix(n int) [][]float64 {
	m := make([][]float64, n)
	for i := range m {
		m[i] = make([]float64, n)
		m[i][i] = 1.0
	}
	return m
}

// copyMatrix returns a deep copy of a 2-D float64 slice.
func copyMatrix(src [][]float64) [][]float64 {
	dst := make([][]float64, len(src))
	for i, row := range src {
		dst[i] = make([]float64, len(row))
		copy(dst[i], row)
	}
	return dst
}

// l2Norm computes the Euclidean (L2) norm of a vector.
func l2Norm(v []float64) float64 {
	sum := 0.0
	for _, x := range v {
		sum += x * x
	}
	return math.Sqrt(sum)
}

// roundNearZero sets entries with |value| < 1e-10 to exactly zero.
// Threshold of 1e-10 is safely above double-precision machine epsilon (~2.2e-16)
// but far below any meaningful numerical result for the matrix sizes we expect.
func roundNearZero(m [][]float64) {
	for i := range m {
		for j := range m[i] {
			if math.Abs(m[i][j]) < 1e-10 {
				m[i][j] = 0.0
			}
		}
	}
}
