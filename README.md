# AI Based Fitness & Nutrition Assistant

## Team Information

| ID | Name | Role |
| :--- | :--- | :--- |
| 11220320904 | Musa Islam Shadin | Team Leader |
| 11220320871 | Arpita Sarker | AI Integration Lead |
| 11220320875 | Easrin Mahjabin Suhani | Backend Developer |
| 11220320887 | Sabequn Nahar | Frontend Developer |

## Proposed Features

- User registration and login system
- Personalized fitness profile setup
- BMI and fitness data calculation
- Workout recommendation
- Budget-based nutrition recommendation
- Exercise library
- Progress tracking dashboard
- AI-generated fitness recommendations
- AI-based progress feedback
- Responsive user interface
- Admin management panel

## Technology Stack

### Frontend

- React.js
- CSS

### Backend

- Node.js
- Express.js

### Database

- MongoDB Atlas

### AI Integration

- Google Gemini API
- Gemini 2.5 Flash

### Authentication

- JWT (JSON Web Tokens)
- bcrypt

### Development Tools

- Git
- GitHub
- Postman

---

## Project Description

AI Based Fitness & Nutrition Assistant is a web-based platform designed to provide personalized fitness and nutrition guidance to users.

The system uses user information such as age, height, weight, BMI, fitness goals, activity level, and budget preference to generate personalized workout recommendations and nutrition suggestions.

Users can create fitness profiles, track their progress, view exercise information, and receive AI-based recommendations according to their personal information.

The main goal of this project is to make fitness guidance easier, affordable, and accessible for beginners.

---

## System Overview

The application follows a full-stack architecture where the frontend communicates with the backend through REST APIs.

The backend handles authentication, business logic, database operations, and communication with the Gemini AI service.

The overall system flow:

Frontend (React.js)  
↓  
Backend API (Node.js + Express.js)  
↓  
MongoDB Atlas  
↓  
Gemini AI Service  
↓  
Personalized Recommendation Display

---

# Features

## User Authentication

The system provides secure user authentication using JWT and bcrypt.

Users can:

- Register an account
- Login securely
- Access protected pages
- Manage personal information


## Fitness Profile

Users can create and update their fitness profile containing:

- Age
- Gender
- Height
- Weight
- Activity level
- Fitness goal
- Budget preference

The system calculates BMI and uses profile information for generating personalized recommendations.


## Workout Recommendation

The AI workout recommendation feature generates personalized workout plans based on user information.

The recommendation considers:

- User profile data
- Fitness goal
- Activity level
- Body information

The generated plan contains:

- Weekly workout schedule
- Workout days
- Recovery days
- Exercise suggestions
- Safety guidance


## Nutrition Recommendation

The AI nutrition recommendation feature provides affordable meal suggestions based on:

- BMI
- Fitness goal
- Budget preference
- Local food availability

The system focuses on practical and budget-friendly nutrition guidance.


## Progress Tracking and AI Feedback

Users can save their fitness progress and monitor changes over time.

The AI progress feedback feature analyzes previous records and provides:

- Progress analysis
- Suggested adjustments
- Motivation feedback


## Exercise Library

The exercise library provides exercise-related information including:

- Exercise name
- Description
- Difficulty level
- Target body part
- Video guidance


## Admin Management

Admin users can manage exercise-related information and categories.

---

# AI Integration

Google Gemini API is integrated into the backend service layer to provide personalized recommendations.

Implemented AI features:

- Workout recommendation generation
- Nutrition recommendation generation
- Progress feedback analysis

The AI system uses stored user information and progress history to generate personalized responses.

The backend creates prompts, sends requests to Gemini, validates AI responses, and sends the final result to the frontend.

---

# AI Response Handling

The system includes response handling mechanisms to ensure reliable AI output.

Implemented handling:

- Empty response detection
- Invalid JSON handling
- AI response validation
- API error handling
- Network failure handling
- Timeout handling
- Rate limit handling

Invalid or incomplete AI responses are rejected before being displayed to users.

---

# Repository Structure

```
AI-Based-Fitness-Nutrition-Assistant

│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── package.json
│
├── server
│   └── backend
│       ├── controllers
│       ├── routes
│       ├── models
│       ├── middleware
│       ├── services
│       │   └── geminiService.js
│       └── server.js
│
├── documentation
│
├── design
│
├── screenshots
│
└── README.md
```

---

# Local Setup

## Backend Setup

```bash
cd server/backend

npm install

npm run dev
```

Create a `.env` file inside:

```
server/backend/
```

Required environment variables:

```env
NODE_ENV=development
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

CLIENT_URL=http://localhost:5173
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:5173
```

Backend:

```
http://localhost:5000
```

---

# Current Development Status

| Module | Status |
| :--- | :--- |
| User Authentication | Completed |
| Fitness Profile | Completed |
| Dashboard | Completed |
| Workout Recommendation | Completed |
| Nutrition Recommendation | Completed |
| Progress Tracking | Completed |
| AI Integration | Completed |
| Frontend-Backend Integration | Completed |
| Error Handling | Completed |
| Deployment | Planned |

---

# Future Improvements

- Deploy the complete system online
- Improve AI personalization using additional user data
- Add advanced fitness analytics
- Add notification and reminder features
- Develop a mobile application version
- Improve recommendation accuracy using user feedback

---

# Project Links

| Resource | Link |
| :--- | :--- |
| GitHub Repository | https://github.com/shadin002/CSE4204-8B-T01-AI-Fitness-Nutrition-Assistant |
| Live Demo | Coming Soon |