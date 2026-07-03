'use strict';

require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Validate required environment variables before starting.
// Failing loudly at boot is far easier to debug than silent auth failures at runtime.
const required = ['JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[fatal] required environment variable "${key}" is not set`);
    process.exit(1);
  }
}

app.listen(PORT, () => {
  console.log(`node-api listening on port ${PORT}`);
});
