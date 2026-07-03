'use strict';

/**
 * Validates that the request body contains two valid numeric matrices under the
 * keys "q" and "r". Returns an error message string on failure, null on success.
 *
 * Manual validation was chosen over a schema library (zod, joi) to keep the
 * dependency footprint minimal and to make the validation rules explicit — an
 * interviewer can read exactly what constitutes a valid payload here without
 * looking up library docs.
 *
 * @param {unknown} body - The parsed request body.
 * @returns {string | null} Error description, or null if the body is valid.
 */
function validateStatsBody(body) {
  if (!body || typeof body !== 'object') {
    return 'request body must be a JSON object';
  }

  for (const key of ['q', 'r']) {
    const matrix = body[key];

    if (!Array.isArray(matrix)) {
      return `"${key}" must be an array`;
    }

    if (matrix.length === 0) {
      return `"${key}" must have at least one row`;
    }

    const cols = matrix[0].length;

    if (!Array.isArray(matrix[0]) || cols === 0) {
      return `"${key}" rows must be non-empty arrays`;
    }

    for (let i = 0; i < matrix.length; i++) {
      const row = matrix[i];

      if (!Array.isArray(row)) {
        return `"${key}[${i}]" must be an array`;
      }

      if (row.length !== cols) {
        return `"${key}" is not rectangular: row 0 has ${cols} column(s) but row ${i} has ${row.length}`;
      }

      for (let j = 0; j < row.length; j++) {
        if (typeof row[j] !== 'number' || !isFinite(row[j])) {
          return `"${key}[${i}][${j}]" must be a finite number`;
        }
      }
    }
  }

  return null;
}

module.exports = { validateStatsBody };
