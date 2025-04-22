// frontend/src/components/Header.js
import React from 'react';
import { useTasks } from '../contexts/TaskContext';

const Header = () => {
  const { filterStatus, setFilterStatus } = useTasks();

  return (
    <header className="header">
      <div className="container header-content">
        <h1 className="logo">Task Manager</h1>
        <div className="filter-container">
          <span>Filter: </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-dropdown"
          >
            <option value="all">All Tasks</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;