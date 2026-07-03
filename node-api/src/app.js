'use strict';

const express = require('express');
const statsRouter = require('./routes/stats');
const healthRouter = require('./routes/health');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Parse JSON request bodies. Express 4.16+ ships this built-in.
app.use(express.json());

// Mount routes under /api/v1 to match the Go API's convention.
app.use('/api/v1', statsRouter);

// Health check lives at the root level so it doesn't depend on the /api/v1 prefix.
app.use('/', healthRouter);

// Centralized error handler must be the last middleware registered.
app.use(errorHandler);

module.exports = app;
