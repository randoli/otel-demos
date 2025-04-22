// frontend/src/tracing.js
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

// Initialize tracing
function initializeTracing() {
  try {
    // Create the exporter
    const exporter = new OTLPTraceExporter({
      url: "http://localhost:4318/v1/traces",
      headers: {},
    });

    // Create the provider with span processors directly in the constructor
    const provider = new WebTracerProvider({
      resource: resourceFromAttributes({
        "service.name": "task-management-frontend",
      }),
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });

    // Register the provider globally
    provider.register({
      // Changing default contextManager to use ZoneContextManager
      contextManager: new ZoneContextManager(),
    });

    // Registering instrumentations
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [/http:\/\/localhost:8080.*/],
        }),
      ],
    });

    console.log("OpenTelemetry initialized for frontend");

    // Export the tracer for manual instrumentation
    return provider.getTracer("task-management-frontend");
  } catch (error) {
    console.error("Failed to initialize OpenTelemetry:", error);
    // Return a no-op tracer so the app doesn't crash
    return {
      startActiveSpan: (name, fn) => {
        return fn({ end: () => {} });
      },
    };
  }
}

export const tracer = initializeTracing();
