// frontend/src/App.js
import React from 'react';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { TaskProvider } from './contexts/TaskContext';
import './App.css';

function App() {
  return (
    <TaskProvider>
      <div className="app">
        <Header />
        <main className="container">
          <div className="app-content">
            <div className="form-card">
              <TaskForm />
            </div>
            <div className="tasks-card">
              <TaskList />
            </div>
          </div>
        </main>
        <footer className="footer">
          <div className="container">
            <p>Task Management App &copy; 2025</p>
          </div>
        </footer>
      </div>
    </TaskProvider>
  );
}

export default App;