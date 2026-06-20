# Project Structure and Organization

## Root Directory Layout

```
CRM tool/
├── .git/                    # Git repository
├── .kilo/                   # Kilo workspace config
├── .kiro/                   # Kiro AI settings
│   └── steering/            # This directory - project guidance
├── CRM-system/              # Main application code
│   ├── backend/             # Node.js/Express API server
│   └── frontend/            # React application
└── [migration files]        # Legacy migration artifacts
```

## Backend Structure (`CRM-system/backend/`)

### Core Directories

- **`models/`** - Mongoose schema definitions
  - Each file represents a MongoDB collection
  - Schema validation and business rules
  - Examples: `User.js`, `Client.js`, `Deal.js`, `Tenant.js`

- **`routes/`** - Express route handlers
  - One file per resource/feature
  - RESTful endpoint definitions
  - Route-level validation
  - Examples: `auth.js`, `clients.js`, `deals.js`

- **`middleware/`** - Express middleware functions
  - `auth.js` - JWT authentication
  - `tenantAuth.js` - Multi-tenant isolation
  - `rateLimiter.js` - API rate limiting

- **`services/`** - Business logic layer
  - `emailService.js` - Email sending functionality
  - Reusable service functions
  - External API integrations

- **`utils/`** - Helper functions and utilities
  - `auditLog.js` - Audit trail creation
  - `exportBuilders.js` - PDF/CSV generation
  - `notifications.js` - Notification helpers
  - `ratingSystem.js` - Performance calculations

- **`jobs/`** - Scheduled background tasks
  - `taskReminderJob.js` - Cron job for task reminders
  - `scheduledExportJob.js` - Automated report generation

- **`scripts/`** - Admin and maintenance scripts
  - User management utilities
  - Database migration helpers
  - Testing and debugging tools

- **`uploads/`** - File upload storage
  - User-uploaded files (images, documents)
  - Served via `/uploads` static route

### Key Files

- **`server.js`** - Application entry point
  - Express app configuration
  - Middleware setup
  - Route registration
  - MongoDB connection
  - Server initialization

- **`.env`** - Environment variables (NOT in git)
  - Database credentials
  - API keys
  - JWT secrets

## Frontend Structure (`CRM-system/frontend/`)

### Source Directory (`src/`)

- **`pages/`** - Route-level components
  - **`admin/`** - Admin/Manager role pages
    - `Dashboard.js`, `UserManagement.js`, `Reports.js`, `Settings.js`
  - **`agent/`** - Agent/Sales role pages
    - `Dashboard.js`, `Clients.js`, `Leads.js`, `Deals.js`, `Sales.js`
  - **`superadmin/`** - Super Admin role pages
    - `SuperAdminDashboard.js`, `TenantManagement.js`
  - Root-level shared pages: `Login.js`, `Dashboard.js`, `ChangePassword.js`

- **`components/`** - Reusable UI components
  - `Layout.js` - Main app wrapper with navigation
  - `FormModal.js` - Generic form modal
  - `LoadingSpinner.js` - Loading states
  - `NotificationCenter.js` - Notification display
  - **`charts/`** - Data visualization components

- **`context/`** - React Context providers
  - `AuthContext.js` - Authentication state
  - `ThemeContext.js` - Theme/dark mode state

- **`services/`** - API communication layer
  - Axios instance configuration
  - API endpoint wrappers
  - Request/response interceptors

- **`utils/`** - Frontend helper functions
  - Formatting utilities
  - Validation helpers
  - Common calculations

- **`assets/`** - Static assets (images, fonts)

### Configuration Files

- **`App.js`** - Main application component
  - React Router configuration
  - Protected route logic
  - Role-based navigation

- **`index.js`** - React entry point
  - Root render
  - Provider wrapping

- **`index.css`** - Global styles and Tailwind imports

- **`tailwind.config.js`** - Tailwind customization
  - Theme extensions
  - Custom utilities
  - Responsive breakpoints

- **`postcss.config.js`** - PostCSS configuration

## Multi-Tenant Architecture

### Data Isolation Pattern

All tenant-specific data includes a `tenant` field (ObjectId reference):

```javascript
// In models
tenant: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Tenant',
  required: true
}
```

### Middleware Flow

1. User authenticates → JWT token with `tenantId`
2. Request passes through `tenantAuth.js` middleware
3. Middleware attaches `req.user.tenant` to request
4. Routes filter queries by `tenant: req.user.tenant`

### Super Admin Exception

- Super Admins bypass tenant filtering
- Can access cross-tenant data for management
- Special routes under `/api/tenants/*`

## API Route Organization

Routes follow RESTful conventions:

```
/api/auth/*          - Authentication endpoints
/api/users/*         - User management
/api/tenants/*       - Tenant management (super admin)
/api/clients/*       - Client/Lead management
/api/deals/*         - Deal pipeline
/api/sales/*         - Sales records
/api/meetings/*      - Meeting scheduler
/api/schedules/*     - Task/schedule management
/api/performance/*   - Performance metrics
/api/reports/*       - Report generation
/api/notifications/* - Notification system
```

## File Naming Conventions

### Backend
- **Models**: PascalCase singular (e.g., `Client.js`, `User.js`)
- **Routes**: camelCase plural (e.g., `clients.js`, `users.js`)
- **Middleware**: camelCase descriptive (e.g., `auth.js`, `tenantAuth.js`)
- **Services**: camelCase with Service suffix (e.g., `emailService.js`)

### Frontend
- **Components**: PascalCase (e.g., `Layout.js`, `FormModal.js`)
- **Pages**: PascalCase (e.g., `Dashboard.js`, `Clients.js`)
- **Context**: PascalCase with Context suffix (e.g., `AuthContext.js`)
- **Utils**: camelCase (e.g., `formatters.js`, `validators.js`)

## Import Patterns

### Backend (ES Modules)
```javascript
import express from 'express';
import { authMiddleware } from './middleware/auth.js';
import Client from './models/Client.js';
```
**Note**: Always include `.js` extension in imports

### Frontend (React)
```javascript
import React from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
```

## Protected Routes Pattern

Frontend uses `ProtectedRoute` wrapper component:
- Checks authentication status
- Validates user role against `allowedRoles`
- Redirects unauthorized users
- Wraps content in `Layout` component

## State Management

- **Global State**: React Context (Auth, Theme)
- **Local State**: React hooks (useState, useEffect)
- **Server State**: Direct API calls (no Redux)
- **Form State**: Controlled components

## Testing Structure

- Backend tests in root of `backend/` (e.g., `test-api.js`)
- Frontend tests alongside components (`.test.js` suffix)
- Integration tests use Axios for API calls

## Environment Separation

- **Development**: Local MongoDB, port 3000 (frontend) + 5000 (backend)
- **Production**: MongoDB Atlas, environment-specific CORS origins
- Multiple `.env` files for different environments
