const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'kanji-srs-mobile-backend',
    environment: process.env.NODE_ENV || 'development',
  },
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service', 'environment'] }),
    format.printf((info) =>
      JSON.stringify({
        timestamp: info.timestamp,
        level: info.level,
        message: info.message,
        service: info.service,
        environment: info.environment,
        ...info.metadata,
        ...(info.stack ? { stack: info.stack } : {}),
      })
    )
  ),
  transports: [new transports.Console()],
});

module.exports = logger;