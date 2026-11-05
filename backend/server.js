const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

// Auto-parse DATABASE_URL para servicios PaaS (Render, Supabase, Railway, Neon)
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
    // ignore
  }
}

const rateLimit = require('express-rate-limit');
const logger = require('./src/utils/logger');
const { sequelize } = require('./src/models');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' }
});

const app = express();
const PORT = process.env.APP_PORT || process.env.PORT || 3000;

app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);

app.use(helmet({
  contentSecurityPolicy: false // Permite que el frontend cargue recursos sin bloqueo de CSP
}));

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Public routes (no authentication required)
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authLimiter, authRoutes);

// Protected routes (rate limited)
app.use(apiLimiter);

const usersRoutes = require('./src/routes/users');
const { authenticateToken, requireAdmin } = require('./src/middleware/auth');
const patientRoutes = require('./src/routes/patients');
const doctorRoutes = require('./src/routes/doctors');
const institutionRoutes = require('./src/routes/institutions');
const appointmentRoutes = require('./src/routes/appointments');
const conditionRoutes = require('./src/routes/conditions');
const medicationRoutes = require('./src/routes/medications');
const prescriptionRoutes = require('./src/routes/prescriptions');
const testResultRoutes = require('./src/routes/test-results');
const diagnosticStudiesRoutes = require('./src/routes/diagnostic-studies');

app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/patients', authenticateToken, patientRoutes);
app.use('/api/doctors', authenticateToken, doctorRoutes);
app.use('/api/institutions', authenticateToken, institutionRoutes);
app.use('/api/appointments', authenticateToken, appointmentRoutes);
app.use('/api/conditions', authenticateToken, conditionRoutes);
app.use('/api/medications', authenticateToken, medicationRoutes);
app.use('/api/prescriptions', authenticateToken, prescriptionRoutes);
app.use('/api/test-results', authenticateToken, testResultRoutes);
app.use('/api/diagnostic-studies', authenticateToken, diagnosticStudiesRoutes);

// System database connectivity check
app.get('/api/system/database', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query('SELECT NOW() as current_time, version() as postgres_version');

    res.json({
      success: true,
      message: 'Database connection successful (Sequelize)',
      orm: 'Sequelize',
      data: results[0]
    });
  } catch (error) {
    logger.error('Database test failed', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Enhanced health check with system info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server running',
    version: process.env.APP_VERSION || require('./package.json').version,
    timestamp: new Date(),
    nodeVersion: process.version,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Servir frontend compilado (React / Vite) si existe
const candidatePaths = [
  path.join(__dirname, '../frontend/dist'),
  path.join(__dirname, 'frontend/dist'),
  path.join(__dirname, '../../frontend/dist')
];
let staticFrontendPath = candidatePaths.find(p => fs.existsSync(p));

if (staticFrontendPath) {
  logger.info(`Serving static frontend from: ${staticFrontendPath}`);
  app.use(express.static(staticFrontendPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(staticFrontendPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled application error', { error: err.message, stack: err.stack });
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler for API routes
app.use('/*splat', (req, res) => {
  logger.warn('Route not found', { method: req.method, path: req.path });
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Database initialization and server startup
async function initializeServer() {
  try {
    logger.info('Testing database connection...');
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Auto-run migrations if AUTO_MIGRATE is not explicitly disabled
    if (process.env.AUTO_MIGRATE !== 'false') {
      try {
        const { execSync } = require('child_process');
        logger.info('Running database migrations...');
        execSync('npx sequelize-cli db:migrate', { stdio: 'inherit', env: process.env });
        logger.info('Database migrations completed successfully');
      } catch (migErr) {
        logger.warn('Migration step warning (tables may already exist):', migErr.message);
      }
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`, { 
        port: PORT, 
        environment: process.env.NODE_ENV || 'development',
        logLevel: process.env.LOG_LEVEL || 'INFO',
        orm: 'Sequelize'
      });
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    logger.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Initialize server
initializeServer();
