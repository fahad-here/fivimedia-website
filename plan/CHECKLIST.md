# Implementation Checklist

> This file tracks what has been implemented. Update after completing each item.

---

## Phase 1: Project Setup & Configuration

### 1.1 Initialize Next.js Project
- [x] Created Next.js app with Pages Router
- [x] TypeScript configured with strict mode
- [x] Installed core dependencies: tailwindcss, framer-motion, next-themes, next-intl
- [x] Installed database dependencies: prisma, @prisma/client, @prisma/adapter-mariadb
- [x] Installed auth dependencies: next-auth, bcryptjs, @types/bcryptjs
- [x] Installed utilities: zod, nodemailer

### 1.2 Tailwind Configuration
- [x] Design system colors configured in `globals.css`
- [x] Light/dark mode CSS variables defined
- [x] Inter font configured

### 1.3 Theme Setup
- [x] next-themes configured in `_app.tsx`
- [x] ThemeProvider wrapping app
- [x] Theme toggle in Header component

### 1.4 Database Setup (Prisma 7)
- [x] Prisma 7 initialized with MySQL provider
- [x] Created `prisma/schema.prisma` with normalized coverage model
- [x] Created `prisma.config.ts` (Prisma 7 requirement)
- [x] Using `@prisma/adapter-mariadb` driver adapter
- [x] Created `src/lib/prisma.ts` singleton with adapter
- [x] Created `.env` and `.env.example`
- [x] Created `prisma/seed.ts` with all seed data
- [x] Added `isActive` field to State model for enable/disable functionality

### 1.5 Authentication Setup (NextAuth.js)
- [x] Created `pages/api/auth/[...nextauth].ts`
- [x] Credentials provider configured
- [x] Created `src/middleware.ts` for route protection
- [x] Created `src/lib/auth.ts` with type extensions
- [x] Admin login page created

---

## Phase 2: Shared Components

### 2.1 Layout Components
- [x] `src/components/Header.tsx` - Sticky header with nav, theme toggle, language dropdown, CTA
- [x] `src/components/Footer.tsx` - Footer with legal links, contact
- [x] `src/components/Layout.tsx` - Wrapper component

### 2.2 UI Components
- [x] `src/components/ui/Button.tsx` - Primary, secondary, outline variants
- [x] `src/components/ui/Card.tsx` - Default and muted variants
- [x] `src/components/ui/Input.tsx` - With label and error support
- [x] `src/components/ui/Select.tsx` - With label and error support
- [x] `src/components/ui/Checkbox.tsx` - With label and description
- [x] `src/components/ui/Textarea.tsx` - With label and error support

### 2.3 Wizard Components
- [x] `src/components/wizard/ProgressIndicator.tsx`
- [x] `src/components/wizard/OrderSummary.tsx`

### 2.4 Admin Components
- [x] `src/components/admin/AdminLayout.tsx`

---

## Phase 3: Public Pages (i18n Routing)

- [x] `src/pages/[locale]/index.tsx` - Home page with Hero, How It Works, What's Included, Why Choose Us, CTA Strip
- [x] `src/pages/[locale]/llc-formation.tsx` - Educational page
- [x] `src/pages/[locale]/pricing.tsx` - Pricing overview (fetches from API)
- [x] `src/pages/[locale]/contact.tsx` - Contact form with Nodemailer
- [x] `src/pages/[locale]/terms.tsx` - Terms of Service
- [x] `src/pages/[locale]/privacy.tsx` - Privacy Policy
- [x] `src/pages/index.tsx` - Root redirect to /en

---

## Phase 4: Wizard Flow

- [x] `src/pages/[locale]/start/index.tsx` - Step 1: Entity & State selection
- [x] `src/pages/[locale]/start/[state]/included.tsx` - Step 2: State coverage (fetches from /api/coverage)
- [x] `src/pages/[locale]/start/[state]/pricing.tsx` - Step 3: Add-ons & pricing (fetches from /api/quote)
- [x] `src/pages/[locale]/checkout.tsx` - Step 4: Customer info & payment
- [x] `src/pages/[locale]/order/success.tsx` - Success page
- [x] `src/contexts/WizardContext.tsx` - Wizard state management (with phoneCode support)

---

## Phase 5: Admin Panel

- [x] `src/pages/admin/login.tsx` - Admin login
- [x] `src/pages/admin/index.tsx` - Dashboard with stats, cancelled count, and revenue (excludes cancelled orders)
- [x] `src/pages/admin/pricing.tsx` - State and add-on pricing management (with add new add-on, dynamic language fields)
- [x] `src/pages/admin/states.tsx` - State coverage management (with enable/disable states, state names in checkboxes, add coverage items, dynamic language fields)
- [x] `src/pages/admin/orders/index.tsx` - Orders list with search (by ID, email, name) and status filter
- [x] `src/pages/admin/orders/[id].tsx` - Order detail with status update
- [x] `src/pages/admin/languages.tsx` - Language settings management (add/edit languages, set default, enable/disable)
- [x] `src/pages/admin/users.tsx` - Admin user management (add, edit, delete users, password reset)

---

## Phase 6: API Routes

### Public APIs
- [x] `src/pages/api/contact.ts` - Contact form submission + Nodemailer + DB save
- [x] `src/pages/api/quote.ts` - **Server-authoritative pricing** (computes totals server-side)
- [x] `src/pages/api/coverage.ts` - Get state coverage (normalized, locale-aware, flat response)
- [x] `src/pages/api/orders.ts` - Create order (server computes totals)

### Admin APIs
- [x] `src/pages/api/admin/pricing.ts` - Update state/add-on pricing (with name and active status)
- [x] `src/pages/api/admin/states.ts` - Update state coverage and enable/disable states
- [x] `src/pages/api/admin/orders/[id].ts` - Update order status
- [x] `src/pages/api/admin/addons.ts` - Create new add-ons
- [x] `src/pages/api/admin/coverage-items.ts` - Create new coverage items
- [x] `src/pages/api/admin/languages.ts` - CRUD for language settings
- [x] `src/pages/api/admin/users.ts` - CRUD for admin users (create, update password, delete)

---

## Phase 7: i18n & RTL

- [x] Configured next-intl with `[locale]` routing
- [x] Support `en` (English) and `ar` (Arabic)
- [x] RTL support for Arabic via `dir` attribute in `_app.tsx`
- [x] All pages under `src/pages/[locale]/`
- [x] Created `src/messages/en.json` (comprehensive with validation messages)
- [x] Created `src/messages/ar.json` (comprehensive with validation messages)
- [x] Created `src/i18n/config.ts` with locale config and `getDirection` helper
- [x] Language dropdown in Header (extensible for future languages)

---

## Phase 8: Checkout Form Improvements

- [x] Phone number with country code selector
- [x] Country dropdown (instead of free text input)
- [x] Created `src/data/countries.ts` with 67 countries and phone codes
- [x] Form validation with translated error messages
- [x] Updated WizardContext to include phoneCode field

---

## Database Models (Normalized)

- [x] `User` - Admin authentication
- [x] `State` - US states with base pricing and isActive flag
- [x] `CoverageItem` - Master list of coverage items (bilingual)
- [x] `StateCoverage` - Join table: state × coverage item with enabled flag and processing time
- [x] `AddOn` - Available add-ons (bilingual)
- [x] `Order` - Customer orders with server-computed totals
- [x] `ContactSubmission` - Contact form submissions
- [x] `Language` - Admin-configurable languages (code, name, direction, isDefault, isActive)

---

## Build Status

- [x] `npm run build` - Passes
- [x] `npm run lint` - Passes
- [ ] Database seeding - Requires running MySQL and `npx prisma db push` then `npx prisma db seed`

---

## Remaining Tasks

1. **Run database migrations**: `npx prisma db push`
2. **Run seed**: `npx prisma db seed`
3. **Test full wizard flow** with seeded data
4. **Stripe integration** - TODO placeholder exists
5. **Email configuration** - SMTP env vars need real values for production

---

## Recent Fixes & Enhancements

- **Checkout redirect issue fixed**: The success page was not showing because `reset()` was called before `router.push()` completed. Fixed by awaiting the navigation first, then resetting wizard state.
- **Success page messaging updated**: Changed from "Order Confirmed" to "Interest Registered" with appropriate messaging about team follow-up.
- **Coverage API fixed**: Changed from nested `data.data.items` to flat response structure (`coverage`, `stateName`, `basePrice`).
- **Admin state management**: Added ability to enable/disable states and add new coverage items.
- **Admin add-on management**: Added ability to create new add-ons and edit existing ones (price, names, active status).
- **Language dropdown**: Replaced simple toggle with extensible dropdown selector in Header.
- **Checkout form improvements**: Added country code selector for phone, country dropdown, and validation messages.
- **Admin languages page**: New page to manage application languages (add new, edit, set default, enable/disable).
- **Dynamic language fields**: Admin forms for add-ons and coverage items now auto-generate input fields for all active languages.
- **State name display**: Pricing page now shows state name next to code (e.g., "WY (Wyoming)").
- **Inline form errors**: Error messages in admin add-on/coverage forms now show inline within the form instead of at page top.
- **Seed file updated**: Now includes default English and Arabic language entries.
- **Admin user management**: New page to add/edit/delete admin users with password management.
- **Order search & filter**: Orders page now has search by ID/email/name and status filter dropdown.
- **Revenue excludes cancelled**: Dashboard revenue calculation now excludes cancelled orders with visual indicator.
- **State names in checkboxes**: States enable/disable checkboxes now show full state names (e.g., "WY (Wyoming)").
- **Cancelled orders count**: Dashboard now shows cancelled orders count as a separate stat card.

---

## Files Structure

```
src/
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Layout.tsx
│   ├── admin/
│   │   └── AdminLayout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Textarea.tsx
│   └── wizard/
│       ├── OrderSummary.tsx
│       └── ProgressIndicator.tsx
├── contexts/
│   └── WizardContext.tsx
├── data/
│   └── countries.ts
├── i18n/
│   └── config.ts
├── lib/
│   ├── auth.ts
│   └── prisma.ts
├── messages/
│   ├── ar.json
│   └── en.json
├── middleware.ts
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx (redirect)
│   ├── [locale]/
│   │   ├── index.tsx
│   │   ├── checkout.tsx
│   │   ├── contact.tsx
│   │   ├── llc-formation.tsx
│   │   ├── pricing.tsx
│   │   ├── privacy.tsx
│   │   ├── terms.tsx
│   │   ├── order/
│   │   │   └── success.tsx
│   │   └── start/
│   │       ├── index.tsx
│   │       └── [state]/
│   │           ├── included.tsx
│   │           └── pricing.tsx
│   ├── admin/
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── pricing.tsx
│   │   ├── states.tsx
│   │   ├── languages.tsx
│   │   ├── users.tsx
│   │   └── orders/
│   │       ├── index.tsx
│   │       └── [id].tsx
│   └── api/
│       ├── auth/
│       │   └── [...nextauth].ts
│       ├── contact.ts
│       ├── coverage.ts
│       ├── orders.ts
│       ├── quote.ts
│       └── admin/
│           ├── addons.ts
│           ├── coverage-items.ts
│           ├── languages.ts
│           ├── pricing.ts
│           ├── states.ts
│           ├── users.ts
│           └── orders/
│               └── [id].ts
├── styles/
│   └── globals.css
└── types/
    └── index.ts

prisma/
├── schema.prisma
├── seed.ts
└── generated/
    └── prisma/
        └── client.ts (generated)

prisma.config.ts
.env
.env.example
```

---

## Phase 9: Upcoming Enhancements

### 9.1 Email Notifications
- [ ] Order confirmation email to customer
- [ ] Admin notification email for new orders
- [ ] Email templates in `src/lib/email.ts`
- [ ] `ADMIN_NOTIFICATION_EMAIL` env var

### 9.2 Dashboard Analytics & Conversion Tracking
- [ ] Wizard funnel tracking (started → submitted)
- [ ] Order funnel metrics (pending → completed rate)
- [ ] Contact form submissions count
- [ ] Popular states (top 5 by order count)
- [ ] `WizardSession` model (optional)

### 9.3 Promo Codes System
- [ ] `PromoCode` database model
- [ ] `src/pages/admin/promo-codes.tsx` - Admin CRUD page
- [ ] `src/pages/api/admin/promo-codes.ts` - Admin API
- [ ] `src/pages/api/promo-codes/validate.ts` - Public validation API
- [ ] Checkout page promo code input
- [ ] Order model: `promoCode`, `discountAmount` fields
- [ ] Quote API promo code support

### 9.4 Audit Log (Basic)
- [ ] `AuditLog` database model
- [ ] `src/lib/audit.ts` - Audit helper function
- [ ] `src/pages/admin/audit-log.tsx` - Admin page
- [ ] `src/pages/api/admin/audit-log.ts` - API
- [ ] Log order status changes
- [ ] Log pricing updates
- [ ] Log user management actions

### 9.5 Contact Submissions Management (Leads)
- [ ] Update `ContactSubmission` model with `status`, `notes`
- [ ] `src/pages/admin/leads.tsx` - Admin page
- [ ] `src/pages/api/admin/leads.ts` - API
- [ ] Search by name/email
- [ ] Filter by status (new, contacted, closed)

### 9.6 Order Status History
- [ ] `OrderStatusHistory` database model
- [ ] Record initial status on order creation
- [ ] Record status changes with user info
- [ ] Timeline view on order detail page

### 9.7 FAQs System (Admin-Managed)
- [ ] `FaqCategory` database model
- [ ] `FaqCategoryTranslation` database model
- [ ] `Faq` database model
- [ ] `FaqTranslation` database model
- [ ] `src/pages/admin/faqs/categories.tsx` - Categories admin page
- [ ] `src/pages/admin/faqs/index.tsx` - FAQs admin page
- [ ] `src/pages/api/admin/faq-categories.ts` - Categories API
- [ ] `src/pages/api/admin/faqs.ts` - FAQs API
- [ ] `src/pages/[locale]/faqs.tsx` - Public FAQs page
- [ ] `src/pages/api/faqs.ts` - Public FAQs API
- [ ] Header FAQs link
- [ ] FAQ message translations (en.json, ar.json)
- [ ] Sample FAQs in seed file

### 9.8 Navigation Updates
- [ ] AdminLayout: Add Promo Codes nav item
- [ ] AdminLayout: Add Audit Log nav item
- [ ] AdminLayout: Add Leads nav item
- [ ] AdminLayout: Add FAQs nav item
- [ ] Header: Add FAQs link

### 9.9 Seed Data Updates
- [ ] Sample promo codes
- [ ] Sample FAQ categories
- [ ] Sample FAQ items

---

## Phase 9 Implementation Order

1. [ ] Database schema updates (all new models)
2. [ ] Run migrations (`npx prisma db push`)
3. [ ] Audit log foundation
4. [ ] Order status history
5. [ ] Contact submissions/Leads
6. [ ] Promo codes system
7. [ ] FAQs system
8. [ ] Dashboard analytics
9. [ ] Email notifications
10. [ ] Seed data updates
11. [ ] Navigation updates
12. [ ] Final verification (build, lint, test)

---

## Files to Create (Phase 9)

### Admin Pages
- [ ] `src/pages/admin/promo-codes.tsx`
- [ ] `src/pages/admin/audit-log.tsx`
- [ ] `src/pages/admin/leads.tsx`
- [ ] `src/pages/admin/faqs/index.tsx`
- [ ] `src/pages/admin/faqs/categories.tsx`

### Public Pages
- [ ] `src/pages/[locale]/faqs.tsx`

### API Routes
- [ ] `src/pages/api/admin/promo-codes.ts`
- [ ] `src/pages/api/admin/audit-log.ts`
- [ ] `src/pages/api/admin/leads.ts`
- [ ] `src/pages/api/admin/faqs.ts`
- [ ] `src/pages/api/admin/faq-categories.ts`
- [ ] `src/pages/api/promo-codes/validate.ts`
- [ ] `src/pages/api/faqs.ts`

### Lib Files
- [ ] `src/lib/audit.ts`

---

## Files to Modify (Phase 9)

- [ ] `prisma/schema.prisma` - Add new models, update Order & ContactSubmission
- [ ] `prisma/seed.ts` - Add sample promo codes and FAQs
- [ ] `src/pages/admin/index.tsx` - Add analytics section
- [ ] `src/pages/[locale]/checkout.tsx` - Add promo code input
- [ ] `src/pages/admin/orders/[id].tsx` - Add status history timeline
- [ ] `src/pages/api/orders.ts` - Email notifications, status history
- [ ] `src/pages/api/admin/orders/[id].ts` - Audit logging, status history
- [ ] `src/pages/api/admin/pricing.ts` - Audit logging
- [ ] `src/pages/api/admin/users.ts` - Audit logging
- [ ] `src/pages/api/quote.ts` - Promo code support
- [ ] `src/components/Header.tsx` - Add FAQs link
- [ ] `src/components/admin/AdminLayout.tsx` - Add new nav items
- [ ] `src/messages/en.json` - FAQ translations
- [ ] `src/messages/ar.json` - FAQ translations

---

Last Updated: Phase 9 planning complete - Email notifications, Analytics, Promo codes, Audit log, Leads, Order status history, FAQs system
