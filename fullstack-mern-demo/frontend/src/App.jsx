// src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { tracer, metrics } from "./tracing";

const API_URL = import.meta.env.API_URL || "http://localhost:8080";

function App() {
  const [counters, setCounters] = useState({
    espresso: 0,
    coldbrew: 0,
    pastries: 0,
    customers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch counters on component mount
  useEffect(() => {
    fetchCounters();
  }, []);

  // Function to fetch counters from backend with tracing and metrics
  const fetchCounters = async () => {
    const startTime = performance.now();

    // Use tracer.startActiveSpan for better context management
    tracer.startActiveSpan("fetchCounters", async (span) => {
      try {
        setLoading(true);
        span.setAttributes({ operation: "getCounters" });

        const response = await axios.get(`${API_URL}/counters`);

        // Add business context to the span
        span.setAttributes({
          "counters.total":
            response.data.espresso +
            response.data.coldbrew +
            response.data.pastries,
          "counters.customers": response.data.customers,
        });

        setCounters(response.data);
        setError(null);

        // Record API call duration as a metric
        const duration = performance.now() - startTime;
        metrics.apiCallDurationHistogram.record(duration, {
          endpoint: "/counters",
          method: "GET",
          status: "success",
        });
      } catch (err) {
        console.error("Error fetching counters:", err);

        // Record the error in the span
        span.setStatus({ code: 2 }); // Error status
        span.recordException(err);

        // Record error as a metric
        metrics.errorCounter.add(1, {
          operation: "fetchCounters",
          error: err.message,
        });

        // Record failed API call duration
        const duration = performance.now() - startTime;
        metrics.apiCallDurationHistogram.record(duration, {
          endpoint: "/counters",
          method: "GET",
          status: "error",
        });

        setError("Failed to load counters. Please try again.");
      } finally {
        setLoading(false);
        span.end();
      }
    });
  };

  // Function to increment a counter with tracing and metrics
  const incrementCounter = async (item) => {
    const startTime = performance.now();

    tracer.startActiveSpan("incrementCounter", async (span) => {
      try {
        setLoading(true);
        span.setAttributes({ "counter.item": item });

        // Record the button click
        metrics.clickCounter.add(1, {
          action: "increment",
          item: item,
        });

        const response = await axios.post(`${API_URL}/counters/${item}`);
        setCounters(response.data);
        setError(null);

        // Record successful API call duration
        const duration = performance.now() - startTime;
        metrics.apiCallDurationHistogram.record(duration, {
          endpoint: `/counters/${item}`,
          method: "POST",
          status: "success",
        });
      } catch (err) {
        console.error(`Error incrementing ${item} counter:`, err);

        // Record the error in the span
        span.setStatus({ code: 2 });
        span.recordException(err);

        // Record error as a metric
        metrics.errorCounter.add(1, {
          operation: "incrementCounter",
          item: item,
          error: err.message,
        });

        // Record failed API call duration
        const duration = performance.now() - startTime;
        metrics.apiCallDurationHistogram.record(duration, {
          endpoint: `/counters/${item}`,
          method: "POST",
          status: "error",
        });

        setError(`Failed to increment ${item}. Please try again.`);
      } finally {
        setLoading(false);
        span.end();
      }
    });
  };

  // Function to reset all counters with tracing and metrics
  const resetCounters = async () => {
    if (window.confirm("Are you sure you want to reset all counters?")) {
      const startTime = performance.now();

      tracer.startActiveSpan("resetCounters", async (span) => {
        try {
          setLoading(true);
          span.setAttributes({ operation: "resetCounters" });

          // Record the reset action
          metrics.clickCounter.add(1, {
            action: "reset",
            item: "all",
          });

          await axios.post(`${API_URL}/counters/reset`);
          setCounters({
            espresso: 0,
            coldbrew: 0,
            pastries: 0,
            customers: 0,
          });
          setError(null);

          // Record successful API call duration
          const duration = performance.now() - startTime;
          metrics.apiCallDurationHistogram.record(duration, {
            endpoint: "/counters/reset",
            method: "POST",
            status: "success",
          });
        } catch (err) {
          console.error("Error resetting counters:", err);

          // Record the error in the span
          span.setStatus({ code: 2 });
          span.recordException(err);

          // Record error as a metric
          metrics.errorCounter.add(1, {
            operation: "resetCounters",
            error: err.message,
          });

          // Record failed API call duration
          const duration = performance.now() - startTime;
          metrics.apiCallDurationHistogram.record(duration, {
            endpoint: "/counters/reset",
            method: "POST",
            status: "error",
          });

          setError("Failed to reset counters. Please try again.");
        } finally {
          setLoading(false);
          span.end();
        }
      });
    }
  };

  // Calculate total items sold
  const totalItems = counters.espresso + counters.coldbrew + counters.pastries;

  // Calculate items per customer
  const itemsPerCustomer =
    counters.customers > 0
      ? (totalItems / counters.customers).toFixed(2)
      : "0.00";

  return (
    <div className="app">
      <header className="app-header">
        <h1>OTel Brew</h1>
        <p>Coffee Shop Sales Counter</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="summary-bar">
        <div className="summary-item">
          <span className="summary-label">Total Sales:</span>
          <span className="summary-value">{totalItems} items</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Items per Customer:</span>
          <span className="summary-value">{itemsPerCustomer}</span>
        </div>
        <button
          onClick={resetCounters}
          className="reset-button"
          disabled={loading}
        >
          Reset All Counters
        </button>
      </div>

      <div className="counters-container">
        <div className="counter-item customer-counter">
          <h2>Customers</h2>
          <p className="counter-value">{counters.customers}</p>
          <button
            onClick={() => incrementCounter("customers")}
            disabled={loading}
            className="counter-button customer-button"
          >
            New Customer
          </button>
        </div>

        <div className="counter-item">
          <h2>Espresso</h2>
          <p className="counter-value">{counters.espresso}</p>
          <button
            onClick={() => incrementCounter("espresso")}
            disabled={loading}
            className="counter-button espresso-button"
          >
            Add Espresso Sale
          </button>
        </div>

        <div className="counter-item">
          <h2>Cold Brew</h2>
          <p className="counter-value">{counters.coldbrew}</p>
          <button
            onClick={() => incrementCounter("coldbrew")}
            disabled={loading}
            className="counter-button coldbrew-button"
          >
            Add Cold Brew Sale
          </button>
        </div>

        <div className="counter-item">
          <h2>Pastries</h2>
          <p className="counter-value">{counters.pastries}</p>
          <button
            onClick={() => incrementCounter("pastries")}
            disabled={loading}
            className="counter-button pastries-button"
          >
            Add Pastry Sale
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
