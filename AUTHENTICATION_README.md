# susCoin Authentication System

This document describes the authentication system implemented for susCoin.

## Features

### 1. User Registration (Sign Up)
- **Route**: `POST /api/signup`
- **Page**: `/signup`
- **Required Fields**:
  - `name`: Full name of the user
  - `email`: Email address (must be unique)
  - `occupation`: Either "student" or "professional" (dropdown selection)
  - `password`: Minimum 8 characters
  - `terms`: Must accept Terms of Service and Privacy Policy
- **Optional Fields**:
  - `newsletter`: Subscribe to newsletter
- **Features**:
  - Password hashing using bcrypt (12 salt rounds)
  - Email uniqueness validation
  - Password confirmation validation
  - Welcome bonus of 50 credits upon registration
  - Form validation with error handling
  - Success/error modals with confetti animation

### 2. User Login
- **Route**: `POST /api/login`
- **Page**: `/login`
- **Required Fields**:
  - `email`: User's email address
  - `password`: User's password
- **Optional Fields**:
  - `rememberMe`: Extend session to 30 days (default: 1 day)
- **Features**:
  - Secure password verification
  - Session management with cookies
  - Last login tracking
  - Demo account support
  - Form validation with error handling
  - Success/error modals

### 3. User Logout
- **Route**: `POST /api/logout`
- **Features**:
  - Session cleanup
  - Cookie removal

## Database Schema

### Users Table
```sql
CREATE TABLE users(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    occupation TEXT CHECK(occupation IN ('student', 'professional')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);
```

## Security Features

1. **Password Security**:
   - Passwords are hashed using bcrypt with 12 salt rounds
   - Minimum 8 character requirement
   - Secure password comparison

2. **Session Management**:
   - HTTP-only cookies
   - Configurable session duration (1 day or 30 days)
   - Automatic session expiration
   - Secure cookie settings for production

3. **Input Validation**:
   - Server-side validation for all inputs
   - Email format validation
   - Occupation validation (student/professional only)
   - Password strength requirements

4. **Database Security**:
   - SQL injection prevention using parameterized queries
   - Unique email constraint
   - Occupation constraint using CHECK

## Demo Account

A demo account is automatically created for testing:
- **Email**: `demo@suscoin.com`
- **Password**: `demo123`
- **Occupation**: Professional
- **Initial Credits**: 100

## API Endpoints

### Sign Up
```bash
POST /api/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "occupation": "student",
  "password": "securepassword123",
  "newsletter": true
}
```

### Login
```bash
POST /api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123",
  "rememberMe": false
}
```

### Logout
```bash
POST /api/logout
```

## Frontend Features

### Login Page (`/login`)
- Modern, responsive design matching susCoin theme
- Email and password fields
- Remember me checkbox
- Forgot password link (placeholder)
- Social login buttons (Google, Facebook - placeholder)
- Demo account auto-fill button
- Theme toggle support
- Form validation with real-time feedback
- Loading states and error handling

### Sign Up Page (`/signup`)
- Modern, responsive design matching susCoin theme
- Full name, email, occupation dropdown, password fields
- Password confirmation with real-time validation
- Terms and conditions checkbox
- Newsletter subscription option
- Social signup buttons (Google, Facebook - placeholder)
- Benefits section highlighting susCoin features
- Theme toggle support
- Form validation with real-time feedback
- Loading states and error handling

## Navigation Updates

The main navigation has been updated to include:
- Login link in the header
- Sign Up button in the header
- Updated "Join as Worker" CTA to link to signup page

## Dependencies Added

- `bcryptjs`: For password hashing
- `cookie-parser`: For session cookie management

## Future Enhancements

1. **Password Reset**: Implement forgot password functionality
2. **Email Verification**: Add email verification for new accounts
3. **Social Login**: Implement Google and Facebook OAuth
4. **Two-Factor Authentication**: Add 2FA support
5. **Account Management**: User profile editing and account settings
6. **Session Storage**: Move from in-memory to Redis for production
7. **Rate Limiting**: Add rate limiting for auth endpoints
8. **Audit Logging**: Track login attempts and security events

## Testing

The authentication system has been tested with:
- ✅ User registration with valid data
- ✅ User registration with invalid data (validation)
- ✅ User login with correct credentials
- ✅ User login with incorrect credentials
- ✅ Demo account functionality
- ✅ Session management
- ✅ Database schema updates
- ✅ Frontend form validation
- ✅ Error handling and user feedback
