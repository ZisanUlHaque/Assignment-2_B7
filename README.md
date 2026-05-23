# DevPulse – Internal Tech Issue & Feature Tracker

A collaborative platform for software teams to report bugs, suggest features,
and coordinate resolutions.

Live URL: https://dev-pulse-lac.vercel.app/

---

## Features

- User registration and authentication with JWT
- Role-based access control (contributor / maintainer)
- Create, read, update, and delete issues
- Filter issues by type and status
- Sort issues by newest or oldest
- Reporter details attached to every issue response
- Password hashing with bcrypt
- Global error handling
- Request logging

---

## Tech Stack

| Technology       | Usage                              |
|------------------|------------------------------------|
| Node.js          | Runtime environment                |
| TypeScript       | Type safety                        |
| Express.js       | Web framework                      |
| PostgreSQL        | Relational database                |
| pg (node-postgres)| Native PostgreSQL driver          |
| Raw SQL          | Direct pool.query() — no ORM      |
| bcrypt           | Password hashing                   |
| jsonwebtoken     | JWT generation and verification    |
| dotenv           | Environment variable management    |
| cors             | Cross-origin resource sharing      |

---

## Setup Instructions

### 1. Clone the repository

git clone https://github.com/yourusername/devpulse.git
cd devpulse

### 2. Install dependencies

npm install

### 3. Create environment file

Create a `.env` file in the root directory:

CONNECTIONSTRING=your_postgresql_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

### 4. Run in development mode

npm run dev

### 5. Build for production

npm run build
npm start

---

## Database Schema

### Table: users

| Column     | Type         | Constraints                              |
|------------|--------------|------------------------------------------|
| id         | SERIAL       | PRIMARY KEY                              |
| name       | VARCHAR(255) | NOT NULL                                 |
| email      | VARCHAR(255) | UNIQUE, NOT NULL                         |
| password   | TEXT         | NOT NULL (hashed, never returned)        |
| role       | VARCHAR(20)  | DEFAULT 'contributor', CHECK (contributor, maintainer) |
| created_at | TIMESTAMP    | DEFAULT NOW()                            |
| updated_at | TIMESTAMP    | DEFAULT NOW()                            |

### Table: issues

| Column      | Type         | Constraints                                     |
|-------------|--------------|-------------------------------------------------|
| id          | SERIAL       | PRIMARY KEY                                     |
| title       | VARCHAR(150) | NOT NULL                                        |
| description | TEXT         | NOT NULL                                        |
| type        | VARCHAR(20)  | NOT NULL, CHECK (bug, feature_request)          |
| status      | VARCHAR(20)  | DEFAULT 'open', CHECK (open, in_progress, resolved) |
| reporter_id | INT          | NOT NULL (validated in application logic)       |
| created_at  | TIMESTAMP    | DEFAULT NOW()                                   |
| updated_at  | TIMESTAMP    | DEFAULT NOW()                                   |

---

## API Endpoints

### Auth

| Method | Endpoint          | Access | Description              |
|--------|-------------------|--------|--------------------------|
| POST   | /api/auth/signup  | Public | Register a new user      |
| POST   | /api/auth/login   | Public | Login and receive JWT    |

### Issues

| Method | Endpoint          | Access                  | Description                        |
|--------|-------------------|-------------------------|------------------------------------|
| POST   | /api/issues       | Authenticated           | Create a new issue                 |
| GET    | /api/issues       | Public                  | Get all issues (filter + sort)     |
| GET    | /api/issues/:id   | Public                  | Get a single issue by ID           |
| PATCH  | /api/issues/:id   | Authenticated           | Update an issue                    |
| DELETE | /api/issues/:id   | Maintainer only         | Delete an issue                    |

---

## Role Permissions

| Action                        | Contributor | Maintainer |
|-------------------------------|-------------|------------|
| Register / Login              | ✅          | ✅         |
| Create issue                  | ✅          | ✅         |
| View all issues               | ✅          | ✅         |
| Update own issue (status open)| ✅          | ✅         |
| Update any issue              | ❌          | ✅         |
| Change issue status           | ❌          | ✅         |
| Delete any issue              | ❌          | ✅         |

---

## Request & Response Examples

### POST /api/auth/signup

Request:
{
  "name": "John Doe",
  "email": "john@devpulse.com",
  "password": "password123",
  "role": "contributor"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@devpulse.com",
    "role": "contributor",
    "created_at": "2026-01-20T09:00:00Z",
    "updated_at": "2026-01-20T09:00:00Z"
  }
}

---

### POST /api/auth/login

Request:
{
  "email": "john@devpulse.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@devpulse.com",
      "role": "contributor",
      "created_at": "2026-01-20T09:00:00Z",
      "updated_at": "2026-01-20T09:00:00Z"
    }
  }
}

---

### POST /api/issues

Headers:
Authorization: your_jwt_token

Request:
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries causing 500 errors",
  "type": "bug"
}

Response (201):
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 1,
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries causing 500 errors",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T10:30:00Z"
  }
}

---

### GET /api/issues

Query Parameters:
- sort   → newest (default) | oldest
- type   → bug | feature_request
- status → open | in_progress | resolved

Example: GET /api/issues?sort=newest&type=bug&status=open

Response (200):
{
  "success": true,
  "message": "Issues retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Database connection timeout under load",
      "description": "Pool exhausts after 50+ concurrent queries causing 500 errors",
      "type": "bug",
      "status": "open",
      "reporter": {
        "id": 1,
        "name": "John Doe",
        "role": "contributor"
      },
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T10:30:00Z"
    }
  ]
}

---

### PATCH /api/issues/:id

Headers:
Authorization: your_jwt_token

Request:
{
  "title": "Updated title here",
  "status": "in_progress"
}

Response (200):
{
  "success": true,
  "message": "Issue updated successfully",
  "data": {
    "id": 1,
    "title": "Updated title here",
    "description": "Pool exhausts after 50+ concurrent queries causing 500 errors",
    "type": "bug",
    "status": "in_progress",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T14:45:00Z"
  }
}

---

### DELETE /api/issues/:id

Headers:
Authorization: maintainer_jwt_token

Response (200):
{
  "success": true,
  "message": "Issue deleted successfully"
}

---

## Error Response Format

{
  "success": false,
  "message": "Error description here",
  "error": {}
}

## HTTP Status Codes Used

| Code | Meaning                |
|------|------------------------|
| 200  | OK                     |
| 201  | Created                |
| 401  | Unauthorized           |
| 403  | Forbidden              |
| 404  | Not Found              |
| 409  | Conflict               |
| 500  | Internal Server Error  |

---

## Project Structure
```text
src/
├── config/
│   └── index.ts            → Environment variables
├── db/
│   └── index.ts            → PostgreSQL pool + table 
├── middleware/
│   ├── auth.ts             → JWT verification + role authorization
│   ├── globalErrorHandler.ts → Central error handler
│   ├── index.d.ts          → Express request type extension
│   └── logger.ts           → HTTP request logger
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.route.ts
│   │   └── auth.service.ts
│   ├── issues/
│   │   ├── issues.controller.ts
│   │   ├── issues.interface.ts
│   │   ├── issues.route.ts
│   │   └── issues.service.ts
│   └── user/
│       └── user.interface.ts
├── types/
│   └── index.ts            → Shared types 
├── utility/
│   └── sendResponse.ts     → Unified response helper
├── app.ts                  → Express app setup
└── server.ts               → Server entry point

---

## Author

Zisan Ul Haque
