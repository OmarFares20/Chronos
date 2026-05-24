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

### [x] Fix 1 – Profile Pictures & Badge Placement ✅
- Replaced all `randomuser.me` human-face portraits with `ui-avatars.com` business logos (initials, gold-on-dark)
- **Verified badge**: moved from absolute-positioned overlay → inline chip next to business name (green, CheckCircle icon)
- **Top Rated badge**: inline chip next to name with gold Star icon (both on cards and detail pages)
- **Discount % badge**: repositioned to `top: 12px, right: 12px` inside the card (no longer clipped by overflow:hidden), with bold gold background and drop shadow
- Homepage Exclusive Deals: badge repositioned + provider logo thumbnail added

### [x] Fix 2 – Working "Send a Message" Button ✅
- **Provider API** (`/api/providers/[id]`): now exposes `userId` of the provider's account
- **New route** `POST /api/messages/conversation`: resolves `providerId → userId`, seeds a greeting message if no conversation exists, creates a notification for the provider
- **Provider detail page**: "Send a Message" button calls the new route, shows loading state, redirects to `/dashboard/messages?with=<userId>` (bounces to `/login` if not authenticated)
- **Messages page**: reads `?with=<userId>` from URL via `useSearchParams`, auto-selects the correct conversation on load, fetches the thread with that partner immediately

### [x] Fix 3 – Seed Realistic Transactions for Insights ✅
- **`Payment` model added** to `schema.prisma` with `PaymentMethod` + `PaymentStatus` enums, linked to `Booking` (1-to-1)
- **60 realistic bookings seeded** spread across 6 months, across all 3 customers + all providers
  - Status distribution: ~40% `RELEASED`, 20% `IN_ESCROW`, 15% `CONFIRMED`, 15% `DECLINED`, 10% `PENDING`
  - Each booking tied to a generated `Event` with matching status
- **Payment records** created for all `RELEASED` and `IN_ESCROW` bookings with varied methods (CARD, FAWRY, VODAFONE_CASH, INSTAPAY, BANK_TRANSFER)
- **Reviews** seeded for all `RELEASED` bookings (rating 3–5, varied comments)
- **Customer insights API**: `totalSpent` and `monthlySpend` now only count paid bookings (`IN_ESCROW` + `RELEASED`)
- **Re-seed command**: `npx prisma migrate dev --name add-payment && npx prisma db seed`

### [x] Fix 4 – Restore & Enhance Payment Step with Provider Hold ✅
- **Dedicated payment page** at `/dashboard/payment/[bookingId]` — fully standalone, not a modal
- **Business logic guard**: page blocks access if status is not `CONFIRMED` (shows clear message for PENDING, DECLINED, already paid)
- **4 Egyptian payment methods** with real form fields:
  - Credit/Debit Card: 16-digit formatter, MM/YY expiry with future-date validation, 3-digit CVC (masked), cardholder name
  - Fawry / FawryPay: reference number field + step-by-step instructions
  - Vodafone Cash / InstaPay: wallet number field with +20 prefill + destination number shown
  - Bank Transfer: CIB IBAN displayed + file upload dropzone for receipt
- **Processing simulation**: 1.5s loading spinner → success screen with escrow explanation
- **`POST /api/bookings/[id]/pay`**: validates CONFIRMED status, creates `Payment` record, updates booking to `IN_ESCROW`, atomic transaction
- **`GET /api/bookings/[id]`**: new handler for the payment page to load booking details
- **Customer bookings page**: "Pay Now" modal replaced with "Proceed to Payment" link → dedicated page
- **Booking summary sidebar**: provider, package, date, price breakdown with 5% platform fee shown

---

---

## Final Production Fixes

### [x] Production Fix 1 – Full Payment Flow with Escrow & Egyptian Methods ✅
- **Zod validation** added to `POST /api/bookings/[id]/pay` — validates method enum + reference string
- **`PATCH /api/bookings/[id]`**: providers can now set `RELEASED`; customers can set `RELEASED` (Mark as Received); guard ensures booking must be `IN_ESCROW` first
- **"Mark as Received" button** added to customer bookings page for `IN_ESCROW` bookings — calls PATCH → RELEASED; shows "Payment held in escrow" chip + "Message Provider" link
- **"Mark Delivered" button** on provider bookings page for `IN_ESCROW` bookings → moves to `RELEASED`
- **Payment method badge** shown on provider booking cards (e.g. "via FAWRY") for paid bookings
- **Status labels improved**: `IN_ESCROW` → "Payment Held (Escrow)", `RELEASED` → "Completed & Released", `DECLINED` → "Declined"
- **New CSS classes**: `statusReleased` (green), `statusDeclined` (red)
- **Bookings API** now includes `payment` and `provider.userId` in responses
- **Review flow** extended to `RELEASED` bookings (not just `COMPLETED`)

*Last updated: 2026-05-24*

### [x] Production Fix 3 – My Occasions Page Redesign ✅
- **Events API** enriched: now returns full booking details per event (provider businessName/userId, package name/price/duration, payment method/date)
- **Complete page rewrite** (`src/app/dashboard/events/page.tsx`):
  - Responsive card grid: `repeat(auto-fill, minmax(340px, 1fr))` — 1 col mobile, 2 tablet, 3 desktop
  - **Filter tabs**: All / Upcoming (n) / Past (n) with gold active state
  - **Section dividers**: "Upcoming" (gold) and "Past" (muted) headers separating time periods; past cards at 75% opacity
  - Sort: upcoming events first (soonest → latest), then past (most recent → oldest)
  - **Occasion Card**:
    - Header strip: emoji icon by type, occasion name, type label, status badge, countdown ("3d away" / "Today!" in red if ≤7d, "14d ago" for past)
    - Detail chips: 📅 date, 📍 location, 👥 guest count, 📄 budget
    - Financials row: Services Booked / Total Value / Paid — all formatted in EGP
    - Bookings accordion: collapsed by default, expands to show per-provider rows
    - Empty state inline: "No services booked yet" + Browse Providers link
    - Footer: Add Service + Cancel buttons
  - **Booking Row** (inside accordion): provider initials avatar, name, package, amount, status badge; expandable to show payment method, date, message excerpt
  - **Booking Actions** per status: Pay Now (CONFIRMED), Mark Received (IN_ESCROW), Leave Review (RELEASED/COMPLETED), Message Provider, Dispute
  - **Empty state**: full-screen illustration with "Browse Providers" CTA
  - **Loading skeletons**: 3 pulsing placeholder cards
  - SWR with 10s refresh interval for live updates

