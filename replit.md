# ChitTrack

## Overview

ChitTrack is a chit fund management application built with Expo (React Native) for the frontend and Express.js for the backend. It allows users to browse, join, and track chit funds (a traditional savings scheme popular in India), make payments, and view their financial dashboard. Admin users can manage funds, assign users, and view platform-wide statistics.

The app uses a monorepo structure where the mobile/web client and API server coexist, sharing schema definitions and types through a `shared/` directory.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation**: File-based routing using expo-router with Stack and Tab navigators
  - `(auth)/` - Authentication screens (login, signup) presented as modal
  - `(tabs)/` - Main user tab navigation (Home, Funds, Payments, Profile)
  - `(admin)/` - Admin tab navigation (Dashboard, Manage Funds, Users, Settings)
  - `chit-detail/[id]` - Dynamic route for fund details
- **State Management**: TanStack React Query for server state caching and synchronization
- **Authentication**: JWT tokens stored in `expo-secure-store` (native) or `AsyncStorage` (web), managed through a React context (`AuthProvider`)
- **Styling**: React Native StyleSheet with a centralized color constants file (`constants/colors.ts`). Uses Inter font family loaded via `@expo-google-fonts/inter`
- **Platform Support**: iOS, Android, and Web. Uses platform-specific adaptations (e.g., `KeyboardAwareScrollViewCompat`, native vs classic tab layouts via `expo-glass-effect` availability check)
- **API Communication**: Centralized `authFetch` helper in `lib/api.ts` that automatically attaches JWT Bearer tokens to requests. Uses `expo/fetch` for consistent cross-platform fetch behavior.

### Backend (Express.js)

- **Framework**: Express 5 with TypeScript, compiled via `tsx` for development and `esbuild` for production
- **API Design**: RESTful JSON API under `/api/` prefix
  - Auth routes: `/api/auth/signup`, `/api/auth/login`
  - User routes: `/api/dashboard`, `/api/chit-funds`, `/api/chit-funds/:id`, `/api/chit-funds/:id/join`, `/api/payments`
  - Admin routes: `/api/admin/stats`, `/api/admin/users`, `/api/admin/chit-funds`, `/api/admin/assign-user`, `/api/admin/seed`
- **Authentication**: JWT-based with `jsonwebtoken`. Middleware functions `authMiddleware` and `adminMiddleware` protect routes. Passwords hashed with `bcryptjs`.
- **CORS**: Dynamic origin handling based on Replit environment variables, plus localhost support for Expo web development

### Database

- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Schema** (`shared/schema.ts`):
  - `users` - User accounts with roles (user/admin), email, phone, password hash
  - `chitFunds` - Chit fund definitions with amount, duration, slots, organizer info, status
  - `memberships` - Many-to-many relationship between users and chit funds, with slot numbers
  - `payments` - Payment records tied to memberships, tracking due dates, amounts, and status
- **Enums**: PostgreSQL enums for `role`, `chit_status`, `payment_status`, `membership_status`
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Validation**: Zod schemas generated from Drizzle schema via `drizzle-zod`, used for request validation on the server

### Shared Code

- `shared/schema.ts` - Database schema definitions and Zod validation schemas, imported by both server and client
- Path aliases configured: `@/*` maps to root, `@shared/*` maps to `./shared/*`

### Build & Deployment

- **Development**: Two processes run concurrently - Expo dev server (`expo:dev`) and Express server (`server:dev`)
- **Production Build**: Expo static web build (`expo:static:build`) + server bundle via esbuild (`server:build`), served by Express in production mode
- **Environment**: Designed for Replit deployment with environment-specific domain handling

### Key Design Decisions

1. **JWT over Sessions**: Chose JWT tokens over server sessions because the app targets mobile devices where cookies are unreliable. Tokens are stored securely per platform.
2. **Monorepo with Shared Schema**: Single repository with shared types prevents client-server type drift. Drizzle-zod bridges database schema to runtime validation.
3. **Expo Router**: File-based routing provides familiar web-like navigation patterns while supporting native mobile navigation paradigms.
4. **Role-based Access**: Two-tier role system (user/admin) with separate navigation stacks and server-side middleware enforcement.

## External Dependencies

- **PostgreSQL**: Primary database, provisioned via Replit. Connection via `DATABASE_URL` environment variable.
- **Expo Services**: Build tooling and development infrastructure from Expo.
- **Key npm packages**:
  - `drizzle-orm` + `drizzle-kit` - Database ORM and schema management
  - `@tanstack/react-query` - Server state management
  - `jsonwebtoken` + `bcryptjs` - Auth token generation and password hashing
  - `expo-secure-store` - Secure native token storage
  - `connect-pg-simple` - PostgreSQL session store (available but JWT is primary auth method)
  - `patch-package` - Applied via postinstall for dependency patches
- **Environment Variables Required**:
  - `DATABASE_URL` - PostgreSQL connection string
  - `SESSION_SECRET` - JWT signing secret (falls back to default in dev)
  - `EXPO_PUBLIC_DOMAIN` - API server domain for client requests
  - `REPLIT_DEV_DOMAIN` - Replit development domain (auto-set by Replit)