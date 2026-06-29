# API Reference

**Project:** AI-Based Fitness & Nutrition Assistant
**Base URL:** `http://localhost:5000/api`
**Auth:** JWT via `Authorization: Bearer <token>` header on protected routes.

> Note: The AI recommendation endpoints are part of a later development phase
> and are not included here yet. This reference covers authentication, profile,
> progress, exercise, and category APIs.


## Response Format

Every response follows the same shape.

**Success**
```json
{ "success": true, "message": "Request completed successfully", "data": {} }
```

**Error**
```json
{ "success": false, "message": "Error message here" }
```

| Status | Meaning |
|--------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation failed |
| 401 | Not authenticated |
| 403 | Authenticated but not allowed (e.g. not admin) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Server error |


## 1. Authentication

### Register
`POST /api/auth/register` · Public

Request body:
```json
{ "name": "Test User", "email": "test@test.com", "password": "123456" }
```
Response: `201` with `token` and `user`.

### Login
`POST /api/auth/login` · Public

Request body:
```json
{ "email": "test@test.com", "password": "123456" }
```
Response: `200` with `token` and `user`.

### Get current user
`GET /api/auth/me` · Private

Headers: `Authorization: Bearer <token>`
Response: `200` with the logged-in `user`.

### Logout
`POST /api/auth/logout` · Private

Response: `200` success message. (With JWT, the client also deletes its stored token.)


## 2. Profile

All profile routes are private (require a token).

### Create profile
`POST /api/profile`

Request body:
```json
{
  "age": 22,
  "gender": "male",
  "height": 175,
  "weight": 70,
  "activityLevel": "moderate",
  "fitnessGoal": "muscle_gain",
  "budgetPreference": "low"
}
```
Response: `201` with the saved profile (including calculated `bmi` and `bmiCategory`).

Allowed values:
- `gender`: `male` | `female` | `other`
- `activityLevel`: `low` | `moderate` | `high`
- `fitnessGoal`: `weight_loss` | `muscle_gain` | `general_fitness`
- `budgetPreference`: `low` | `medium` | `high`

### Get profile
`GET /api/profile`
Response: `200` with the user's profile.

### Update profile
`PUT /api/profile`
Request body: any profile field(s) to update. BMI is recalculated automatically.
Response: `200` with the updated profile.


## 3. Progress

All progress routes are private.

### Add progress record
`POST /api/progress`

Request body:
```json
{ "weight": 69, "note": "first week check-in" }
```
(`date` is optional; defaults to now.)
Response: `201` with the saved record.

### Get progress history
`GET /api/progress`
Response: `200` with a list of records, newest first.

### Delete progress record
`DELETE /api/progress/:id`
Response: `200` success message. Users can only delete their own records.


## 4. Exercises

Reading is public. Creating, updating, and deleting require an **admin** token.

### Get all exercises
`GET /api/exercises` · Public

Optional query filters:
- `?category=<categoryId>`
- `?difficulty=beginner|intermediate|advanced`

Response: `200` with a list of exercises.

### Get single exercise
`GET /api/exercises/:id` · Public
Response: `200` with the exercise details.

### Add exercise
`POST /api/exercises` · Admin

Request body:
```json
{
  "name": "Push Ups",
  "categoryId": "<categoryId>",
  "description": "Upper-body pressing exercise.",
  "targetBodyPart": "Chest, Triceps",
  "difficulty": "beginner",
  "videoUrl": ""
}
```
Response: `201` with the saved exercise.

### Update exercise
`PUT /api/exercises/:id` · Admin
Request body: any exercise field(s) to update.
Response: `200` with the updated exercise.

### Delete exercise
`DELETE /api/exercises/:id` · Admin
Response: `200` success message.


## 5. Categories

Reading is public. Creating, updating, and deleting require an **admin** token.

### Get all categories
`GET /api/categories` · Public
Response: `200` with a list of categories.

### Add category
`POST /api/categories` · Admin
Request body:
```json
{ "categoryName": "HIIT", "description": "High intensity interval training" }
```
Response: `201` with the saved category.

### Update category
`PUT /api/categories/:id` · Admin
Response: `200` with the updated category.

### Delete category
`DELETE /api/categories/:id` · Admin
Response: `200` success message. (A category in use by exercises cannot be deleted.)


## Authentication Flow (for the frontend)

1. User registers or logs in → backend returns a `token`.
2. Frontend stores the token (e.g. in memory or localStorage).
3. For every protected request, send the header:
   `Authorization: Bearer <token>`
4. If the token is missing or expired, the API returns `401` → redirect to login.
