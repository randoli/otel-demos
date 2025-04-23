// src/tracing.js
import {
  WebTracerProvider,
  BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-web";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { UserInteractionInstrumentation } from "@opentelemetry/instrumentation-user-interaction";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import * as opentelemetry from "@opentelemetry/api";

const otlpEndpoint =
  import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";
const traceEndpoint = `${otlpEndpoint}/v1/traces`;
const metricsEndpoint = `${otlpEndpoint}/v1/metrics`;

// Initialize tracing and metrics
function initialize() {
  try {
    // Create the trace exporter
    const traceExporter = new OTLPTraceExporter({
      url: traceEndpoint,
      headers: {},
    });

    // Create a resource describing this application
    const resource = resourceFromAttributes({
      "service.name": "otel-brew-frontend",
      "service.version": "1.0.0",
      "service.namespace":
        import.meta.env.VITE_OTEL_SERVICE_NAMESPACE || "default",
      "deployment.environment": import.meta.env.MODE || "development",
    });

    // Create the provider with span processors
    const tracerProvider = new WebTracerProvider({
      resource: resource,
      spanProcessors: [new BatchSpanProcessor(traceExporter)],
    });

    // Register the trace provider globally
    tracerProvider.register({
      contextManager: new ZoneContextManager(),
    });

    // Set up auto-instrumentation for tracing
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [
            new RegExp(`${import.meta.env.API_URL}.*`),
          ],
        }),
        // Added user interaction instrumentation
        new UserInteractionInstrumentation({
          eventNames: ["click"],
          shouldPreventSpanCreation: (element) => {
            return !(element.tagName === "BUTTON");
          },
        }),
      ],
    });

    // Initialize metrics
    const metricExporter = new OTLPMetricExporter({
      url: metricsEndpoint,
      headers: {},
    });

    // Create the metric reader
    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 15000, // Export metrics every 15 seconds
    });

    // Pass the reader in the MeterProvider constructor
    const meterProvider = new MeterProvider({
      resource: resource, // Reuse the same resource
      readers: [metricReader],
    });

    // Make the meter provider global
    opentelemetry.metrics.setGlobalMeterProvider(meterProvider);

    // Create business-specific metrics
    const meter = meterProvider.getMeter("otel-brew-frontend");
    const clickCounter = meter.createCounter("frontend.user.clicks", {
      description: "Count of user clicks by button type",
      unit: "1",
    });

    const apiCallDurationHistogram = meter.createHistogram(
      "frontend.api.call.duration",
      {
        description: "Duration of API calls from the frontend",
        unit: "ms",
      }
    );

    const errorCounter = meter.createCounter("frontend.errors", {
      description: "Count of frontend errors",
      unit: "1",
    });

    console.log("OpenTelemetry initialized for frontend");

    return {
      tracer: tracerProvider.getTracer("otel-brew-frontend"),
      meter,
      metrics: {
        clickCounter,
        apiCallDurationHistogram,
        errorCounter,
      },
    };
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry:", error);
    // Return no-op implementations for safety
    return {
      tracer: {
        startSpan: () => ({ end: () => {}, setAttributes: () => {} }),
        startActiveSpan: (name, options, fn) => {
          if (typeof options === "function") {
            fn = options;
          }
          return fn({ end: () => {}, setAttributes: () => {} });
        },
      },
      meter: {},
      metrics: {
        clickCounter: { add: () => {} },
        apiCallDurationHistogram: { record: () => {} },
        errorCounter: { add: () => {} },
      },
    };
  }
}

// Export all telemetry objects
const telemetry = initialize();
export const tracer = telemetry.tracer;
export const meter = telemetry.meter;
export const metrics = telemetry.metrics;
