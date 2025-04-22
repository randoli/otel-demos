// frontend/src/context/TaskContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../services/api';

const TaskContext = createContext();

export const useTasks = () => {
  return useContext(TaskContext);
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add new task
  const addTask = async (taskData) => {
    try {
      setLoading(true);
      const newTask = await createTask(taskData);
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      return newTask;
    } catch (err) {
      setError('Failed to add task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const updateTaskById = async (id, taskData) => {
    try {
      setLoading(true);
      const updatedTask = await updateTask(id, taskData);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task._id === id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      setError('Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const deleteTaskById = async (id) => {
    try {
      setLoading(true);
      await deleteTask(id);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
    } catch (err) {
      setError('Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks by status
  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filterStatus);

  const value = {
    tasks: filteredTasks,
    loading,
    error,
    filterStatus,
    setFilterStatus,
    fetchTasks,
    addTask,
    updateTask: updateTaskById,
    deleteTask: deleteTaskById,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};