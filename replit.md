# CricSocial - Cricket Social Media Platform

## Overview

CricSocial is a comprehensive cricket-focused social media platform that combines community engagement with real-time cricket data, performance tracking, tournament management, and coaching tools. The platform serves as an Instagram-like experience specifically designed for the cricket community, integrating social networking features with cricket-specific functionality including live match tracking, player statistics, tournament organization, and AI-powered cricket features.

The application targets cricket players, fans, coaches, and administrators globally, with particular focus on markets in South Asia, Australia, England, and emerging cricket communities worldwide.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Core Technology Stack:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Framework:**
- Shadcn UI component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with cricket-themed color scheme
- Custom theme system with professional variant and cricket-specific design elements
- Responsive design supporting mobile, tablet, and desktop devices

**State Management:**
- TanStack Query for server state, API calls, and data caching
- Context API for authentication state (AuthProvider) and theme management (ThemeProvider)
- Socket.io context (SocketProvider) for real-time features
- React Hook Form with Zod validation for form state and validation

**Key Frontend Features:**
- Social feed with posts, likes, comments, and shares
- Instagram-style reels for short-form cricket content
- Stories with 24-hour expiration
- Real-time chat and messaging system
- Cricket match tracking and live scoring
- Player statistics and performance analytics
- Tournament management interface
- AI-powered features (match prediction, meme generation, player cards, emotion tracking)

### Backend Architecture

**Core Technology Stack:**
- Node.js with Express.js for REST API server
- TypeScript for type safety across the stack
- Socket.io for real-time bidirectional communication
- Passport.js with local strategy for authentication

**Authentication & Security:**
- Session-based authentication using express-session
- Password hashing with Node.js crypto (scrypt algorithm)
- JWT tokens for API authentication
- Email verification and password reset flows using token-based system
- Role-based access control (player, coach, admin, fan roles)

**Data Layer:**
- Currently using in-memory storage (MemStorage class) for development
- Drizzle ORM configured for PostgreSQL migration (schema defined, migration ready)
- Database schema includes comprehensive cricket-specific entities
- Session store using memorystore (production should use persistent store)

**API Architecture:**
- RESTful endpoints organized by feature domain
- Structured error handling with appropriate HTTP status codes
- File upload support using Multer middleware
- Request validation using Zod schemas shared between client and server

**Real-time Features:**
- Socket.io integration for live match updates
- Real-time chat and messaging
- Live notifications for social interactions
- Match score updates and commentary

### External Dependencies

**Cricket Data Integration:**
- **RapidAPI Cricbuzz API** - Primary cricket data source
  - Match listings and live scores
  - Player statistics and team information
  - Series and tournament data
  - Ball-by-ball commentary
  - API endpoint: `https://cricbuzz-cricket.p.rapidapi.com`
  - Authentication via RapidAPI headers (x-rapidapi-key, x-rapidapi-host)

**Email Services:**
- Nodemailer for transactional emails
- Configured for Ethereal Email testing in development
- Email verification and password reset functionality
- Production ready for SMTP configuration via environment variables

**File Storage & Media:**
- Multer for multipart form data and file uploads
- In-memory file storage during development
- Support for images and videos (posts, reels, stories, profile pictures)
- Planned integration with cloud storage providers

**AI & Machine Learning Services:**
- AI service layer for cricket-specific features:
  - Match prediction and win probability calculations
  - Player trading card generation
  - Cricket meme generator
  - Match emotion tracking and sentiment analysis
  - Player avatar creation with artistic styles

**Database (Planned Migration):**
- **PostgreSQL** - Primary database (configuration ready)
  - Neon Database serverless driver (@neondatabase/serverless)
  - Drizzle ORM for type-safe database operations
  - Migration files prepared in drizzle.config.ts
  - Comprehensive schema with cricket-specific tables

**Development & Testing:**
- Jest for unit testing (configured with ts-jest)
- Supertest for API endpoint testing
- TypeScript compiler for type checking
- ESBuild for production builds

**Additional Services:**
- Social media authentication (planned: Google, Facebook)
- Push notifications system (planned integration)
- Analytics and monitoring (planned implementation)
- Cloud media processing for highlights and video content