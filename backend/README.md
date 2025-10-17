# Luma Backend API

Backend API for the Luma mental wellness application built with Node.js, Express, TypeScript, and Supabase.

## Features

- **Authentication**: Email/password authentication via Supabase Auth
- **Dashboard**: Mood tracking and statistics
- **Type Safety**: Full TypeScript support
- **Validation**: Request validation with Zod
- **Security**: Helmet, CORS, JWT authentication
- **Database**: PostgreSQL via Supabase with Row Level Security

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- Supabase account and project

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `OPENAI_API_KEY`: Your OpenAI API key (for Phase 2)

### 3. Set Up Database

Run the SQL migration in your Supabase SQL Editor:

```bash
# See database-setup.sql file
```

This will create:
- `users` table (user profiles)
- `mood_checkins` table (mood tracking)
- Row Level Security policies
- Database triggers for auto-profile creation

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "is_new_user": false
}
```

### Dashboard

#### Submit Mood Check-in
```http
POST /api/v1/dashboard/mood-checkin
Authorization: Bearer <token>
Content-Type: application/json

{
  "mood_value": 4,
  "notes": "Feeling good today"
}
```

#### Get Mood History
```http
GET /api/v1/dashboard/mood-history?days=30
Authorization: Bearer <token>
```

#### Get Dashboard Stats
```http
GET /api/v1/dashboard/stats
Authorization: Bearer <token>
```

### Health Check
```http
GET /api/v1/health
```

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── env.config.ts
│   │   ├── supabase.config.ts
│   │   └── cors.config.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── logger.middleware.ts
│   ├── modules/             # Feature modules
│   │   ├── auth/
│   │   └── dashboard/
│   ├── shared/              # Shared utilities
│   │   ├── types/
│   │   └── utils/
│   ├── routes/              # Route definitions
│   └── server.ts            # Entry point
├── .env                     # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Run in development mode with auto-reload
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

## Error Handling

All errors return a standardized JSON response:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

## Security

- All routes except registration and login require JWT authentication
- Passwords are hashed by Supabase Auth
- Row Level Security (RLS) enforced in database
- CORS configured for frontend origin only
- Helmet.js for security headers
- Request validation with Zod

## Testing with Postman/cURL

### Register a user
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Submit mood check-in
```bash
curl -X POST http://localhost:3001/api/v1/dashboard/mood-checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"mood_value":4,"notes":"Feeling great!"}'
```

## Troubleshooting

### Database connection failed
- Verify your Supabase URL and keys in `.env`
- Check that you've run the database migration
- Ensure your Supabase project is active

### CORS errors
- Verify `FRONTEND_URL` matches your frontend URL
- Check that frontend is running on the correct port

### Authentication errors
- Ensure you're sending the `Authorization` header with Bearer token
- Check that the token hasn't expired (7 days default)

## Next Steps (Phase 2)

- Chat feature with OpenAI integration
- Journal feature with AI analysis
- Goals feature with action plans
- Tools feature with guided exercises

## Support

For issues or questions, please refer to the main project documentation.
