const { Pool } = require('pg');
const logger = require('../utils/logger');

// Soporte automático para DATABASE_URL (Render, Supabase, Neon, Railway)
if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    if (!process.env.DB_USER && parsed.username) {
      process.env.DB_USER = decodeURIComponent(parsed.username);
    }
    if (!process.env.DB_PASSWORD && parsed.password) {
      process.env.DB_PASSWORD = decodeURIComponent(parsed.password);
    }
    if (!process.env.DB_HOST && parsed.hostname) {
      process.env.DB_HOST = parsed.hostname;
    }
    if (!process.env.DB_PORT && parsed.port) {
      process.env.DB_PORT = parsed.port;
    }
    if (!process.env.DB_NAME && parsed.pathname) {
      process.env.DB_NAME = parsed.pathname.replace(/^\//, '');
    }
  } catch (err) {
    logger.warn('Could not parse DATABASE_URL as URL:', err.message);
  }
}

if (!process.env.DATABASE_URL && (!process.env.DB_USER || !process.env.DB_PASSWORD)) {
  throw new Error('DB_USER and DB_PASSWORD (or DATABASE_URL) environment variables are required');
}

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'medical_app',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Database connection error', { error: err.message, stack: err.stack });
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.query(text, params, duration, res.rowCount);
    
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query error', { 
      query: text, 
      params, 
      duration: `${duration}ms`,
      error: error.message, 
      code: error.code 
    });
    throw error;
  }
};

const getClient = async () => {
  const client = await pool.connect();
  return client;
};

module.exports = {
  query,
  getClient,
  pool
};
