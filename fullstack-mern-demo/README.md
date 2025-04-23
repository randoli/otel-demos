# MERN Stack OpenTelemetry Demo App

A streamlined MERN stack application for a local coffee shop to track sales counts of Espresso, Cold Brew, Pastries, and Customers. This application is designed to be simple and clear for demonstrating OpenTelemetry instrumentation.

## Project Structure

```
otel-brew/
├── backend/
│   ├── server.js             # Express server with MongoDB connection
│   └── package.json          # Backend dependencies and scripts
│
├── frontend/
│   ├── index.html            # Vite entry point HTML
│   ├── vite.config.js        # Vite configuration
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── App.jsx           # Main application component
│   │   ├── App.css           # Application styling
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Base styling
│   └── package.json          # Frontend dependencies
│
└── README.md                 # Project documentation
```

## Features

- **Customer Counter**: Track customer visits separately from product sales
- **Product Sales**: Count sales of espresso, cold brew, and pastries
- **Summary Statistics**: View total sales and items per customer
- **Reset Functionality**: Reset all counters for demo purposes

## Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local installation or MongoDB Atlas)

## Setup and Running

### Backend

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the server:
   ```
   npm run dev
   ```
   The server will run on http://localhost:5000

### Frontend

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The application will open in your browser at http://localhost:3000

## API Endpoints

The backend provides the following endpoints:

- `GET /counters` - Get the current counts for all items
- `POST /counters/:item` - Increment the count for a specific item (where `:item` is one of: `espresso`, `coldbrew`, `pastries`, or `customers`)
- `POST /counters/reset` - Reset all counters to zero

## MongoDB Structure

The application uses a simple MongoDB document within the `counters` collection with the following structure:

```javascript
{
  "espresso": 0,
  "coldbrew": 0,
  "pastries": 0,
  "customers": 0
}
```

This document is automatically created when the application first runs.

## OpenTelemetry Considerations

This application is designed with a simple structure to allow for clear OpenTelemetry instrumentation:

1. **Clear Data Flow**: Simple request/response patterns between frontend and backend
2. **Minimal Complexity**: Straightforward MongoDB interactions with a clean schema
3. **Real-World Relatability**: Maintains coffee shop business context while being simple to understand
4. **Key Instrumentation Points**:
   - API endpoints for tracking request flow
   - Database operations for monitoring persistence
   - Frontend UI interactions for end-to-end tracing

## Installation with Vite

### Creating the Project

1. **Create the backend folder**:

   ```bash
   mkdir -p otel-brew/backend
   ```

2. **Initialize the backend**:

   ```bash
   cd otel-brew/backend
   npm init -y
   npm install express mongoose cors body-parser
   npm install --save-dev nodemon
   ```

3. **Create the frontend with Vite**:

   ```bash
   cd ..
   npm create vite@latest frontend -- --template react
   ```

4. **Install additional frontend dependencies**:
   ```bash
   cd frontend
   npm install axios
   ```

### Running the Application

1. **Start MongoDB** locally (ensure it's running on the default port 27017).

2. **Start the backend server**:

   ```bash
   cd otel-brew/backend
   npm run dev
   ```

3. **Start the frontend application** (in a new terminal):
   ```bash
   cd otel-brew/frontend
   npm run dev
   ```
