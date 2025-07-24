/**
 * Metrics collection utility for AssessAI platform
 * Collects and formats performance metrics for monitoring tools
 */

const os = require("os");

// In-memory metrics storage (in production, use Redis or similar)
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byStatus: {},
    byPath: {},
  },
  responseTimes: [],
  errors: {
    total: 0,
    byType: {},
  },
  activeConnections: 0,
  startTime: Date.now(),
};

/**
 * Record a request metric
 * @param {String} method - HTTP method
 * @param {String} path - Request path
 * @param {Number} statusCode - Response status code
 * @param {Number} responseTime - Response time in milliseconds
 */
const recordRequest = (method, path, statusCode, responseTime) => {
  metrics.requests.total++;

  // Track by method
  metrics.requests.byMethod[method] =
    (metrics.requests.byMethod[method] || 0) + 1;

  // Track by status code
  const statusGroup = `${Math.floor(statusCode / 100)}xx`;
  metrics.requests.byStatus[statusGroup] =
    (metrics.requests.byStatus[statusGroup] || 0) + 1;

  // Track by path (limit to prevent memory issues)
  if (Object.keys(metrics.requests.byPath).length < 100) {
    metrics.requests.byPath[path] = (metrics.requests.byPath[path] || 0) + 1;
  }

  // Track response times (keep last 1000 entries)
  metrics.responseTimes.push(responseTime);
  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes.shift();
  }

  // Track errors
  if (statusCode >= 400) {
    metrics.errors.total++;
    metrics.errors.byType[statusGroup] =
      (metrics.errors.byType[statusGroup] || 0) + 1;
  }
};

/**
 * Record an error metric
 * @param {String} type - Error type
 * @param {String} message - Error message
 */
const recordError = (type, message) => {
  metrics.errors.total++;
  metrics.errors.byType[type] = (metrics.errors.byType[type] || 0) + 1;
};

/**
 * Update active connections count
 * @param {Number} count - Current active connections
 */
const updateActiveConnections = (count) => {
  metrics.activeConnections = count;
};

/**
 * Get current metrics
 * @returns {Object} Current metrics data
 */
const getMetrics = async () => {
  const uptime = Date.now() - metrics.startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);

  // Calculate response time statistics
  const responseTimes = metrics.responseTimes;
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const p95ResponseTime =
    sortedTimes.length > 0
      ? sortedTimes[Math.floor(sortedTimes.length * 0.95)]
      : 0;

  // Calculate requests per minute
  const requestsPerMinute =
    uptimeSeconds > 0
      ? Math.round((metrics.requests.total / uptimeSeconds) * 60)
      : 0;

  // Calculate error rate
  const errorRate =
    metrics.requests.total > 0
      ? ((metrics.errors.total / metrics.requests.total) * 100).toFixed(2)
      : 0;

  // Get system metrics
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptimeSeconds,
      human: formatUptime(uptimeSeconds),
    },
    requests: {
      total: metrics.requests.total,
      perMinute: requestsPerMinute,
      byMethod: metrics.requests.byMethod,
      byStatus: metrics.requests.byStatus,
      topPaths: getTopPaths(),
    },
    performance: {
      averageResponseTime: `${Math.round(avgResponseTime)}ms`,
      p95ResponseTime: `${Math.round(p95ResponseTime)}ms`,
      errorRate: `${errorRate}%`,
      activeConnections: metrics.activeConnections,
    },
    errors: {
      total: metrics.errors.total,
      byType: metrics.errors.byType,
    },
    system: {
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      loadAverage: os.loadavg(),
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024)}MB`,
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024)}MB`,
    },
  };
};

/**
 * Get metrics in Prometheus format
 * @returns {String} Prometheus formatted metrics
 */
const getPrometheusMetrics = async () => {
  const currentMetrics = await getMetrics();
  const uptime = Date.now() - metrics.startTime;
  const uptimeSeconds = Math.floor(uptime / 1000);

  let prometheusOutput = "";

  // HTTP requests total
  prometheusOutput +=
    "# HELP http_requests_total Total number of HTTP requests\n";
  prometheusOutput += "# TYPE http_requests_total counter\n";

  Object.entries(metrics.requests.byMethod).forEach(([method, count]) => {
    Object.entries(metrics.requests.byStatus).forEach(
      ([status, statusCount]) => {
        prometheusOutput += `http_requests_total{method="${method}",status="${status}"} ${count}\n`;
      }
    );
  });

  // HTTP request duration
  prometheusOutput +=
    "\n# HELP http_request_duration_seconds HTTP request duration in seconds\n";
  prometheusOutput += "# TYPE http_request_duration_seconds histogram\n";

  const responseTimes = metrics.responseTimes;
  const buckets = [0.1, 0.5, 1.0, 2.0, 5.0];

  buckets.forEach((bucket) => {
    const count = responseTimes.filter((time) => time / 1000 <= bucket).length;
    prometheusOutput += `http_request_duration_seconds_bucket{le="${bucket}"} ${count}\n`;
  });
  prometheusOutput += `http_request_duration_seconds_bucket{le="+Inf"} ${responseTimes.length}\n`;

  // Memory usage
  prometheusOutput += "\n# HELP memory_usage_bytes Memory usage in bytes\n";
  prometheusOutput += "# TYPE memory_usage_bytes gauge\n";

  const memoryUsage = process.memoryUsage();
  Object.entries(memoryUsage).forEach(([type, value]) => {
    prometheusOutput += `memory_usage_bytes{type="${type}"} ${value}\n`;
  });

  // Active connections
  prometheusOutput += "\n# HELP active_connections Active connections\n";
  prometheusOutput += "# TYPE active_connections gauge\n";
  prometheusOutput += `active_connections ${metrics.activeConnections}\n`;

  // Uptime
  prometheusOutput += "\n# HELP uptime_seconds Application uptime in seconds\n";
  prometheusOutput += "# TYPE uptime_seconds counter\n";
  prometheusOutput += `uptime_seconds ${uptimeSeconds}\n`;

  return prometheusOutput;
};

/**
 * Get top requested paths
 * @returns {Object} Top paths by request count
 */
const getTopPaths = () => {
  const sortedPaths = Object.entries(metrics.requests.byPath)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return Object.fromEntries(sortedPaths);
};

/**
 * Format uptime in human readable format
 * @param {Number} seconds - Uptime in seconds
 * @returns {String} Formatted uptime
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Reset metrics (useful for testing)
 */
const resetMetrics = () => {
  metrics.requests = {
    total: 0,
    byMethod: {},
    byStatus: {},
    byPath: {},
  };
  metrics.responseTimes = [];
  metrics.errors = {
    total: 0,
    byType: {},
  };
  metrics.activeConnections = 0;
  metrics.startTime = Date.now();
};

module.exports = {
  recordRequest,
  recordError,
  updateActiveConnections,
  getMetrics,
  getPrometheusMetrics,
  resetMetrics,
};
