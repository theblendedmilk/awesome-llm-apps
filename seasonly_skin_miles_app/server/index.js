'use strict';
// Loads .env (if present) without extra dependencies, then starts the server.
const fs = require('node:fs');
const path = require('node:path');
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const { createApp } = require('./app');
const { app } = createApp();
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Seasonly running on http://localhost:${port}  ·  admin: http://localhost:${port}/admin`));
