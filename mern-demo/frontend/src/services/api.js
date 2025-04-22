// frontend/src/services/api.js

import axios from 'axios';
// Import the trace API from OpenTelemetry
import { trace } from '@opentelemetry/api';

// API base URL - using environment variable or default to localhost
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get a tracer instance from the global registry
// The name 'task-management-frontend' helps identify which service generated the spans
const tracer = trace.getTracer('task-management-frontend');

/**
 * Fetch all tasks with OpenTelemetry tracing
 * @returns {Promise<Array>} List of tasks
 */
export const getTasks = async () => {
  // Start a new span for this operation
  // This creates a named span that will appear in the trace visualization
  return tracer.startActiveSpan('frontend.getTasks', async (span) => {
    try {
      // Make the API call
      const response = await api.get('/tasks');
      
      // Mark the span as successful
      // code 0 = success in OpenTelemetry
      span.setStatus({ code: 0 });
      
      return response.data;
    } catch (error) {
      // Mark the span as failed and include error details
      // code 1 = error in OpenTelemetry
      span.setStatus({ code: 1, message: error.message });
      console.error('Error fetching tasks:', error);
      throw error;
    } finally {
      // Always end the span to prevent leaks
      // This is crucial - forgetting to end spans will cause issues
      span.end();
    }
  });
};

/**
 * Fetch tasks filtered by status with OpenTelemetry tracing
 * @param {string} status - The status to filter by (todo, in-progress, completed)
 * @returns {Promise<Array>} List of filtered tasks
 */
export const getTasksByStatus = async (status) => {
  return tracer.startActiveSpan('frontend.getTasksByStatus', async (span) => {
    try {
      // Add the status as an attribute to provide context to the span
      // This helps when analyzing traces - you can filter or group by these attributes
      span.setAttributes({ 'task.status': status });
      
      const response = await api.get(`/tasks/status/${status}`);
      span.setStatus({ code: 0 });
      return response.data;
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      console.error(`Error fetching ${status} tasks:`, error);
      throw error;
    } finally {
      span.end();
    }
  });
};

/**
 * Fetch a single task by ID with OpenTelemetry tracing
 * @param {string} id - Task ID
 * @returns {Promise<Object>} Task details
 */
export const getTaskById = async (id) => {
  return tracer.startActiveSpan('frontend.getTaskById', async (span) => {
    try {
      // Record the task ID to help with debugging and analysis
      span.setAttributes({ 'task.id': id });
      
      const response = await api.get(`/tasks/${id}`);
      span.setStatus({ code: 0 });
      return response.data;
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      console.error('Error fetching task details:', error);
      throw error;
    } finally {
      span.end();
    }
  });
};

/**
 * Create a new task with OpenTelemetry tracing
 * @param {Object} taskData - Task data (title, description, etc.)
 * @returns {Promise<Object>} Created task
 */
export const createTask = async (taskData) => {
  return tracer.startActiveSpan('frontend.createTask', async (span) => {
    try {
      // Add business-relevant attributes to help with trace analysis
      // These will be visible in the trace details
      span.setAttributes({ 
        'task.title': taskData.title,
        'task.priority': taskData.priority || 'medium'
      });
      
      const response = await api.post('/tasks', taskData);
      span.setStatus({ code: 0 });
      return response.data;
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      console.error('Error creating task:', error);
      throw error;
    } finally {
      span.end();
    }
  });
};

/**
 * Update a task with OpenTelemetry tracing
 * @param {string} id - Task ID
 * @param {Object} taskData - Updated task data
 * @returns {Promise<Object>} Updated task
 */
export const updateTask = async (id, taskData) => {
  return tracer.startActiveSpan('frontend.updateTask', async (span) => {
    try {
      // Record what's being updated to help with debugging
      span.setAttributes({ 
        'task.id': id,
        'task.title': taskData.title || 'unknown',
        // This shows which fields are being updated
        'task.update_type': Object.keys(taskData).join(',')
      });
      
      const response = await api.put(`/tasks/${id}`, taskData);
      span.setStatus({ code: 0 });
      return response.data;
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      console.error('Error updating task:', error);
      throw error;
    } finally {
      span.end();
    }
  });
};

/**
 * Delete a task with OpenTelemetry tracing
 * @param {string} id - Task ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteTask = async (id) => {
  return tracer.startActiveSpan('frontend.deleteTask', async (span) => {
    try {
      span.setAttributes({ 'task.id': id });
      
      const response = await api.delete(`/tasks/${id}`);
      span.setStatus({ code: 0 });
      return response.data;
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      console.error('Error deleting task:', error);
      throw error;
    } finally {
      span.end();
    }
  });
};