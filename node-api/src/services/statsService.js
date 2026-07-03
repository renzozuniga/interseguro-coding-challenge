'use strict';

/**
 * Computes statistical metrics for a single 2-D numeric matrix.
 *
 * All computation is done in one pass over the elements to keep this O(m·n).
 * The function is deliberately side-effect-free so it can be unit-tested without
 * any HTTP or Express setup.
 *
 * @param {number[][]} matrix - A 2-D array of numbers (must be non-empty and rectangular).
 * @returns {{ max: number, min: number, average: number, sum: number, isDiagonal: boolean }}
 */
function computeMatrixStats(matrix) {
  let max = -Infinity;
  let min = Infinity;
  let sum = 0;
  let count = 0;

  for (const row of matrix) {
    for (const val of row) {
      if (val > max) max = val;
      if (val < min) min = val;
      sum += val;
      count++;
    }
  }

  const average = count > 0 ? sum / count : 0;

  return {
    max,
    min,
    average,
    sum,
    isDiagonal: checkIsDiagonal(matrix),
  };
}

/**
 * Determines whether a matrix is diagonal.
 *
 * A matrix is diagonal iff it is square AND every off-diagonal entry is zero
 * within a tolerance of 1e-10 (to absorb floating-point rounding from the
 * Householder algorithm — mathematically zero entries often land at ~1e-16).
 *
 * Note: the R matrix from QR decomposition of a non-square input is itself
 * non-square, so isDiagonal will always be false for it in that case.
 *
 * @param {number[][]} matrix
 * @returns {boolean}
 */
function checkIsDiagonal(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  if (rows !== cols) return false;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (i !== j && Math.abs(matrix[i][j]) > 1e-10) {
        return false;
      }
    }
  }

  return true;
}

module.exports = { computeMatrixStats };
