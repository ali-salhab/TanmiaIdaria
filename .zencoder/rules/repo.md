---
description: Repository Information Overview
alwaysApply: true
---

# Repository Information Overview

## Repository Summary

**Tanmia Idaria** is a full-stack MERN (MongoDB, Express.js, React, Node.js) monorepo application for personnel management and HR operations. The system provides features for employee management, incident tracking, vacation management, user administration, and real-time notifications using Socket.io.

## Repository Structure

### Main Repository Components
- **backend/**: Express.js REST API server with MongoDB integration, employee/incident/vacation management, file uploads, and real-time Socket.io support
- **frontend/**: React 19 single-page application with Vite build tool, component-based UI with Tailwind CSS styling, and responsive dashboard
- **Root Configuration**: Minimal monorepo setup with individual package.json files per subproject

---

## Projects

### Frontend Application
**Configuration File**: `frontend/package.json`

#### Language & Runtime
**Language**: JavaScript (React)
**Runtime**: Node.js
**Framework**: React 19.1.1
**Build Tool**: Vite 7.1.7
**Package Manager**: npm
**Build Output**: Optimized production build in `dist/` directory

#### Dependencies
**Main Dependencies**:
- **React Ecosystem**: react, react-dom, react-router-dom (routing)
- **HTTP Client**: axios (API communication)
- **Real-time**: socket.io-client (real-time notifications)
- **Styling**: tailwindcss, postcss, autoprefixer
- **UI Components**: @headlessui/react, @heroicons/react, lucide-react, react-icons
- **Document Export**: jspdf, jspdf-autotable, xlsx, file-saver
- **Animations**: framer-motion
- **Utilities**: jwt-decode (token parsing), react-hot-toast (notifications)

**Development Dependencies**:
- **Build & Dev**: @vitejs/plugin-react, vite
- **Linting**: eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh
- **CSS**: @tailwindcss/postcss, tailwindcss, autoprefixer
- **Type Definitions**: @types/react, @types/react-dom (type hints)

#### Build & Installation
```bash
npm install
npm run dev      # Start development server with HMR (http://localhost:5173)
npm run build    # Compile to production build
npm run preview  # Preview production build
npm run lint     # Run ESLint checks
```

#### Project Structure
- **src/pages/**: Page components (Dashboard, EmployeeList, EmployeeEdit, EmployeeIncidents, EmployeeVacations, Login, Register, Users, Notifications, etc.)
- **src/components/**: Reusable UI components (Navbar, Sidebar, Pagination, ChatWindow, IncidentAddDialog, etc.)
- **src/context/**: React Context (SocketContext for real-time updates)
- **src/hooks/**: Custom hooks (useAuth for authentication)
- **src/api/**: API client configuration (axios instance)
- **src/assets/**: SVG/PNG assets and logos
- **src/routes/**: Route protection (PrivateRoute)
- **vite.config.js**: Build configuration with React plugin
- **tailwind.config.js**: Custom theme with primary (#1E3A8A) and secondary (#2563EB) colors, custom animations
- **eslint.config.js**: ESLint configuration for React/JSX linting

---

### Backend API Server
**Configuration File**: `backend/package.json`

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Runtime**: Node.js with ES Modules (type: "module")
**Framework**: Express.js 4.21.2
**Database**: MongoDB with Mongoose 7.0.0 ODM
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- **Web Framework**: express
- **Database**: mongoose (MongoDB ODM)
- **Authentication**: bcryptjs, jsonwebtoken (JWT)
- **Real-time**: socket.io
- **Middleware**: cors, helmet, morgan (logging), compression, express-validator
- **File Upload**: multer
- **Document Generation**: docx, docxtemplater, pdfkit, pdfmake, exceljs, xlsx, pizzip
- **Environment**: dotenv

**Development Dependencies**:
- **Auto-reload**: nodemon

#### Build & Installation
```bash
npm install
npm start   # Run production server
npm run dev # Run with nodemon (auto-restart on file changes)
```

#### Main Components
- **server.js**: Express server entry point with Socket.io integration, CORS configuration (http://12.0.0.173:5173, http://localhost:5173), middleware setup, routes initialization, and real-time event handling
- **models/**: MongoDB schemas for Employee, User, Incident, Vacation, ActivityLog
- **controllers/**: Business logic for employeeController, userController, incidentController, vacationController
- **routes/**: API endpoints for auth, employees, incidents, vacations, users, operations
- **middleware/**: Authentication middleware, file upload handling (multer)
- **utils/**: Helper functions like generatePersonalCard.js
- **uploads/**: Directory for user uploads (images, documents, Excel files)
- **templates/**: Document templates for PDF/Excel generation

#### API Endpoints
- `/api/auth`: Authentication (login, register)
- `/api/employees`: Employee management (CRUD operations)
- `/api/incidents`: Incident tracking
- `/api/vacations`: Vacation/leave management (routes in voctionRoutes.js)
- `/api/users`: User administration
- `/api/operations`: Operations management
- `/api/excel-cv/:id`: Generate employee CV in Excel
- `/uploads`: Static file serving for uploaded content
- `/api/test`: Health check endpoint

#### Features
- **Real-time Communication**: Socket.io integration for live notifications, admin registration, user online tracking
- **File Management**: Image, document, and spreadsheet uploads with multer
- **Document Generation**: PDF and Excel export capabilities for employee records
- **Security**: Helmet for HTTP headers, CORS configuration, JWT-based authentication
- **Logging**: Morgan middleware for HTTP request logging
- **Compression**: Gzip compression for response optimization
- **Validation**: Express-validator for input validation
- **Database**: MongoDB connection with Mongoose ODM

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `frontend/vite.config.js` | Vite build configuration with React plugin |
| `frontend/tailwind.config.js` | Tailwind CSS theme and custom utilities |
| `frontend/eslint.config.js` | ESLint rules for React/JSX code quality |
| `frontend/postcss.config.js` | PostCSS plugins (Tailwind, Autoprefixer) |
| `backend/server.js` | Express server setup and route initialization |
| `backend/.env` | Backend environment variables (MongoDB URI, JWT secret, ports) |
| `frontend/.env` | Frontend environment variables (API base URL) |

## Development Workflow

**Frontend Development**:
1. Navigate to `frontend/` directory
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start Vite dev server
4. Code changes trigger hot module replacement (HMR)
5. Run `npm run lint` to check code quality
6. Run `npm run build` for production build

**Backend Development**:
1. Navigate to `backend/` directory
2. Run `npm install` to install dependencies
3. Configure `.env` with MongoDB connection and other settings
4. Run `npm run dev` to start server with nodemon
5. Server auto-reloads on file changes
6. MongoDB connection established on startup

**Communication**: Frontend connects to backend API (default: localhost) and Socket.io for real-time updates. Both frontend and backend use CORS for cross-origin communication.
