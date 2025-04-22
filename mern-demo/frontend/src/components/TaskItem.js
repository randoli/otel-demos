// frontend/src/components/TaskItem.js
import React, { useState } from 'react';
import { format } from 'date-fns';
import { useTasks } from '../contexts/TaskContext';

const TaskItem = ({ task }) => {
  const { updateTask, deleteTask } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = async (e) => {
    try {
      await updateTask(task._id, { status: e.target.value });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleSave = async () => {
    try {
      await updateTask(task._id, editedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.substring(0, 10) : '',
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(task._id);
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getPriorityClass = () => {
    return `priority-tag priority-${task.priority}`;
  };

  if (isEditing) {
    return (
      <div className="task-item editing">
        <div className="edit-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={editedTask.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={editedTask.description || ''}
              onChange={handleChange}
              rows="2"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={editedTask.status}
                onChange={handleChange}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Priority</label>
              <select
                name="priority"
                value={editedTask.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={editedTask.dueDate || ''}
              onChange={handleChange}
            />
          </div>
          
          <div className="button-group">
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-item">
      <div className="task-content">
        <h3 className="task-title">{task.title}</h3>
        <div className={getPriorityClass()}>{task.priority}</div>
        
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        
        {task.dueDate && (
          <div className="task-due-date">
            Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
          </div>
        )}
        
        <div className="task-status">
          <select
            value={task.status}
            onChange={handleStatusChange}
            className="status-dropdown"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      
      <div className="task-actions">
        <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button className="btn btn-delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskItem;