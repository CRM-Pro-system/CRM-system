# Technology Stack

## Architecture

Full-stack JavaScript application with separate frontend and backend, using a REST API architecture.

## Backend

### Core Stack
- **Runtime**: Node.js with ES Modules (`"type": "module"`)
- **Framework**: Express.js (REST API)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) with bcryptjs for password hashing

### Key Libraries
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment configuration
- `express-validator` - Input validation
- `express-rate-limit` - API rate limiting
- `multer` - File upload handling
- `nodemailer` - Email service
- `twilio` - SMS/Voice integration
- `pdfkit` - PDF generation
- `csv-writer` - CSV export functionality
- `node-cron` - Scheduled job execution
- `pug` - Template engine

### Development Tools
- `nodemon` - Hot reload during development
- `axios` - HTTP client for testing

## Frontend

### Core Stack
- **Framework**: React 18 with Create React App
- **Router**: React Router DOM v6
- **Styling**: Tailwind CSS 3 with custom configuration
- **State Management**: React Context API (AuthContext, ThemeContext)

### Key Libraries
- `axios` - API communication
- `react-hot-toast` - Toast notifications
- `framer-motion` - Animations
- `lucide-react` - Icon library
- `recharts` - Data visualization and charts
- `@hello-pangea/dnd` - Drag and drop functionality
- `html2canvas` & `jspdf` - Export/download features
- `file-saver` - File download utility

### Development Tools
- `autoprefixer` & `postcss` - CSS processing
- ESLint with React configuration
- Jest and React Testing Library

## Project Structure

```
CRM-system/
├── backend/
│   ├── models/          # Mongoose schemas (Client, User, Deal, etc.)
│   ├── routes/          # Express route handlers
│   ├── middleware/      # Auth, rate limiting, tenant isolation
│   ├── services/        # Business logic (email, notifications)
│   ├── jobs/            # Cron jobs (reminders, exports)
│   ├── utils/           # Helper functions (audit logs, exports)
│   ├── scripts/         # Admin/maintenance scripts
│   ├── uploads/         # File upload storage
│   ├── server.js        # Application entry point
│   └── .env             # Environment variables
│
└── frontend/
    ├── public/          # Static assets
    └── src/
        ├── components/  # Reusable UI components
        ├── pages/       # Route-level components
        │   ├── admin/
        │   ├── agent/
        │   └── superadmin/
        ├── context/     # React Context providers
        ├── services/    # API service layer
        ├── utils/       # Helper functions
        ├── App.js       # Main app with routing
        └── index.js     # React entry point
```

## Common Commands

### Backend
```bash
# Development with hot reload
npm run dev

# Production start
npm start

# Initial setup (create admin user)
npm run setup

# Ensure admin exists
npm run ensure:admin

# Sync data to MongoDB Atlas
npm run sync:atlas
```

### Frontend
```bash
# Development server (port 3000)
npm start

# Production build
npm run build

# Run tests
npm test
```

## Environment Configuration

### Backend (.env)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 5000)
- `CORS_ORIGINS` - Allowed frontend origins (comma-separated)
- Email service credentials (nodemailer)
- Twilio credentials for SMS/Voice

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API endpoint
- Environment-specific configs (.env.development, .env.production)

## Database

- **Primary**: MongoDB (cloud-hosted on MongoDB Atlas)
- **ODM**: Mongoose with schema validation
- **Collections**: Users, Tenants, Clients, Deals, Sales, Meetings, Schedules, Notifications, AuditLogs, etc.

## API Architecture

- RESTful endpoints with `/api` prefix
- JWT-based authentication middleware
- Tenant isolation via middleware (`tenantAuth.js`)
- Role-based access control (RBAC)
- Rate limiting on sensitive endpoints

## Styling Conventions

- Tailwind utility classes for all styling
- Custom theme extensions in `tailwind.config.js`
- Responsive design using Tailwind breakpoints
- Dark mode support via ThemeContext
- Glassmorphism effects for modern UI

## Code Style

- ES6+ syntax with ES Modules
- Async/await for asynchronous operations
- Destructuring for imports and props
- Lazy loading for React components (code splitting)
- Environment-based configuration
