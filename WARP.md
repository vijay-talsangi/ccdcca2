# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Development Server
- `npm run dev` - Start development server with file watching (Node --watch)
- Server runs on http://localhost:3000 by default

### Code Quality
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Run ESLint with automatic fixes
- `npm run format` - Format code using Prettier
- `npm run format:check` - Check if code is properly formatted

### Database Operations
- `npm run db:generate` - Generate database migrations from schema changes
- `npm run db:migrate` - Apply pending database migrations
- `npm run db:studio` - Launch Drizzle Studio for database inspection

## Architecture Overview

This is an Express.js API server with a structured, modular architecture using ES6 modules and path mapping.

### Core Stack
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM with migrations
- **Authentication**: JWT tokens with HTTP-only cookies
- **Validation**: Zod schemas
- **Security**: Arcjet for rate limiting, bot detection, and shield protection
- **Logging**: Winston with file and console transports

### Project Structure
- **Path Mapping**: Uses Node.js subpath imports (`#config/*`, `#controllers/*`, etc.)
- **Layered Architecture**: Controllers → Services → Models pattern
- **Middleware**: Security (Arcjet), logging (Morgan), standard Express middleware
- **Configuration**: Environment-based with `.env` files

### Key Architectural Patterns

#### Path Mapping System
The project uses Node.js subpath imports defined in `package.json`:
```javascript path=null start=null
"#config/*": "./src/config/*"
"#controllers/*": "./src/controllers/*"  
"#middleware/*": "./src/middleware/*"
"#models/*": "./src/models/*"
"#routes/*": "./src/routes/*"
"#services/*": "./src/services/*"
"#utils/*": "./src/utils/*"
"#validations/*": "./src/validations/*"
```

#### Database Layer
- **Models**: Drizzle schema definitions in `src/models/`
- **Migrations**: Generated in `drizzle/` directory
- **Connection**: Neon serverless PostgreSQL via HTTP

#### Authentication Flow
1. Request validation using Zod schemas (`src/validations/`)
2. User operations through services (`src/services/auth.service.js`)
3. JWT token generation and HTTP-only cookie setting
4. Role-based access control (user, admin, guest)

#### Security Middleware
Arcjet provides multi-layered protection:
- Rate limiting (role-based: admin=20, user=10, guest=5 requests/minute)
- Bot detection with allowlist for search engines
- Shield protection against common attacks
- Configured in `src/config/arcjet.js` and applied in `src/middleware/security.middleware.js`

### Current API Endpoints
- `GET /` - Basic health check
- `GET /health` - Detailed health status with uptime
- `GET /api` - API status check
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User authentication  
- `POST /api/auth/sign-out` - User logout

### Environment Configuration
Required environment variables (see `.env.example`):
- `DATABASE_URL` - Neon PostgreSQL connection string
- `ARCJET_KEY` - Arcjet API key for security features
- `JWT_SECRET` - JWT signing secret (defaults to development key)
- `PORT`, `NODE_ENV`, `LOG_LEVEL` - Standard configuration

### Development Notes
- No test suite currently exists
- Logging configured for both file output (`logs/`) and console in development
- ESLint enforces consistent code style with 2-space indentation and single quotes
- Prettier handles code formatting
- Uses bcrypt for password hashing with salt rounds of 10
- JWT tokens expire in 1 day, cookies expire in 15 minutes
