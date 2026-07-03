'use strict';

const { Router } = require('express');
const jwtMiddleware = require('../middlewares/auth');
const { computeStats } = require('../controllers/statsController');

const router = Router();

// JWT validation happens here, not in the controller, so the controller
// can focus purely on business logic — easier to test in isolation.
router.post('/matrix-stats', jwtMiddleware, computeStats);

module.exports = router;
