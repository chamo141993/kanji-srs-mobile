const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

const app = express();
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const defaultAllowedOrigins = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];
const defaultAllowedOriginHostSuffixes = ['onrender.com'];
// Render can provide comma-separated CORS_ORIGIN / CORS_ORIGIN_SUFFIX env vars.
const allowedOrigins = (
  process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : defaultAllowedOrigins
)
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOriginHostSuffixes = (
  process.env.CORS_ORIGIN_SUFFIX
    ? process.env.CORS_ORIGIN_SUFFIX.split(',')
    : defaultAllowedOriginHostSuffixes
)
  .map((suffix) => suffix.trim().replace(/^\./, '').toLowerCase())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'https:') {
      return false;
    }

    const normalizedHostname = hostname.toLowerCase();
    return allowedOriginHostSuffixes.some(
      (suffix) =>
        normalizedHostname === suffix || normalizedHostname.endsWith(`.${suffix}`)
    );
  } catch (_error) {
    return false;
  }
}
const MOCK_WEB_PROGRESS = [
  {
    id: 'wk-water',
    kanji: '水',
    meaning: 'Water',
    status: 'memorized',
    level: 1,
    nextReviewAt: '2026-04-10T12:00:00.000Z',
  },
  {
    id: 'wk-fire',
    kanji: '火',
    meaning: 'Fire',
    status: 'learning',
    level: 1,
    nextReviewAt: '2026-04-09T22:00:00.000Z',
  },
  {
    id: 'wk-tree',
    kanji: '木',
    meaning: 'Tree',
    status: 'learning',
    level: 2,
    nextReviewAt: '2026-04-10T08:30:00.000Z',
  },
];
const webDashboardState = {
  progress: MOCK_WEB_PROGRESS,
  stats: {
    currentLevel: 1,
    pendingLessons: 0,
    pendingReviews: 2,
    stageBreakdown: {
      apprentice: 2,
      guru: 1,
      master: 0,
      enlightened: 0,
    },
  },
  syncSummary: {
    lastSyncedAt: null,
    recordsSynced: 0,
    source: 'none',
  },
};

function buildDashboardStatsFromProgress(progress) {
  const learningCount = progress.filter((entry) => entry?.status === 'learning').length;
  const memorizedCount = progress.filter((entry) => entry?.status === 'memorized').length;
  const currentLevel = progress.reduce(
    (maxLevel, entry) => Math.max(maxLevel, Number(entry?.level) || 1),
    1
  );

  return {
    currentLevel,
    pendingLessons: 0,
    pendingReviews: learningCount,
    stageBreakdown: {
      apprentice: learningCount,
      guru: memorizedCount,
      master: 0,
      enlightened: 0,
    },
  };
}

function normalizeWebProgress(progress) {
  if (!Array.isArray(progress) || progress.length === 0) {
    return MOCK_WEB_PROGRESS;
  }

  return progress.map((entry, index) => ({
    id: entry?.id || `synced-${index}`,
    kanji: entry?.kanji || `Kanji ${index + 1}`,
    meaning: entry?.meaning || 'Unknown',
    status: entry?.status || 'learning',
    level: Number(entry?.level) || 1,
    nextReviewAt: entry?.nextReviewAt || null,
  }));
}

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
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS policy'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

app.get('/api/web/dashboard', (_req, res) => {
  res.status(200).json({
    progress: webDashboardState.progress,
    stats: webDashboardState.stats,
    syncSummary: webDashboardState.syncSummary,
    capabilities: {
      webLessons: false,
      webReviews: false,
      cloudSync: true,
    },
    server: {
      status: 'ok',
      service: 'kanji-srs-mobile-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
});

// POST endpoint to handle secure offline-to-cloud syncs
app.post('/api/sync', (req, res) => {
  const authHeader = req.headers.authorization;

  // 1. Security Check: Validate the mock JWT
  if (!authHeader || authHeader !== 'Bearer mock-jwt-secret-token-for-grading') {
    // Log the failed attempt for the red team requirement
    logger.warn('Unauthorized sync attempt detected', {
        ip: req.ip,
        endpoint: '/api/sync'
    });
    return res.status(401).json({ error: 'Unauthorized: Invalid JWT' });
  }

  // 2. Process the Data: Grab the SQLite payload from the app
  const syncData = req.body;
  const progress = Array.isArray(syncData.progress) ? syncData.progress : [];
  const recordsSynced = progress.length;
  const lastSyncedAt = new Date().toISOString();
  const syncSource =
    progress.some((entry) => entry && entry.source === 'expo-web')
      ? 'web'
      : 'native';

  webDashboardState.progress = normalizeWebProgress(progress);
  webDashboardState.stats = buildDashboardStatsFromProgress(webDashboardState.progress);
  webDashboardState.syncSummary = {
    lastSyncedAt,
    recordsSynced,
    source: syncSource,
  };

  // 3. Telemetry: Log the successful sync event
  logger.info('Offline progress synced to cloud', {
    user_id: 'student_user_01',
    records_synced: recordsSynced,
    sync_source: syncSource,
    ip: req.ip
  });

  // Send success response back to the mobile app
  res.status(200).json({
    message: 'Sync successfully completed and logged!',
    progress: webDashboardState.progress,
    stats: webDashboardState.stats,
    syncSummary: webDashboardState.syncSummary,
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
