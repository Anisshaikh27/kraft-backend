# 🏗️ Kraft Backend Architecture - MongoDB + JWT Integration

## Overview

This document provides the complete backend architecture for Kraft AI platform with MongoDB persistence and JWT authentication.

---

## 📦 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **AI Models**: Groq + Google Gemini
- **ORM**: Mongoose (MongoDB ODM)

### Key Dependencies Added
- `mongoose@^8.0.0` - MongoDB Object Modeling
- `bcryptjs@^2.4.3` - Password hashing
- `jsonwebtoken@^9.1.2` - JWT generation & verification

---

## 🗄️ Database Models

### 1. User Model (`models/User.js`)

```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  avatar: String (optional),
  bio: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

**Methods**:
- `comparePassword(enteredPassword)` - Verify password
- `toJSON()` - Return user without password

---

### 2. Project Model (`models/Project.js`)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String (required),
  description: String,
  type: String (enum: ['react-app', 'component', 'fullstack']),
  status: String (enum: ['draft', 'active', 'archived']),
  thumbnail: String (optional),
  tags: [String],
  fileCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: 
- `userId + createdAt` for fast user project queries

---

### 3. File Model (`models/File.js`)

```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Project),
  userId: ObjectId (ref: User),
  path: String (e.g., 'src/App.js'),
  content: String (file content),
  language: String (enum: js, jsx, ts, tsx, css, html, json, md, python),
  size: Number (auto-calculated),
  operation: String (enum: ['create', 'update', 'delete']),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `projectId + path` for unique file identification

---

## 🔐 Authentication Flow

### 1. Registration (POST `/api/auth/register`)

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123"
}
```

**Process:**
1. Validate inputs
2. Check if user exists
3. Hash password with bcryptjs (10 salt rounds)
4. Create user in MongoDB
5. Generate JWT token
6. Return token + user data

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Login (POST `/api/auth/login`)

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Process:**
1. Find user by email
2. Compare entered password with hashed password
3. If valid, generate JWT token
4. Return token + user data

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

### 3. JWT Token Structure

```
Header: { alg: "HS256", typ: "JWT" }
Payload: { userId: "...", email: "...", iat: ..., exp: ... }
Signature: HMACSHA256(header.payload, secret)
```

**Token Expiry**: 7 days (configurable via `JWT_EXPIRY`)

**Usage**: Include in request headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 🚀 API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register new user |
| POST | `/login` | ❌ | Login user |
| GET | `/profile` | ✅ | Get current user |
| PUT | `/profile` | ✅ | Update profile |

---

### Project Routes (`/api/projects`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | ✅ | Create project |
| GET | `/` | ✅ | List user's projects |
| GET | `/:id` | ✅ | Get project details |
| PUT | `/:id` | ✅ | Update project |
| DELETE | `/:id` | ✅ | Delete project |

---

### File Routes (`/api/files`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/:projectId` | ✅ | Create file |
| GET | `/:projectId` | ✅ | List files |
| GET | `/:projectId/:fileId` | ✅ | Get specific file |
| PUT | `/:projectId` | ✅ | Update file |
| DELETE | `/:projectId` | ✅ | Delete file |

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd kraft-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
# Server
PORT=3001
NODE_ENV=development

# MongoDB (Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kraft-db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=7d

# AI Keys
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_google_key

# Other configs
CORS_ORIGIN=http://localhost:3000
```

### 3. MongoDB Atlas Setup

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/`
4. Replace in `.env` file

### 4. Start Backend Server

```bash
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║   Kraft AI Backend Server              ║
║   Running on port 3001                 ║
║   Environment: development             ║
╚════════════════════════════════════════╝
```

---

## 📊 Data Relationships

```
User (1) ──────────── (Many) Project
  │
  └────── password (hashed)
  └────── email (unique)

Project (1) ──────────── (Many) File
  │
  ├────── userId (ref to User)
  └────── fileCount (denormalized)

File (Many) ────────── (1) Project
  │
  ├────── projectId (ref to Project)
  ├────── userId (ref to User)
  └────── path (unique per project)
```

---

## 🔄 Example Workflow

### Create a Project and Generate Files

```javascript
// 1. User registers
POST /api/auth/register
→ Returns: token, user

// 2. User creates project
POST /api/projects
Headers: { Authorization: "Bearer {token}" }
Body: { name: "My App", description: "...", type: "react-app" }
→ Returns: project with _id

// 3. User generates code via AI
POST /api/ai/generate
Body: { prompt: "Create a todo app", type: "react" }
→ Returns: generated files array

// 4. Files are saved to MongoDB
POST /api/files/:projectId
Body: { path: "src/App.js", content: "...", language: "javascript" }
→ File saved in MongoDB

// 5. User can retrieve all files
GET /api/files/:projectId
→ Returns: all files for project from MongoDB
```

---

## 🛡️ Security Features

### 1. Password Security
- Hashed with bcryptjs (10 rounds)
- Never stored in plain text
- Compared using timing-safe comparison

### 2. JWT Authentication
- Tokens expire after 7 days
- Signature verified on every request
- Invalid tokens rejected with 401

### 3. Database Security
- Unique indexes on email/username
- ObjectId provides security through obscurity
- User can only access own projects/files

### 4. Input Validation
- Required fields validated
- Email format checked
- File paths sanitized

---

## 📈 Scalability Features

### Current Design Supports:
- ✅ Multiple users per system
- ✅ Project isolation per user
- ✅ File organization within projects
- ✅ Efficient queries with proper indexing

### Future Enhancements:
- [ ] Role-based access control (RBAC)
- [ ] Project sharing between users
- [ ] File version history
- [ ] Collaborative editing
- [ ] File permissions management
- [ ] Project templates

---

## 🐛 Common Issues & Solutions

### MongoDB Connection Failed
```
Error: MongoDB connection failed
Solution:
1. Check MONGODB_URI in .env
2. Ensure IP is whitelisted in Atlas
3. Verify network connectivity
```

### JWT Token Expired
```
Error: Invalid or expired token
Solution:
1. Frontend should refresh token
2. User needs to login again
3. Check JWT_SECRET matches on all instances
```

### Duplicate Key Error
```
Error: E11000 duplicate key error
Solution:
1. Email/username already exists
2. Check database for duplicates
3. Clear collections if in development
```

---

## 🚦 Testing the Backend

### Test Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123",
    "confirmPassword": "TestPass123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Test Protected Route (with token)
```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📝 Environment Variables Complete Reference

```bash
# Server Config
PORT=3001                          # Server port
NODE_ENV=development               # Environment mode

# Database
MONGODB_URI=mongodb+srv://...      # MongoDB connection string

# JWT
JWT_SECRET=your-secret-key         # Secret for signing tokens
JWT_EXPIRY=7d                      # Token expiration time

# AI Services
GROQ_API_KEY=...                   # Groq API key
GOOGLE_API_KEY=...                 # Google API key
GROQ_MODEL=llama-3.3-70b-versatile # Groq model
GEMINI_MODEL=gemini-1.5-flash      # Gemini model

# CORS
CORS_ORIGIN=http://localhost:3000  # Allowed frontend URL

# Project Limits
MAX_PROJECT_SIZE_MB=50             # Max project size
MAX_FILES_PER_PROJECT=100          # Max files per project

# Logging
LOG_LEVEL=info                     # Log level
```

---

## ✅ Architecture Checklist

- [x] MongoDB models defined (User, Project, File)
- [x] JWT authentication implemented
- [x] Password hashing with bcryptjs
- [x] Auth routes (register, login, profile)
- [x] Project CRUD operations
- [x] File CRUD operations
- [x] Middleware for authentication
- [x] Proper error handling
- [x] Database connection management
- [x] Environment configuration

---

## 🎉 Next Steps

1. **Start Backend**: `npm run dev`
2. **Configure MongoDB**: Update MONGODB_URI
3. **Test API**: Use curl/Postman
4. **Connect Frontend**: Update API_BASE_URL
5. **Deploy**: Heroku / AWS / DigitalOcean

For frontend integration, see `kraft-frontend/API_INTEGRATION_GUIDE.md`

---

**Last Updated**: January 2024
**Version**: 2.0.0
**Status**: ✅ Production Ready (MVP)
