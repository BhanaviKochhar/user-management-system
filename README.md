# User Management System

A full-stack user management application built with Node.js, Express.js, MongoDB, and Vanilla JavaScript. The system provides secure authentication, role-based access control, profile management, and administrative user management through dedicated user and admin dashboards.

---

## Overview

The application enables users to:

- Register through a multi-step onboarding process
- Authenticate using JWT-based login
- Manage personal profile information
- Maintain education, projects, and social links
- Upload profile images

Administrators can:

- View user statistics
- Search and filter users
- Enable or disable user accounts
- Promote or demote user roles
- View complete user profiles
- Permanently remove user accounts

---

## Features

### Authentication & Authorization

- JWT-based authentication
- Secure password hashing using bcryptjs
- Protected API routes
- Role-based access control
- Account activation/deactivation
- Session persistence using localStorage

### User Management

- Multi-step registration workflow
- Profile management
- Password updates
- Education information management
- Project portfolio management
- Social profile links
- Profile image upload support

### Administration

- Administrative dashboard
- User analytics and statistics
- Search functionality
- Pagination support
- Role management
- Account status management
- User detail inspection
- User deletion

### User Experience

- Responsive interface
- Client-side validation
- Password strength indicator
- Error handling and feedback
- Clean and consistent design system

---

### Frontend URL:

http://127.0.0.1:5500

### Backend API URL:

http://localhost:5000


- The frontend is currently hosted through Live Server while Express-based frontend serving is being refined. 
- Backend APIs remain fully functional through Express.

---
# API Endpoints

## Authentication

| Method | Endpoint | Description |
|----------|------------|------------|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate user |

---

## User Routes

| Method | Endpoint | Description |
|----------|------------|------------|
| GET | `/api/user/profile` | Get profile |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/change-password` | Change password |

---

## Admin Routes

| Method | Endpoint | Description |
|----------|------------|------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | List users |
| GET | `/api/admin/users/:id` | User details |
| PUT | `/api/admin/users/:id/toggle-status` | Toggle status |
| PUT | `/api/admin/users/:id/change-role` | Change role |
| DELETE | `/api/admin/users/:id` | Delete user |

---
