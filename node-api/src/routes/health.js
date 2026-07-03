'use strict';

const { Router } = require('express');

const router = Router();

// No auth on health — Docker health checks and load balancers call this
// without credentials. Returning 200 is all that's needed.
router.get('/health', (_req, res) => res.json({ status: 'ok' }));

module.exports = router;
