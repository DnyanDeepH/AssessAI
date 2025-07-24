/**
 * Metrics controller for AssessAI platform
 * Provides endpoints for monitoring tools to collect performance metrics
 */

const { getMetrics } = require("../utils/metrics");

/**
 * @desc    Get metrics in Prometheus format
 * @route   GET /api/metrics
 * @access  Admin
 */
const getPrometheusMetrics = async (req, res) => {
  try {
    const metrics = await getMetrics();

    // Format metrics in Prometheus text format
    let output = "";

    // HTTP requests total
    output += "# HELP http_requests_total Total number of HTTP requests\n";
    output += "# TYPE http_requests_total counter\n";

    Object.entries(metrics.requests.byMethod).forEach(([method, count]) => {
      Object.entries(metrics.requests.byStatus).forEach(
        ([status, statusCount]) => {
          output += `http_requests_total{method="${method}",status="${status}"} ${count}\n`;
        }
      );
    });

    // HTTP request duration
    output +=
      "\n# HELP http_request_duration_seconds HTTP request duration in seconds\n";
    output += "# TYPE http_request_duration_seconds histogram\n";
    output += `http_request_duration_seconds_bucket{le="0.1"} ${
      metrics.performance.p50ResponseTime.replace("ms", "") / 1000
    }\n`;
    output += `http_request_duration_seconds_bucket{le="0.5"} ${
      metrics.performance.p90ResponseTime.replace("ms", "") / 1000
    }\n`;
    output += `http_request_duration_seconds_bucket{le="1.0"} ${
      metrics.performance.p95ResponseTime.replace("ms", "") / 1000
    }\n`;
    output += `http_request_duration_seconds_bucket{le="+Inf"} ${metrics.requests.total}\n`;

    // Database connections
    output +=
      "\n# HELP database_connections_active Active database connections\n";
    output += "# TYPE database_connections_active gauge\n";
    output += `database_connections_active ${metrics.performance.activeConnections}\n`;

    // Memory usage
    output += "\n# HELP memory_usage_bytes Memory usage in bytes\n";
    output += "# TYPE memory_usage_bytes gauge\n";
    output += `memory_usage_bytes{type="heap_used"} ${metrics.system.memory.heapUsed}\n`;
    output += `memory_usage_bytes{type="heap_total"} ${metrics.system.memory.heapTotal}\n`;
    output += `memory_usage_bytes{type="rss"} ${metrics.system.memory.rss}\n`;
    output += `memory_usage_bytes{type="external"} ${metrics.system.memory.external}\n`;

    // CPU usage
    output += "\n# HELP cpu_usage_percent CPU usage percentage\n";
    output += "# TYPE cpu_usage_percent gauge\n";
    output += `cpu_usage_percent ${metrics.system.cpu.usagePercent}\n`;

    // Error rate
    output += "\n# HELP error_rate_percent Error rate percentage\n";
    output += "# TYPE error_rate_percent gauge\n";
    output += `error_rate_percent ${metrics.performance.errorRate.replace(
      "%",
      ""
    )}\n`;

    // Set content type for Prometheus
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(output);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to retrieve metrics",
        details: error.message,
      },
    });
  }
};

/**
 * @desc    Get metrics in JSON format
 * @route   GET /api/metrics/json
 * @access  Admin
 */
const getJsonMetrics = async (req, res) => {
  try {
    const metrics = await getMetrics();

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: "Failed to retrieve metrics",
        details: error.message,
      },
    });
  }
};

module.exports = {
  getPrometheusMetrics,
  getJsonMetrics,
};
