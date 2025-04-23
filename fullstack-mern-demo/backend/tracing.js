// tracing.js - Sets up OpenTelemetry for OTel Brew backend

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
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const otlpEndpoint =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
const traceEndpoint = `${otlpEndpoint}/v1/traces`;
const metricsEndpoint = `${otlpEndpoint}/v1/metrics`;

// This function initializes OpenTelemetry
function initializeTracing() {
  const sdk = new opentelemetry.NodeSDK({
    // Identify our service in the traces
    resource: resourceFromAttributes({
      "service.name": "otel-brew-backend",
      "service.version": "1.0.0",
      "service.namespace": process.env.OTEL_SERVICE_NAMESPACE || "default",
      "deployment.environment": process.env.NODE_ENV || "development",
    }),

    // Send trace data to the OpenTelemetry Collector
    traceExporter: new OTLPTraceExporter({
      url: traceEndpoint,
    }),

    // Configure metrics export
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: metricsEndpoint,
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
        "@opentelemetry/instrumentation-mongoose": { enabled: true },
      }),
    ],
  });

  // Start the OpenTelemetry SDK
  sdk.start();
  console.log("OpenTelemetry initialized for OTel Brew backend");

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
const meter = metrics.getMeter("otel-brew-backend");

// Create coffee shop specific metrics (business-specific)
const orderCounter = meter.createCounter("coffee.order.count", {
  description: "Number of coffee and food items ordered",
  unit: "orders",
});

const customerCounter = meter.createCounter("coffee.customer.count", {
  description: "Number of customers",
  unit: "customers",
});

const serviceTimeHistogram = meter.createHistogram("coffee.service.duration", {
  description: "Time taken to process orders",
  unit: "ms",
});

module.exports = {
  sdk: initializeTracing(),
  meter,
  metrics: {
    orderCounter,
    customerCounter,
    serviceTimeHistogram,
  },
};
