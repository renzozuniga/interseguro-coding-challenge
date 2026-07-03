'use strict';

/**
 * Centralized Express error handler.
 * Must be registered last (after all routes) and must accept exactly four arguments
 * so Express recognises it as an error-handling middleware.
 *
 * Converts any error that reaches this point into a consistent JSON envelope:
 *   { "error": "<message>" }
 *
 * Errors that carry a statusCode property (set by controllers that call next(err))
 * preserve their intended HTTP status; everything else falls back to 500.
 *
 * @param {Error & { statusCode?: number }} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || 500;
  const message = err.message || 'internal server error';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
