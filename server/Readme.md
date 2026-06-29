# AI-Based Fitness & Nutrition Assistant — Backend

Backend API for the AI-Based Fitness & Nutrition Assistant. Built with Node.js and Express on top of MongoDB Atlas, with JWT for auth and bcrypt for password hashing.

## Tech Stack

- **Node.js** (>=18+) — runtime
- **Express.js** — API framework
- **MongoDB Atlas** + **Mongoose** — database and schema modeling
- **JWT** — authentication
- **bcryptjs** — password hashing
- **express-validator** — request validation
- **Helmet, CORS, express-rate-limit** — basic security middleware

## Project Structure

```text
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/            # Business logic
├── middleware/              # Auth, role checks, validation
├── models/                  # Mongoose schemas
├── routes/                  # REST API routes
├── utils/                  # Helpers + seed script
├── .env.example
├── server.js               # Entry point
└── package.json
```

There are also top-level `database/`, `documentation/`, and `postman/` folders alongside `backend/`.

## Getting Started

Clone and install:

```bash
git clone https://github.com/shadin002/CSE4204-8B-T01-AI-Fitness-Nutrition-Assistant.git
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in:

| Variable     | Description                          |
|--------------|---------------------------------------|
| `MONGO_URI`  | MongoDB Atlas connection string       |
| `JWT_SECRET` | Secret used to sign JWTs              |
| `CLIENT_URL` | Frontend URL, used for CORS           |

Seed the database (adds the default admin account plus sample categories/exercises):

```bash
npm run seed
```

Run it:

```bash
npm run dev    # development, with reload
npm start      # production
```

Runs on `http://localhost:5000` by default.

## Authentication

Protected routes expect a JWT in the `Authorization` header:

```text
Authorization: Bearer <token>
```

You get the token back from `/auth/register` or `/auth/login`.

## API Routes

All routes are prefixed with `/api`.

**Auth**

| Method | Endpoint         | Access  |
|--------|------------------|---------|
| POST   | /auth/register   | Public  |
| POST   | /auth/login      | Public  |
| GET    | /auth/me         | Private |
| POST   | /auth/logout     | Private |

**Profile**

| Method | Endpoint  | Access  |
|--------|-----------|---------|
| POST   | /profile  | Private |
| GET    | /profile  | Private |
| PUT    | /profile  | Private |

**Progress**

| Method | Endpoint        | Access  |
|--------|-----------------|---------|
| POST   | /progress       | Private |
| GET    | /progress       | Private |
| DELETE | /progress/:id   | Private |

**Exercises**

| Method | Endpoint         | Access |
|--------|------------------|--------|
| GET    | /exercises       | Public |
| GET    | /exercises/:id   | Public |
| POST   | /exercises       | Admin  |
| PUT    | /exercises/:id   | Admin  |
| DELETE | /exercises/:id   | Admin  |

**Categories**

| Method | Endpoint          | Access |
|--------|-------------------|--------|
| GET    | /categories       | Public |
| POST   | /categories       | Admin  |
| PUT    | /categories/:id   | Admin  |
| DELETE | /categories/:id   | Admin  |

## Coming in Week 8 (AI integration)

The following APIs are scheduled for implementation during the AI integration phase:

- Workout recommendation API
- Nutrition recommendation API
- Progress recommendation API
- Recommendation history API

## Response Format

Success:

```json
{ "success": true, "message": "Operation completed successfully.", "data": {} }
```

Error:

```json
{ "success": false, "message": "Error description." }
```

## Database

MongoDB Atlas via Mongoose. Five collections so far: `users`, `profiles`, `progress`, `categories`, `exercises`. Full schema docs live in `database/database-structure.md`.

## Security

- JWT-based auth, role-based access (user/admin)
- Passwords hashed with bcrypt
- Request validation on inputs
- Helmet for security headers, CORS locked to the frontend URL, basic rate limiting

## Testing

APIs are tested in Postman — the exported collection is in `postman/`.

## Deployment (Render)

1. Push backend to GitHub.
2. New Web Service on Render → connect repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all `.env` variables in the Render dashboard.
6. Set `NODE_ENV=production` and `CLIENT_URL` to your Vercel frontend URL.
