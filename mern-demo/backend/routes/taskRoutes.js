const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByStatus,
} = require("../controllers/taskController");

router.route("/").get(getTasks).post(createTask);
router.route("/status/:status").get(getTasksByStatus);
router.route("/:id").get(getTaskById).put(updateTask).delete(deleteTask);

module.exports = router;
