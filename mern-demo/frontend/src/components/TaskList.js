// frontend/src/components/TaskList.js
import React from 'react';
import TaskItem from './TaskItem';
import { useTasks } from '../contexts/TaskContext';

const TaskList = () => {
  const { tasks, loading, error, filterStatus } = useTasks();

  if (loading) {
    return <div className="loader">Loading tasks...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-list">
        <p>
          {filterStatus === 'all'
            ? 'No tasks found. Add a new task to get started!'
            : `No ${filterStatus} tasks found.`}
        </p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem key={task._id} task={task} />
      ))}
    </div>
  );
};

export default TaskList;