// This file sets up OpenTelemetry in our backend

const opentelemetry = require("@opentelemetry/sdk-node");
const {
  getNodeAutoInstrumentations,
} = require("@opentelemetry/auto-instrumentations-node");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const { resourceFromAttributes } = require("@opentelemetry/resources");
const {
  OTLPMetricExporter,
} = require("@opentelemetry/exporter-metrics-otlp-http");
const { PeriodicExportingMetricReader } = require("@opentelemetry/sdk-metrics");

// This function initializes OpenTelemetry
function initializeTracing() {
  const sdk = new opentelemetry.NodeSDK({
    // Identify our service in the traces
    resource: resourceFromAttributes({
      "service.name": "task-management-backend", // Identify our service in the traces
    }),

    // Send trace data to the OpenTelemetry Collector
    traceExporter: new OTLPTraceExporter({
      url: "http://localhost:4318/v1/traces",
    }),

    // Configure metrics export
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: "http://localhost:4318/v1/metrics",
      }),
      exportIntervalMillis: 15000, // Export metrics every 15 seconds
    }),

    // Auto-instrument common libraries
    instrumentations: [
      getNodeAutoInstrumentations({
        // Enable specific instrumentations
        "@opentelemetry/instrumentation-express": { enabled: true },
        "@opentelemetry/instrumentation-http": { enabled: true },
        "@opentelemetry/instrumentation-mongodb": { enabled: true },
      }),
    ],
  });

  // Start the OpenTelemetry SDK
  sdk.start();
  console.log("OpenTelemetry initialized for backend");

  // Shut down gracefully
  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("OpenTelemetry terminated"))
      .catch((error) => console.log("Error terminating OpenTelemetry", error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

// Export the meter for custom metrics
const { metrics } = require("@opentelemetry/api");
const meter = metrics.getMeter("task-management-backend");

// Create some example metrics
const taskCounter = meter.createCounter("task.created.count", {
  description: "Number of tasks created",
});

const taskStatusHistogram = meter.createHistogram(
  "task.status_change.duration",
  {
    description: "Time taken to change task status",
    unit: "ms",
  }
);

module.exports = {
  sdk: initializeTracing(),
  meter,
  metrics: {
    taskCounter,
    taskStatusHistogram,
  },
};
