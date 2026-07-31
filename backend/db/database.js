const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon
});

// Run schema on startup (idempotent — CREATE TABLE IF NOT EXISTS)
async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

initSchema().catch((err) => {
  console.error('Failed to initialize schema:', err);
  process.exit(1);
});

module.exports = pool;
