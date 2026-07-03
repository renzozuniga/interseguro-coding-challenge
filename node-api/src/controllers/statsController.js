'use strict';

const { computeMatrixStats } = require('../services/statsService');
const { validateStatsBody } = require('../validators/matrixValidator');

/**
 * POST /api/v1/matrix-stats
 *
 * Receives the Q and R matrices from the Go API and returns statistical
 * metrics for each. This endpoint is not intended to be called directly
 * by the frontend — it is an internal service endpoint called server-to-server.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function computeStats(req, res, next) {
  const validationError = validateStatsBody(req.body);
  if (validationError) {
    const err = new Error(validationError);
    err.statusCode = 422;
    return next(err);
  }

  try {
    const qStats = computeMatrixStats(req.body.q);
    const rStats = computeMatrixStats(req.body.r);

    return res.json({ q: qStats, r: rStats });
  } catch (err) {
    // computeMatrixStats is a pure function that shouldn't throw for valid input,
    // but wrap defensively so any unexpected error surfaces as a 500.
    return next(err);
  }
}

module.exports = { computeStats };
