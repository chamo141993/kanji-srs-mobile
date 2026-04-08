const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

const app = express();
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:8081', 'http://localhost:19006'];

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS policy'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT_MAX || 100),
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      logger.warn('rate_limit_exceeded', {
        ip: req.ip,
        path: req.originalUrl,
      });

      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    },
  })
);

app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    logger.info('http_request', {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.get('x-request-id') || null,
    });
  });

  next();
});

function mockJwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const token = authHeader.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      sub: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'student',
    };

    return next();
  } catch (error) {
    logger.warn('jwt_verification_failed', {
      path: req.originalUrl,
      error: error.message,
    });

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'kanji-srs-mobile-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

app.post('/api/user/sync', mockJwtAuth, (req, res) => {
  res.status(200).json({
    message: 'User sync accepted',
    user: req.user,
    receivedAt: new Date().toISOString(),
    syncAccepted: true,
    payloadSummary: {
      hasBody: Boolean(req.body && Object.keys(req.body).length),
    },
  });
});

app.use((err, req, res, _next) => {
  logger.error('unhandled_error', {
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  if (err.message === 'Origin not allowed by CORS policy') {
    return res.status(403).json({ error: err.message });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('server_started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});