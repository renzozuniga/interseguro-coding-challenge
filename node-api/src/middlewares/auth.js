'use strict';

const jwt = require('jsonwebtoken');

/**
 * Express middleware that validates a Bearer JWT in the Authorization header.
 * Uses the same JWT_SECRET env var as the Go API so that tokens minted by Go
 * are accepted here without a separate key exchange.
 *
 * On success the decoded payload is attached to req.user for downstream handlers.
 * On failure a 401 is returned immediately — the request never reaches the controller.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function jwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing or malformed Authorization header' });
  }

  const token = authHeader.slice(7); // trim "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError — both mean 401.
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

module.exports = jwtMiddleware;
