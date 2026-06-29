# Database Structure

**Project:** AI-Based Fitness & Nutrition Assistant
**Database:** MongoDB Atlas
**ODM:** Mongoose

This document describes the database collections, their fields, keys, and
relationships, based on the ER diagram from the System Design phase.

> Note: The AI recommendation feature is planned for a later phase. The
> `recommendations` collection will be added when that module is implemented.


## Overview of Collections

| Collection | Purpose |
|------------|---------|
| `users` | Stores account and authentication data. |
| `profiles` | Stores each user's fitness profile (one per user). |
| `progress` | Stores user weight/progress records over time. |
| `categories` | Stores exercise categories (Cardio, Strength, etc.). |
| `exercises` | Stores exercises, each belonging to a category. |


## 1. users

Stores registered accounts. Passwords are hashed with bcrypt before saving.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key (auto-generated). |
| `name` | String | Required. 2–60 characters. |
| `email` | String | Required, unique, lowercase. |
| `password` | String | Required, hashed (never returned by default). |
| `role` | String | `user` or `admin`. Default `user`. |
| `createdAt` | Date | Auto-managed timestamp. |
| `updatedAt` | Date | Auto-managed timestamp. |


## 2. profiles

One fitness profile per user. BMI is calculated and stored automatically
whenever the profile is created or updated.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key. |
| `userId` | ObjectId | Foreign key → `users._id`. Unique (one profile per user). |
| `age` | Number | Required. 10–120. |
| `gender` | String | `male`, `female`, or `other`. |
| `height` | Number | Required. In centimeters. |
| `weight` | Number | Required. In kilograms. |
| `activityLevel` | String | `low`, `moderate`, or `high`. |
| `fitnessGoal` | String | `weight_loss`, `muscle_gain`, or `general_fitness`. |
| `budgetPreference` | String | `low`, `medium`, or `high`. |
| `bmi` | Number | Calculated by the system. |
| `bmiCategory` | String | `underweight`, `normal`, `overweight`, or `obese`. |
| `createdAt` | Date | Auto-managed timestamp. |
| `updatedAt` | Date | Auto-managed timestamp. |


## 3. progress

Stores weight records over time so users can track changes.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key. |
| `userId` | ObjectId | Foreign key → `users._id`. |
| `weight` | Number | Required. In kilograms. |
| `note` | String | Optional. Up to 500 characters. |
| `date` | Date | Defaults to the time the record is added. |
| `createdAt` | Date | Auto-managed timestamp. |
| `updatedAt` | Date | Auto-managed timestamp. |


## 4. categories

Exercise categories shown in the exercise library. Managed by admins.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key. |
| `categoryName` | String | Required, unique. |
| `description` | String | Optional. Up to 300 characters. |
| `createdAt` | Date | Auto-managed timestamp. |
| `updatedAt` | Date | Auto-managed timestamp. |


## 5. exercises

Individual exercises, each linked to a category. Managed by admins.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Primary key. |
| `categoryId` | ObjectId | Foreign key → `categories._id`. |
| `name` | String | Required. |
| `description` | String | Optional. |
| `targetBodyPart` | String | Optional (e.g. "Legs, Glutes"). |
| `difficulty` | String | `beginner`, `intermediate`, or `advanced`. |
| `videoUrl` | String | Optional link to a demonstration video. |
| `createdAt` | Date | Auto-managed timestamp. |
| `updatedAt` | Date | Auto-managed timestamp. |


## Relationships

```
users (1) ───── (1) profiles        one user has one profile
users (1) ───── (*) progress        one user has many progress records
categories (1) ── (*) exercises     one category has many exercises
```

- A **user** has exactly **one profile** (`profiles.userId` is unique).
- A **user** has **many progress** records (`progress.userId`).
- A **category** has **many exercises** (`exercises.categoryId`).


## Sample Data

Seed data for testing is provided in this folder:

- `sample-categories.json` — 5 starter categories.
- `sample-exercises.json` — 13 starter exercises across all categories.

These can be inserted into the database to populate the exercise library for
testing and demonstration.
