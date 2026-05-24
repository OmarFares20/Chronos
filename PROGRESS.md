# Chronos – Project Progress

> **Stack**: Next.js 16 (App Router) · TypeScript · Prisma · PostgreSQL · Tailwind CSS · Lucide Icons · SWR · Zod

---

## Phase 1 – Core Foundation

### [x] 1. Project Setup
- Next.js 16 App Router, TypeScript, Prisma, PostgreSQL
- Global design system: CSS variables, gold/dark palette, Inter + Playfair fonts
- Folder structure: `app/`, `components/`, `lib/`, `prisma/`

### [x] 2. Authentication
- JWT-based auth with httpOnly cookies (`jose` library)
- Register / Login / Logout API routes
- `AuthProvider` React context with `useAuth()` hook
- Role-based routing: `CUSTOMER`, `PROVIDER`, `ADMIN`
- Rate-limited `/api/auth/me` endpoint

### [x] 3. Database Schema (Prisma)
- **Models**: `User`, `ProviderProfile`, `Service`, `Package`, `Event`, `Booking`, `Review`, `Message`, `GalleryItem`, `ProviderAvailability`, `Promotion`, `ProviderApplication`
- **Enums**: `Role`, `BookingStatus` (PENDING → CONFIRMED → IN_ESCROW → RELEASED/DECLINED), `ServiceCategory` (19 types), `EventStatus`, `PromotionType`, `ApplicationStatus`
- `Package` model includes `isPromotion` (Boolean) and `discountPercentage` (Int)

### [x] 4. Seed Script (`prisma/seed.ts`)
- **Passwords**: `Admin@123!` / `Provider@123!` / `Customer@123!`
- **Admin**: `admin@chronos.com`
- **Customers**: `yasmine@example.com`, `mohamed@example.com`, `omar@example.com`
- **Providers**: `provider1@chronos.com` … `provider95@chronos.com`
- 95 providers across 19 categories, each with 3 tiered packages (Essential / Signature / Prestige)
- ~50% of providers have a promotional package (10–30% discount)
- Gallery images: `picsum.photos/seed/{category}-{n}/400/300`
- Provider avatars: `ui-avatars.com` with business initials (business-appropriate, no human faces)
- Culturally accurate Egyptian business names, bios, and package features

---

## Phase 2 – Marketplace Pages

### [x] 5. Homepage (`/`)
- Hero section with search form (category + city)
- Stats strip, Services grid, How It Works steps, Trust banner, Security section
- **Exclusive Deals section**: fetches `isPromotion: true` packages from DB, shows crossed-out original price and discount badge
- Server component using Prisma directly

### [x] 6. Provider Search (`/providers`)
- Client-side search with category tabs, keyword search, location/budget filters, sort options
- Provider cards show: category avatar (business initials), badge (Top Rated / Premium / Elite), verified checkmark, rating, price range
- API: `GET /api/providers` with full filtering, pagination, budget range post-filter, and sort
- Falls back to mock data if DB is empty

### [x] 7. Provider Detail Page (`/providers/[id]`)
- Fetches real provider from DB with fallback to mock
- Sections: Hero (avatar, stats, badges), Gallery lightbox, Services & Packages, Reviews, Booking sidebar
- **Packages**: 3-tier display with "Most Popular" highlight, promotion badge (🔥 X% OFF), crossed-out original price
- **Booking request form**: date picker, guest count, notes, adds to cart
- **Add to Occasion Plan** button with toast notification

### [x] 8. AI Match Page (`/match`)
- Multi-step wizard: occasion type → date → location → budget → guest count → preferences
- Matches providers from DB based on filters
- Animated step transitions

### [x] 9. Planner / Cart (`/planner`)
- Cart persisted in `localStorage`
- Shows selected packages, subtotal, occasion details
- Proceeds to checkout

### [x] 10. Checkout / Occasion Brief (`/planner/checkout`)
- Collects occasion name, date, notes
- Creates `Event` + `Booking` records (status: `PENDING`)
- Generates downloadable PDF occasion brief (jsPDF)
- Payment step deferred until provider confirms

---

## Phase 3 – Dashboards

### [x] 11. Customer Dashboard (`/dashboard`)
- **Overview tab**: upcoming occasions grid, quick-action buttons
- **Insights tab**: StatTile cards (total bookings, money spent, active occasions), bar charts (monthly spend), favourite providers
- **My Bookings**: lists all bookings with status badges, "Pay Now" button for CONFIRMED bookings
- **Payments**: escrow-held amounts, payment history
- **Messages**: real-time messaging with providers
- **Settings**: account info (name, email, phone, avatar upload), password change

### [x] 12. Provider Dashboard (`/dashboard/provider`)
- **Overview**: pending bookings count, revenue stats, quick links
- **Bookings**: Accept / Decline pending requests; status progression shown
- **Earnings**: revenue breakdown, payout history
- **Services**: add/edit service packages
- **Promotions**: manage discount codes
- **Gallery / Profile**: upload photos, edit storefront info (bio, location, social links, addresses)
- **Messages**: conversation threads with customers
- **Settings**: full profile management with gallery upload

### [x] 13. Admin Dashboard (`/admin`)
- Protected by middleware (ADMIN role only)
- Overview stats: total users, providers, bookings, revenue
- Provider application review: Approve / Reject with reason
- Booking management table with EGP formatting

---

## Phase 4 – Booking & Payment Flow

### [x] 14. Provider Confirmation Flow
- Bookings start as `PENDING` (no auto-confirm)
- Provider sees **Confirm** / **Decline** buttons on each pending booking
- On Confirm → status becomes `CONFIRMED`; customer can now pay
- On Decline → status becomes `DECLINED`; customer sees notice
- Both dashboards update via SWR revalidation / `router.refresh()`

### [x] 15. Payment Step (Demo Flow)
- Payment page unlocked only after provider confirms (status = CONFIRMED)
- **4 Egyptian payment methods**:
  - Credit/Debit Card (Visa/Mastercard/Meeza) – 16-digit number, MM/YY expiry, 3-digit CVC, name
  - Fawry / FawryPay – Fawry reference number + phone
  - Vodafone Cash / InstaPay – wallet phone number
  - Bank Transfer – CIB IBAN shown, receipt file upload dropzone
- All `+20` country code prefilled for phone fields
- After "Confirm Payment": 1–2s loading → booking status → `IN_ESCROW` → success screen
- Payment page blocked if status is `PENDING` or `DECLINED`

### [x] 16. Escrow / Release Logic
- Funds held as `IN_ESCROW` after payment
- Released to provider on occasion completion
- Provider and customer dashboards both reflect status changes

---

## Phase 5 – Messaging & Notifications

### [x] 17. Messaging System
- `Message` model in DB (senderId, receiverId, content, isRead, timestamps)
- `GET /api/messages` – paginated conversation list
- `POST /api/messages` – send message, creates notification
- `GET /api/messages/stream` – SSE for real-time updates (falls back to SWR polling at 5s)
- Dashboard messages page: conversation sidebar, message thread, typing indicator
- Unread count badge on sidebar and bell icon

### [x] 18. Notifications
- `GET /api/notifications` – fetch unread items with relative timestamps
- `POST /api/notifications` – mark all as read
- Bell dropdown in Navbar: glassmorphism panel, per-item icons, "Mark all read" button
- **BadgeContext** (`src/components/BadgeContext.tsx`): shared context with mount fetch, route-change fetch, 30s polling, and `chronos:badges-updated` custom event

---

## Phase 6 – Data & Content

### [x] 19. Service Categories (19 types)
`PHOTOGRAPHY`, `CATERING`, `DECOR`, `MUSIC`, `PLANNING`, `VENUE`, `TRANSPORT`, `SECURITY`, `VIDEOGRAPHY`, `FLORIST`, `MAKEUP`, `ENTERTAINMENT`, `HOSPITALITY`, `STATIONERY`, `CHILDCARE`, `EMCEE`, `SOUND_SYSTEM`, `TENT_RENTAL`, `WAITSTAFF`

### [x] 20. Insights APIs
- `GET /api/insights/customer` – total occasions, bookings, money spent, monthly spend (6 months), favourite providers
- `GET /api/insights/provider` – total/pending/confirmed bookings, completion rate, revenue, avg rating, rating breakdown, monthly revenue, top customers

### [x] 21. Promotions & Deals
- `isPromotion` + `discountPercentage` on Package model
- Homepage "Exclusive Deals" section (server-fetched, top 4 by discount)
- Provider detail page: promotional packages get 🔥 badge + crossed-out original price in package grid and sticky sidebar
- Original price derived as `price / (1 - discountPercentage/100)`

---

## Phase 7 – Polish & Settings

### [x] 22. Currency Formatting (EGP)
- `src/lib/formatPrice.ts` – always uses `en-US` locale → Western digits, `EGP X,XXX` format
- `src/lib/ui.ts` – `formatCurrency` uses same locale
- All dashboards, admin, providers pages fully converted; zero hardcoded `$` signs remaining

### [x] 23. Terminology (Occasion not Event)
- All visible UI text uses "occasion" instead of "event"
- Variable names, API routes, and DB fields unchanged

### [x] 24. Dynamic Dashboard Updates (SWR)
- All dashboard data fetched via `useSWR` with `refreshInterval: 10000`
- Booking status changes use `mutate()` for instant optimistic updates
- Global `mutate("/api/bookings")` triggered after checkout to sync all tabs

### [x] 25. Full Profile Settings (`/dashboard/settings`)
- **Account tab**: name, email, phone (+20 auto-prefix via Zod transform), avatar upload (device file → `public/uploads/`)
- **Security tab**: old password verified server-side via bcrypt before allowing change
- **Provider tab** (providers only): businessName, bio, location, comma-separated addresses, website, Instagram, Facebook, gallery image uploader
- Settings API: `PATCH /api/user/settings` with `action` field (`account` | `security` | `provider`)
- File upload API: `POST /api/upload` – validates MIME type + size (<5MB), saves to `public/uploads/`

### [x] 26. Admin Account & Provider Verification
- Admin middleware protects `/admin` routes
- `ProviderApplication` model for onboarding documents
- Register API accepts FormData + file uploads
- Admin dashboard reviews and approves/rejects applications
- Unverified providers blocked from public search; shown "Pending Verification" banner

---

## Pending / In Progress

### [ ] Fix 1 – Profile Pictures & Badge Placement
- Replace randomuser.me human faces with business-appropriate avatars (ui-avatars.com)
- Fix verified badge → move next to business name in card body
- Fix discount badge z-index on package cards so it's not hidden

### [ ] Fix 2 – Working "Send a Message" Button
- Provider detail page message button should open/create a conversation and redirect to messages page

### [ ] Fix 3 – Seed Realistic Transactions for Insights
- Generate 50+ completed bookings with varied statuses
- Add Payment model if missing; seed payment records
- Ensure Insights APIs aggregate the data correctly

### [ ] Fix 4 – Restore & Enhance Payment Step with Provider Hold
- "Proceed to Payment" button in customer booking details after provider confirms
- Full Egyptian payment method UI (Card, Fawry, Vodafone Cash, Bank Transfer)
- Booking → `PAID`/`IN_ESCROW` after demo payment; both dashboards update

---

*Last updated: 2026-05-23*
