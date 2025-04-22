import {
  WebTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-web";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { DocumentLoadInstrumentation } from "@opentelemetry/instrumentation-document-load";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import * as opentelemetry from "@opentelemetry/api";

// Initialize tracing and metrics
function initialize() {
  try {
    // Create the trace exporter
    const traceExporter = new OTLPTraceExporter({
      url: "http://localhost:4318/v1/traces",
      headers: {},
    });

    // Create the provider with span processors
    const tracerProvider = new WebTracerProvider({
      resource: resourceFromAttributes({
        "service.name": "task-management-frontend",
      }),
      spanProcessors: [new SimpleSpanProcessor(traceExporter)],
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
          propagateTraceHeaderCorsUrls: [/http:\/\/localhost:8080.*/],
        }),
      ],
    });

    // Initialize metrics
    const metricExporter = new OTLPMetricExporter({
      url: "http://localhost:4318/v1/metrics",
      headers: {},
    });

    // Create the metric reader
    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 15000, // Export metrics every 15 seconds
    });

    // Pass the reader in the MeterProvider constructor
    const meterProvider = new MeterProvider({
      resource: resourceFromAttributes({
        "service.name": "task-management-frontend",
      }),
      readers: [metricReader], // Add the metric reader
    });

    // Make the meter provider global
    opentelemetry.metrics.setGlobalMeterProvider(meterProvider);

    console.log("OpenTelemetry initialized for frontend");

    // Create and export the meter for custom metrics
    const meter = meterProvider.getMeter("task-management-frontend");

    // Create some example metrics
    const taskViewCounter = meter.createCounter("task.view.count", {
      description: "Number of times tasks are viewed",
    });

    const formSubmitHistogram = meter.createHistogram("form.submit.duration", {
      description: "Time taken to submit a form",
      unit: "ms",
    });

    // Export the tracer and metrics
    return {
      tracer: tracerProvider.getTracer("task-management-frontend"),
      meter,
      metrics: {
        taskViewCounter,
        formSubmitHistogram,
      },
    };
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry:", error);
    // Return no-op implementations
    return {
      tracer: {
        startActiveSpan: (name, fn) => {
          return fn({ end: () => {} });
        },
      },
      meter: {},
      metrics: {
        taskViewCounter: { add: () => {} },
        formSubmitHistogram: { record: () => {} },
      },
    };
  }
}

// Export all telemetry objects
export const { tracer, meter, metrics } = initialize();
