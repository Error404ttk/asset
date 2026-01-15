# Project Overview

This is a full-stack web application for managing computer equipment inventory. The project is named "ระบบสำรวจครุภัณฑ์คอมพิวเตอร์" (Computer Equipment Inventory System).

## Architecture

The project follows a client-server architecture:

*   **Frontend:** A single-page application built with React and Vite. It uses `react-router-dom` for navigation and includes components for a dashboard, asset management, user management, reporting, and system settings. The UI is styled with Tailwind CSS (inferred from `tailwind.config.js`) and uses `lucide-react` for icons.
*   **Backend:** A Node.js server using the Express framework. It provides a RESTful API for the frontend to interact with the database.
*   **Database:** A MySQL database is used for data storage. The backend connects to it using the `mysql2` library.

## Key Technologies

*   **Frontend:**
    *   React
    *   Vite
    *   TypeScript
    *   React Router
    *   Recharts for data visualization
*   **Backend:**
    *   Node.js
    *   Express
    *   MySQL

# Building and Running

## Prerequisites

*   Node.js
*   A running MySQL instance

## Frontend

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set environment variables:**
    Create a `.env.local` file in the root directory and add the following:
    ```
    GEMINI_API_KEY=your_gemini_api_key
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Backend

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set environment variables:**
    Create a `.env` file in the `server` directory and add the following:
    ```
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    ```
4.  **Run the server:**
    ```bash
    node server.js
    ```
    The server will be running on `http://localhost:3001`.

# Development Conventions

*   The frontend code is written in TypeScript (`.tsx` files).
*   The backend code is written in JavaScript.
*   The project uses environment variables to manage configuration for both the frontend and backend.
*   The frontend uses a context-based approach for state management (`AssetContext`, `ToastContext`).
*   The backend API routes are organized into separate modules in the `server/routes` directory.
