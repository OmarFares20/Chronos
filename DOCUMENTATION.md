# Chronos Project Documentation

## 1. How to Run the Website Locally

Follow these steps to get the Chronos event-planning marketplace running on your local machine from scratch.

### Prerequisites
- **Node.js**: Version 18+ or 20+ recommended.
- **Database**: A PostgreSQL database (e.g., local Postgres or a cloud instance like Neon).
- **Stripe Account**: A Stripe account to obtain test API keys.

### Installation
Open your terminal, navigate to the project root, and install the dependencies:
```bash
npm install
```

### Environment Variables
Create a `.env` file in the root of the project. You can copy the provided `.env.example`:
```bash
cp .env.example .env
```
Fill in the following variables in your `.env` file:
```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"

# Next.js Application URL
NEXTAUTH_URL="http://localhost:3000"

# Security (Generate a strong random string)
NEXTAUTH_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Stripe (Get these from your Stripe Dashboard -> Developers -> API keys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Stripe Webhook Secret (Get from Stripe CLI or Dashboard Webhooks)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cron Secret for automated escrow releases
CRON_SECRET="your-cron-secret"
```

### Database Setup
Next, synchronize your Prisma schema with your database and seed it with test data:

1. **Push the schema to the database**:
   ```bash
   npm run db:push
   ```
2. **Seed the database** (This will wipe existing data and create 15 providers, 3 customers, test events, and bookings):
   ```bash
   npm run seed
   ```

### Running the Dev Server
Start the Next.js development server:
```bash
npm run dev
```

### Opening the Site
Open your browser and navigate to:
[http://localhost:3000](http://localhost:3000)

### Test Credentials for Login
The seed script automatically generates several test accounts. You can use the following to log in:

**Customer Account:**
- **Email**: `yasmine@example.com` (or `mohamed@example.com`, `omar@example.com`)
- **Password**: `Customer@123!`

**Provider Account:**
- **Email**: `ghalia.catering@example.com` (or `hello@studiofekra.com`)
- **Password**: `Provider@123!`

---

## 2. Complete Technical Overview

### Purpose of the Project
Chronos is a comprehensive event-planning marketplace designed to seamlessly connect customers (event planners) with service providers (caterers, photographers, venues, DJs, etc.). The platform allows customers to discover providers, build a multi-service event itinerary (Planner Cart), securely book services through an escrow-backed payment system, and communicate with providers in real-time.

### Tech Stack
- **Next.js (App Router)**: Acts as the full-stack React framework, enabling server-side rendering, robust API routes, and optimized routing.
- **TypeScript**: Used throughout the codebase to ensure type safety, reduce runtime errors, and improve developer experience.
- **Prisma & PostgreSQL**: Prisma serves as the ORM, providing a type-safe database client. The primary database used is PostgreSQL (hosted via Neon).
- **Tailwind CSS**: A utility-first CSS framework used for rapid, responsive UI styling without writing custom CSS files.
- **Lucide React**: Provides a sleek, modern, and customizable SVG icon set.
- **bcryptjs & JWT (jsonwebtoken)**: `bcryptjs` is used for hashing user passwords securely, while `jsonwebtoken` manages stateless authentication via HTTP-only cookies.
- **Zod**: Used for robust, schema-based payload validation in API routes to guarantee data integrity before processing.
- **SWR**: A React hooks library used for data fetching on the client-side, providing features like caching, revalidation, and optimistic UI updates.
- **Stripe**: Handles secure payment processing. It manages the checkout flow, processes credit cards, and triggers webhooks to update booking statuses.
- **SSE (Server-Sent Events)**: Used instead of WebSockets for a lightweight, native, unidirectional real-time messaging stream (including typing indicators).
- **Rate Limiter**: A custom implementation (likely backed by an LRU cache) to protect API endpoints from brute-force or denial-of-service attacks.

### Application Architecture
The project follows the standard Next.js App Router structure:
- **`src/app`**: Contains all the UI routes (pages, layouts) and API routes (`src/app/api`).
- **`src/app/api`**: Organizes backend endpoints by domain (e.g., `auth`, `checkout`, `messages`, `webhooks`).
- **`src/components`**: Houses reusable React components, separated into UI components (buttons, inputs) and feature-specific components.
- **`src/lib`**: Contains core utility modules, such as:
  - `auth.ts`: Authentication wrappers and JWT verifiers.
  - `prisma.ts`: The singleton Prisma client instance.
  - `stripe.ts`: The Stripe client configuration.
  - `env.ts`: Startup environment variable validation.
- **`prisma/`**: Contains the `schema.prisma` file (database modeling) and the comprehensive `seed.ts` script.

### Authentication & Authorization Flow
1. **Login**: The user submits credentials to `POST /api/auth/login`. The server verifies the password via bcrypt, generates a JWT containing the `userId` and `role`, and sets it as an `httpOnly` cookie (`chronos_token`).
2. **Route Protection**: Protected API routes wrap their handlers using the `withAuth` higher-order function from `src/lib/auth.ts`.
3. **Role-Based Access**: Inside API routes, functions like `requireAuth`, `requireRole`, and `requireAnyRole` parse the JWT to ensure the user has the correct permissions (e.g., only a `PROVIDER` can access provider endpoints).

### Payment & Escrow Flow
1. **Planner Cart**: The customer adds various packages from different providers to their cart.
2. **Checkout Initiation**: A request is sent to `POST /api/checkout`. The backend validates the packages via Zod, calculates totals, adds a 5% platform fee, and creates `PENDING` bookings in the database.
3. **Stripe Session**: The server generates a Stripe Checkout session, passing the `bookingIds` as metadata, and redirects the user to the Stripe payment page.
4. **Webhook Confirmation**: Upon successful payment, Stripe sends a `checkout.session.completed` event to `POST /api/webhooks/stripe/route.ts`. The webhook extracts the metadata and updates the corresponding bookings from `PENDING` to `IN_ESCROW`.
5. **Release/Dispute**: Funds remain in escrow until the event concludes, at which point they are released to the provider's balance or disputed if issues arise.

### Real-Time Messaging Flow
- **Data Storage**: Messages are saved to the `Message` table in the database with standard sender/receiver relations.
- **Server-Sent Events (SSE)**: The application utilizes Next.js streaming to hold open HTTP connections in `src/app/api/messages/stream`.
- **Live Updates**: When a new message is sent or a typing indicator is triggered, the event is broadcast down the SSE stream to the connected client.
- **Read Receipts**: Unread counts are maintained via the `isRead` boolean on the `Message` model, updating in real-time as users open chat threads.

### Database Schema (Core Models & Relationships)
- **`User`**: The central entity (Customer, Provider, or Admin).
- **`ProviderProfile`**: A 1-to-1 extension of the User table storing business details, operating hours, and location.
- **`Service` & `Package`**: A Provider has many Services, and a Service has many Packages (e.g., "Standard Buffet", "Luxury Royal Iftar").
- **`Event`**: Created by a Customer. Represents the actual occasion (e.g., a wedding or engagement).
- **`Booking`**: The critical junction table linking a Customer, Provider, Event, and Package. It tracks the status (PENDING, CONFIRMED, IN_ESCROW) and financials.
- **`Message`**: Tracks sender, receiver, and optional linkage to a specific `Booking`.
- **`Review`**: Created by a Customer post-event, linked to the `Booking` and `ProviderProfile`.

### Significant Design Patterns
- **API Validation with Zod**: Every API route expects a specific payload shape and uses `Zod.safeParse()` to catch invalid data at the boundary.
- **Centralized Auth Error Handling**: The `withAuth` wrapper automatically catches `UnauthorizedError` exceptions and standardizes 401/403 HTTP responses.
- **Strict Environment Validation**: `src/lib/env.ts` forces the application to fail fast at boot if critical environment variables are missing, preventing silent runtime failures.
- **SWR Data Fetching**: Instead of relying heavily on global state managers (like Redux), the app uses SWR for localized, cache-first data fetching with automatic revalidation on focus.
