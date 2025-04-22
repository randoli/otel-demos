// backend/controllers/taskController.js

const Task = require("../models/Task");
// Import the trace API from OpenTelemetry
const { trace } = require("@opentelemetry/api");

// Get a tracer instance for the backend service
const tracer = trace.getTracer("task-management-backend");

/**
 * @desc    Get all tasks
 * @route   GET /api/tasks
 * @access  Public
 */
const getTasks = async (req, res) => {
  // Start a new span for this controller action
  return tracer.startActiveSpan("controller.getTasks", async (span) => {
    try {
      // Add an event to mark the beginning of the database query
      // Events are like checkpoints in the span's timeline
      span.addEvent("Fetching all tasks");

      // Execute the database query
      const tasks = await Task.find({}).sort({ createdAt: -1 });

      // Add business metrics as span attributes
      span.setAttributes({
        "tasks.count": tasks.length,
      });

      // Mark the span as successful
      span.setStatus({ code: 0 });

      res.json(tasks);
    } catch (error) {
      // Mark the span as failed
      span.setStatus({ code: 1, message: error.message });

      // Record the exception details in the span
      // This provides more context than just the status
      span.recordException(error);

      res.status(500).json({ message: "Server Error" });
    } finally {
      // Always end the span to prevent leaks
      span.end();
    }
  });
};

/**
 * @desc    Get task by ID
 * @route   GET /api/tasks/:id
 * @access  Public
 */
const getTaskById = async (req, res) => {
  return tracer.startActiveSpan("controller.getTaskById", async (span) => {
    try {
      // Record which task we're looking for
      span.setAttributes({
        "task.id": req.params.id,
      });

      // Find the task by ID
      const task = await Task.findById(req.params.id);

      if (task) {
        span.setStatus({ code: 0 });
        res.json(task);
      } else {
        // Add context about why the operation failed
        span.setAttributes({
          "error.type": "not_found",
        });

        // Record an event for the not-found condition
        span.addEvent("Task not found");

        span.setStatus({ code: 1, message: "Task not found" });
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      span.recordException(error);
      res.status(500).json({ message: "Server Error" });
    } finally {
      span.end();
    }
  });
};

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Public
 */
const createTask = async (req, res) => {
  return tracer.startActiveSpan("controller.createTask", async (span) => {
    try {
      const { title, description, status, priority, dueDate } = req.body;

      // Add detailed business context to the span
      // These attributes are useful for analyzing trace data
      span.setAttributes({
        "task.title": title,
        "task.priority": priority || "medium",
        "task.has_description": Boolean(description),
        "task.has_due_date": Boolean(dueDate),
      });

      // Validate the input
      if (!title) {
        // Add event with details about the validation failure
        span.addEvent("Validation failed", { reason: "Missing title" });
        span.setStatus({ code: 1, message: "Title is required" });
        return res.status(400).json({ message: "Title is required" });
      }

      // Mark the task creation in the span timeline
      span.addEvent("Creating new task");

      // Create and save the task
      const task = new Task({
        title,
        description,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate || null,
      });

      const createdTask = await task.save();

      // Add the generated task ID to the span
      span.setAttributes({
        "task.id": createdTask._id.toString(),
      });

      span.setStatus({ code: 0 });
      res.status(201).json(createdTask);
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      span.recordException(error);
      res.status(500).json({ message: "Server Error" });
    } finally {
      span.end();
    }
  });
};

/**
 * @desc    Update a task
 * @route   PUT /api/tasks/:id
 * @access  Public
 */
const updateTask = async (req, res) => {
  return tracer.startActiveSpan("controller.updateTask", async (span) => {
    try {
      const { title, description, status, priority, dueDate } = req.body;

      // Record which task is being updated and what fields
      span.setAttributes({
        "task.id": req.params.id,
        "task.update_fields": Object.keys(req.body).join(","),
      });

      // Mark the start of the find operation
      span.addEvent("Finding task to update");

      const task = await Task.findById(req.params.id);

      if (task) {
        // Update the task fields
        task.title = title || task.title;
        task.description =
          description !== undefined ? description : task.description;
        task.status = status || task.status;
        task.priority = priority || task.priority;
        task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;

        // Mark the save operation in the timeline
        span.addEvent("Saving updated task");

        const updatedTask = await task.save();
        span.setStatus({ code: 0 });
        res.json(updatedTask);
      } else {
        // Add context about why the update failed
        span.setAttributes({
          "error.type": "not_found",
        });

        span.addEvent("Task not found for update");
        span.setStatus({ code: 1, message: "Task not found" });
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      span.recordException(error);
      res.status(500).json({ message: "Server Error" });
    } finally {
      span.end();
    }
  });
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Public
 */
const deleteTask = async (req, res) => {
  return tracer.startActiveSpan("controller.deleteTask", async (span) => {
    try {
      // Record which task we're trying to delete
      span.setAttributes({
        "task.id": req.params.id,
      });

      // Mark the find operation in the timeline
      span.addEvent("Finding task to delete");

      const task = await Task.findById(req.params.id);

      if (task) {
        // Mark the deletion in the timeline
        span.addEvent("Removing task");

        await task.deleteOne();
        span.setStatus({ code: 0 });
        res.json({ message: "Task removed" });
      } else {
        // Add context about why the deletion failed
        span.setAttributes({
          "error.type": "not_found",
        });

        span.addEvent("Task not found for deletion");
        span.setStatus({ code: 1, message: "Task not found" });
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      span.recordException(error);
      res.status(500).json({ message: "Server Error" });
    } finally {
      span.end();
    }
  });
};

/**
 * @desc    Get tasks by status
 * @route   GET /api/tasks/status/:status
 * @access  Public
 */
const getTasksByStatus = async (req, res) => {
  return tracer.startActiveSpan("controller.getTasksByStatus", async (span) => {
    try {
      const status = req.params.status;

      // Record which status we're filtering by
      span.setAttributes({
        "task.status": status,
      });

      // Validate the status parameter
      if (!["todo", "in-progress", "completed"].includes(status)) {
        // Add detailed context about the validation error
        span.setAttributes({
          "error.type": "validation",
          "error.reason": "invalid_status",
        });

        span.addEvent("Invalid status parameter");
        span.setStatus({ code: 1, message: "Invalid status" });
        return res.status(400).json({ message: "Invalid status" });
      }

      // Mark the database query in the timeline
      span.addEvent(`Fetching tasks with status: ${status}`);

      const tasks = await Task.find({ status }).sort({ createdAt: -1 });

      // Add business metrics about the result
      span.setAttributes({
        "tasks.count": tasks.length,
      });

      span.setStatus({ code: 0 });
      res.json(tasks);
    } catch (error) {
      span.setStatus({ code: 1, message: error.message });
      span.recordException(error);
      res.status(500).json({ message: "Server Error" });
    } finally {
      span.end();
    }
  });
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByStatus,
};
