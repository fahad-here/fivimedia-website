# Implementation Plan: FiviMedia LLC Formation Application

> **Reference Documents:**
> - [00_design_system_and_standards.md](./00_design_system_and_standards.md) - Colors, typography, spacing, animations
> - [01_public_pages.md](./01_public_pages.md) - Public page specifications
> - [02_wizard_flow.md](./02_wizard_flow.md) - Multi-step wizard specifications
> - [03_admin_panel.md](./03_admin_panel.md) - Admin panel specifications
> - [05_coverage_data_model.md](./05_coverage_data_model.md) - **Normalized coverage model (NON-NEGOTIABLE)**
> - [CHECKLIST.md](./CHECKLIST.md) - Implementation progress tracker

## Project Overview
Production-grade LLC Formation web application with marketing pages, multi-step purchase wizard, admin panel, and server-side APIs.

**Tech Stack (Locked):** Next.js Pages Router, TypeScript, Tailwind CSS, framer-motion, next-themes, next-intl

**Additional Stack Decisions:**
- **Database:** Prisma ORM with MySQL
- **Authentication:** NextAuth.js with credentials provider
- **Email:** Nodemailer (implemented, not TODO)
- **Content:** Sample/placeholder content included

---

## CRITICAL REQUIREMENTS

### 1. i18n Routing Structure
All public pages MUST be under `pages/[locale]/` with support for:
- `en` (English, LTR)
- `ar` (Arabic, RTL)

### 2. Server-Authoritative Pricing
- `/api/quote` endpoint computes all pricing
- `/api/orders` MUST compute totals server-side
- Client NEVER computes prices

### 3. Normalized Coverage Model
Per [05_coverage_data_model.md](./05_coverage_data_model.md):
- NO JSON blobs for coverage
- Use `CoverageItem` + `StateCoverage` join tables
- See Phase 1.4 for correct schema

### 4. Nodemailer Implementation
Contact form emails MUST be implemented, not marked as TODO.

---

## Phase 1: Project Setup & Configuration

### 1.1 Initialize Next.js Project ✅
- Create Next.js app with Pages Router (NOT App Router)
- Configure TypeScript with strict mode
- Install dependencies:
  - Core: tailwindcss, framer-motion, next-themes, next-intl
  - Database: prisma, @prisma/client
  - Auth: next-auth
  - Email: nodemailer
  - Utilities: zod (validation), bcryptjs (password hashing)

### 1.2 Tailwind Configuration ✅
> See [00_design_system_and_standards.md](./00_design_system_and_standards.md) for complete color definitions

- Configure design system colors as CSS variables
- Set Inter as default font

### 1.3 i18n Setup with Locale Routing
- Configure `next-intl` with `[locale]` dynamic route
- Supported locales: `en`, `ar`
- Default locale: `en`
- RTL support for Arabic via `dir="rtl"`
- Update `_app.tsx` with IntlProvider
- Update `next.config.js` with i18n config

### 1.4 Database Setup (Prisma + MySQL)
> **IMPORTANT:** Follow [05_coverage_data_model.md](./05_coverage_data_model.md) for coverage tables

**Required Models:**

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model State {
  id            String          @id @default(cuid())
  code          String          @unique
  name          String
  basePrice     Float
  isRecommended Boolean         @default(false)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  stateCoverage StateCoverage[]
  orders        Order[]
}

// Global master list of coverage items
model CoverageItem {
  id            String          @id @default(cuid())
  key           String          @unique  // e.g. "ein_filing", "registered_agent"
  titleEn       String                   // English title
  titleAr       String                   // Arabic title
  descriptionEn String?
  descriptionAr String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  stateCoverage StateCoverage[]
}

// Join table: which coverage items apply to which state
model StateCoverage {
  id             String       @id @default(cuid())
  stateId        String
  coverageItemId String
  enabled        Boolean      @default(true)
  processingTime String?      // State-specific processing time
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  state        State        @relation(fields: [stateId], references: [id])
  coverageItem CoverageItem @relation(fields: [coverageItemId], references: [id])

  @@unique([stateId, coverageItemId])
}

model AddOn {
  id            String   @id @default(cuid())
  slug          String   @unique  // "bank_setup", "business_address", "us_phone"
  nameEn        String
  nameAr        String
  descriptionEn String?
  descriptionAr String?
  price         Float
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Order {
  id           String   @id @default(cuid())
  entity       String   @default("LLC")
  stateCode    String

  // Selected add-ons (slugs)
  addOns       Json     // ["bank_setup", "us_phone"]

  // Customer Info
  customerInfo Json     // { fullName, email, phone, country, businessName, notes }

  // Server-computed pricing (NEVER from client)
  basePrice    Float
  addOnTotal   Float
  total        Float

  status       String   @default("pending")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  state State @relation(fields: [stateCode], references: [code])

  @@index([status])
  @@index([createdAt])
}

model ContactSubmission {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String   @db.Text
  createdAt DateTime @default(now())
}
```

### 1.5 Authentication Setup (NextAuth.js) ✅
- Configure NextAuth with Credentials provider
- Create `pages/api/auth/[...nextauth].ts`
- Admin login page at `/admin/login`
- Protect admin routes with middleware

### 1.6 Nodemailer Setup
- Configure SMTP in `.env`
- Create `lib/email.ts` with send functions
- Implement in `/api/contact`

---

## Phase 2: Shared Components ✅

> See [00_design_system_and_standards.md](./00_design_system_and_standards.md) for component styling rules

### 2.1 Layout Components
- **Header** - Add locale switcher, RTL support
- **Footer** - RTL support
- **Layout** - `dir` attribute based on locale

### 2.2 UI Components ✅
All created in `src/components/ui/`

---

## Phase 3: Public Pages (i18n Structure)

> **RESTRUCTURE REQUIRED**: Move all pages under `pages/[locale]/`

### Folder Structure
```
pages/
├── _app.tsx
├── _document.tsx
├── [locale]/
│   ├── index.tsx              # Home
│   ├── llc-formation.tsx
│   ├── pricing.tsx
│   ├── contact.tsx
│   ├── terms.tsx
│   ├── privacy.tsx
│   ├── start/
│   │   ├── index.tsx          # Step 1
│   │   └── [state]/
│   │       ├── included.tsx   # Step 2
│   │       └── pricing.tsx    # Step 3
│   ├── checkout.tsx           # Step 4
│   └── order/
│       └── success.tsx
├── admin/                      # Admin NOT localized
│   ├── login.tsx
│   ├── index.tsx
│   ├── pricing.tsx
│   ├── states.tsx
│   └── orders/
│       ├── index.tsx
│       └── [id].tsx
└── api/                        # API routes
    ├── auth/[...nextauth].ts
    ├── contact.ts
    ├── states.ts
    ├── quote.ts               # Server-authoritative pricing
    ├── coverage.ts
    ├── orders.ts
    └── admin/...
```

### 3.1 Home Page (`pages/[locale]/index.tsx`)
- RTL layout support
- Translations from `messages/{locale}.json`

### 3.2-3.5 Other Public Pages
- Same structure, all under `[locale]/`

---

## Phase 4: Wizard Flow

### 4.1 Step A: Entity & State (`pages/[locale]/start/index.tsx`)
- Progress: "Step 1 of 4"
- Dropdowns: Entity (LLC only), State (all US states)
- Continue disabled until both selected

### 4.2 Step B: State Coverage (`pages/[locale]/start/[state]/included.tsx`)
- Fetch from `/api/coverage?state={state}`
- Returns normalized coverage items (NOT blob)
- Display with i18n keys

### 4.3 Step C: Pricing & Add-ons (`pages/[locale]/start/[state]/pricing.tsx`)
- **Fetch pricing from `/api/quote`**
- Display base price + add-on options
- Order summary shows server-computed total
- NO client-side price calculation

### 4.4 Step D: Checkout (`pages/[locale]/checkout.tsx`)
- Customer form
- Submit to `/api/orders` (server computes final total)

### 4.5 Success Page (`pages/[locale]/order/success.tsx`)

### 4.6 Wizard State Management
- `contexts/WizardContext.tsx`
- Store: entity, stateCode, selectedAddOns (slugs), customerInfo
- Pricing always fetched from server

---

## Phase 5: Admin Panel

Admin panel is NOT localized (English only).

### 5.1-5.7 Admin Pages
Located at `/admin/*` (not under `[locale]/`)

### 5.5 State Coverage Admin (`pages/admin/states.tsx`)
Per [05_coverage_data_model.md](./05_coverage_data_model.md):
```
[✓] EIN Filing              (10–12 days)
[✓] Registered Agent
[✓] BOI Filing
[ ] Certificate of Good Standing
```
- Toggle coverage items per state
- Edit processing time per item

---

## Phase 6: API Routes

### 6.1 Public APIs

#### `/api/quote` (NEW - Server-Authoritative Pricing)
```typescript
// GET /api/quote?state=WY&addons=bank_setup,us_phone
{
  stateCode: "WY",
  stateName: "Wyoming",
  basePrice: 199,
  addOns: [
    { slug: "bank_setup", name: "Bank Setup", price: 99, selected: true },
    { slug: "us_phone", name: "US Phone", price: 29, selected: true }
  ],
  addOnTotal: 128,
  total: 327
}
```

#### `/api/orders` (POST - Server Computes Total)
```typescript
// Request (client sends selections only)
{
  entity: "LLC",
  stateCode: "WY",
  addOns: ["bank_setup", "us_phone"],  // Just slugs
  customerInfo: { ... }
}

// Server computes total from database prices
// NEVER trust client-provided prices
```

#### `/api/coverage` (Normalized Response)
```typescript
// GET /api/coverage?state=WY
[
  { key: "ein_filing", title: "EIN Filing", processingTime: "10-12 days" },
  { key: "registered_agent", title: "Registered Agent", processingTime: null }
]
```

#### `/api/contact` (With Nodemailer)
- Saves to database
- Sends email notification via Nodemailer

### 6.2 Admin APIs
No changes from original plan

---

## Phase 7: i18n Messages

### File Structure
```
messages/
├── en.json
└── ar.json
```

### Coverage Item Keys (from 05_coverage_data_model.md)
```json
{
  "coverage": {
    "ein_filing": { "title": "EIN Filing" },
    "registered_agent": { "title": "Registered Agent" },
    "mailing_address": { "title": "Mailing Address" },
    "boi_filing": { "title": "BOI Filing" },
    "certificate_good_standing": { "title": "Certificate of Good Standing" }
  }
}
```

---

## Folder Structure (CORRECTED)

```
/prisma
  schema.prisma
  seed.ts

/src
  /pages
    _app.tsx
    _document.tsx
    /[locale]
      index.tsx
      llc-formation.tsx
      pricing.tsx
      contact.tsx
      terms.tsx
      privacy.tsx
      /start
        index.tsx
        /[state]
          included.tsx
          pricing.tsx
      checkout.tsx
      /order
        success.tsx
    /admin
      login.tsx
      index.tsx
      pricing.tsx
      states.tsx
      /orders
        index.tsx
        [id].tsx
    /api
      contact.ts
      states.ts
      quote.ts          # Server-authoritative pricing
      coverage.ts
      orders.ts
      stripe-webhook.ts
      /auth
        [...nextauth].ts
      /admin
        stats.ts
        pricing.ts
        states.ts
        /orders
          index.ts
          [id].ts

  /components
    Header.tsx
    Footer.tsx
    Layout.tsx
    /ui
      Button.tsx
      Card.tsx
      Input.tsx
      Select.tsx
      Checkbox.tsx
      Textarea.tsx
    /wizard
      ProgressIndicator.tsx
      OrderSummary.tsx
    /admin
      AdminLayout.tsx
      StatsCard.tsx
      OrdersTable.tsx

  /contexts
    WizardContext.tsx

  /lib
    prisma.ts
    email.ts            # Nodemailer
    api.ts
    validation.ts
    auth.ts

  /styles
    globals.css

  /messages
    en.json
    ar.json

  /types
    index.ts

  /middleware.ts
```

---

## Implementation Order (REVISED)

1. **Fix Prisma schema** - Normalize coverage per `05_coverage_data_model.md`
2. **Restructure for i18n** - Move pages under `pages/[locale]/`
3. **Configure next-intl** - Locale routing, RTL support
4. **Implement `/api/quote`** - Server-authoritative pricing
5. **Implement `/api/coverage`** - Normalized coverage response
6. **Implement Nodemailer** - Contact form emails
7. **Update existing pages** - Use translations, fetch from APIs
8. **Complete wizard flow** - With server pricing
9. **Complete admin panel** - With coverage management
10. **Update CHECKLIST.md** - Mark completed items
11. **Final verification** - Build, lint, test

---

## Verification Plan

### Manual Testing
1. **i18n**: Switch between `/en/` and `/ar/`, verify RTL
2. **Pricing**: Verify all prices come from server (check network tab)
3. **Coverage**: Verify normalized data structure in admin
4. **Email**: Verify contact form sends emails
5. **Dark/Light Mode**: Toggle theme
6. **Responsive**: Mobile viewport

### Build Verification
1. `npm run build` - must pass
2. `npm run lint` - must pass
3. Test all routes with both locales

---

## Phase 8: Recent Enhancements (COMPLETED)

### 8.1 Admin User Management ✅
- **Page**: `src/pages/admin/users.tsx`
- **API**: `src/pages/api/admin/users.ts`
- Features: Add/edit/delete admin users, password management
- Protections: Cannot delete yourself, cannot delete last admin

### 8.2 Order Search & Filtering ✅
- **Page**: `src/pages/admin/orders/index.tsx`
- Search by: Order ID, customer email, customer name
- Filter by: Order status (all, pending, processing, completed, cancelled)
- Clear filters button

### 8.3 Dashboard Improvements ✅
- **Page**: `src/pages/admin/index.tsx`
- Revenue calculation excludes cancelled orders
- Separate stat card for cancelled orders count
- "excludes cancelled" indicator on revenue

### 8.4 State Names in Admin ✅
- State checkboxes show full names: "WY (Wyoming)"
- Pricing page shows state names next to codes

---

## Phase 9: Upcoming Enhancements

### 9.1 Email Notifications
Send automated emails on key events.

**Implementation:**
- **Order Confirmation Email** (to customer)
  - Triggered when order is submitted
  - Contains: Order ID, selected state, add-ons, total, next steps
  - Template in `src/lib/email.ts`

- **Admin Notification Email** (to admin)
  - Triggered when new order is submitted
  - Contains: Order ID, customer info, order details
  - Sent to configured admin email in `.env`

**Files to modify:**
- `src/lib/email.ts` - Add email templates
- `src/pages/api/orders.ts` - Send emails after order creation
- `.env` - Add `ADMIN_NOTIFICATION_EMAIL`

---

### 9.2 Dashboard Analytics & Conversion Tracking
Add business metrics to admin dashboard.

**Conversion Metrics (3 funnels):**

1. **Wizard Funnel**: Started → Order Submitted
   - Track wizard starts (requires new tracking)
   - Compare to completed orders
   - Show percentage conversion

2. **Order Funnel**: Pending → Completed
   - Count orders by status transition
   - Show completion rate

3. **Contact Form Sign-ups**
   - Total contact submissions count
   - Recent submissions (last 7/30 days)

**Popular States:**
- Top 5 most selected states by order count
- Display as ranked list or mini chart

**Database Changes:**
```prisma
model WizardSession {
  id        String   @id @default(cuid())
  sessionId String   @unique  // Anonymous tracking ID
  stateCode String?
  completedOrder Boolean @default(false)
  createdAt DateTime @default(now())
}
```

**Files to create/modify:**
- `prisma/schema.prisma` - Add WizardSession model
- `src/pages/api/wizard/track.ts` - Track wizard starts
- `src/pages/admin/index.tsx` - Add analytics section

---

### 9.3 Promo Codes System
Allow discount codes at checkout.

**Database Model:**
```prisma
model PromoCode {
  id          String    @id @default(cuid())
  code        String    @unique
  type        String    // "percentage" | "fixed"
  value       Float     // 10 = 10% or $10
  usageLimit  Int?      // null = unlimited
  usedCount   Int       @default(0)
  minOrderAmount Float? // Minimum order to apply
  expiresAt   DateTime?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Order Model Update:**
```prisma
model Order {
  // ... existing fields
  promoCode       String?
  discountAmount  Float   @default(0)
  // total = basePrice + addOnTotal - discountAmount
}
```

**Admin Page (`/admin/promo-codes`):**
- List all promo codes with status
- Create new promo code form:
  - Code (auto-generate option)
  - Type: Percentage / Fixed amount
  - Value
  - Usage limit (optional)
  - Minimum order amount (optional)
  - Expiry date (optional)
- Edit existing codes
- Activate/deactivate codes
- View usage statistics

**Checkout Integration:**
- Promo code input field on checkout page
- "Apply" button validates via `/api/promo-codes/validate`
- Shows discount amount if valid
- Error message if invalid/expired/used up
- Updates order summary with discount

**API Endpoints:**
- `GET /api/admin/promo-codes` - List all (admin)
- `POST /api/admin/promo-codes` - Create (admin)
- `PUT /api/admin/promo-codes` - Update (admin)
- `DELETE /api/admin/promo-codes` - Delete (admin)
- `POST /api/promo-codes/validate` - Validate code (public)

**Files to create:**
- `src/pages/admin/promo-codes.tsx`
- `src/pages/api/admin/promo-codes.ts`
- `src/pages/api/promo-codes/validate.ts`

**Files to modify:**
- `prisma/schema.prisma` - Add PromoCode model, update Order
- `src/pages/[locale]/checkout.tsx` - Add promo code input
- `src/pages/api/orders.ts` - Apply promo code discount
- `src/pages/api/quote.ts` - Support promo code in quote
- `src/components/admin/AdminLayout.tsx` - Add nav item

---

### 9.4 Audit Log (Basic)
Track important admin actions for accountability.

**Database Model:**
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  userEmail String
  action    String   // "create" | "update" | "delete"
  entity    String   // "order" | "pricing" | "user" | "promo_code"
  entityId  String
  changes   Json?    // { field: { from: x, to: y } }
  createdAt DateTime @default(now())

  @@index([entity, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

**Tracked Actions:**
- Order status changes (from → to)
- Pricing updates (state prices, add-on prices)
- User management (create, delete, password change)
- Promo code changes
- State enable/disable

**Admin Page (`/admin/audit-log`):**
- Chronological list of actions
- Columns: Date, User, Action, Entity, Details
- Filter by: Entity type, User, Date range
- Read-only (no edit/delete)
- Pagination (50 per page)

**Helper Function:**
```typescript
// src/lib/audit.ts
export async function logAudit({
  userId,
  userEmail,
  action,
  entity,
  entityId,
  changes,
}: AuditLogInput) {
  await prisma.auditLog.create({
    data: { userId, userEmail, action, entity, entityId, changes },
  });
}
```

**Files to create:**
- `src/lib/audit.ts` - Audit helper function
- `src/pages/admin/audit-log.tsx`
- `src/pages/api/admin/audit-log.ts`

**Files to modify:**
- `prisma/schema.prisma` - Add AuditLog model
- `src/pages/api/admin/orders/[id].ts` - Log status changes
- `src/pages/api/admin/pricing.ts` - Log pricing changes
- `src/pages/api/admin/users.ts` - Log user changes
- `src/components/admin/AdminLayout.tsx` - Add nav item

---

### 9.5 Contact Submissions Management (Leads)
View and manage contact form submissions.

**Database Update:**
```prisma
model ContactSubmission {
  id        String   @id @default(cuid())
  name      String
  email     String
  message   String   @db.Text
  status    String   @default("new")  // "new" | "contacted" | "closed"
  notes     String?  @db.Text         // Admin notes
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}
```

**Admin Page (`/admin/leads`):**
- Table with columns: Date, Name, Email, Message (truncated), Status
- Click row to expand full message
- Status dropdown to update status
- Notes field for admin comments
- Search by name/email
- Filter by status
- Bulk actions: Mark as contacted, Mark as closed

**Files to create:**
- `src/pages/admin/leads.tsx`
- `src/pages/api/admin/leads.ts`

**Files to modify:**
- `prisma/schema.prisma` - Update ContactSubmission
- `src/components/admin/AdminLayout.tsx` - Add nav item

---

### 9.6 Order Status History
Track all status changes for an order.

**Database Model:**
```prisma
model OrderStatusHistory {
  id          String   @id @default(cuid())
  orderId     String
  fromStatus  String?  // null for initial status
  toStatus    String
  changedBy   String   // User ID or "system"
  changedByEmail String?
  note        String?
  createdAt   DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
}
```

**Order Model Update:**
```prisma
model Order {
  // ... existing fields
  statusHistory OrderStatusHistory[]
}
```

**Order Detail Page Enhancement:**
- Add "Status History" section below order details
- Timeline view showing:
  - Status change (from → to)
  - Who changed it
  - When
  - Optional note
- Reverse chronological order

**Auto-Recording:**
- When order is created: Record initial "pending" status
- When status is updated: Record the change with user info

**Files to create:**
- None (integrated into existing files)

**Files to modify:**
- `prisma/schema.prisma` - Add OrderStatusHistory
- `src/pages/api/orders.ts` - Record initial status
- `src/pages/api/admin/orders/[id].ts` - Record status changes
- `src/pages/admin/orders/[id].tsx` - Display timeline

---

### 9.7 FAQs System (Admin-Managed)
Admin-managed FAQ system with multi-language support.

**Database Models:**
```prisma
model FaqCategory {
  id        String   @id @default(cuid())
  key       String   @unique  // "general", "pricing", "process"
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  translations FaqCategoryTranslation[]
  faqs         Faq[]
}

model FaqCategoryTranslation {
  id         String @id @default(cuid())
  categoryId String
  locale     String // "en", "ar", etc.
  name       String // "General Questions", "الأسئلة العامة"

  category FaqCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([categoryId, locale])
}

model Faq {
  id         String   @id @default(cuid())
  categoryId String
  sortOrder  Int      @default(0)
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  category     FaqCategory @relation(fields: [categoryId], references: [id])
  translations FaqTranslation[]
}

model FaqTranslation {
  id       String @id @default(cuid())
  faqId    String
  locale   String
  question String
  answer   String @db.Text

  faq Faq @relation(fields: [faqId], references: [id], onDelete: Cascade)

  @@unique([faqId, locale])
}
```

**Admin Pages:**

1. **Categories Page (`/admin/faqs/categories`):**
   - List all categories with sort order
   - Add new category:
     - Key (slug)
     - Dynamic language fields for name (based on active languages)
   - Edit category names
   - Reorder categories (drag & drop or arrows)
   - Activate/deactivate categories

2. **FAQs Page (`/admin/faqs`):**
   - Filter by category
   - List FAQs with question preview
   - Add new FAQ:
     - Select category
     - Dynamic language fields for question & answer
   - Edit FAQ
   - Reorder within category
   - Activate/deactivate FAQs

**Public Page (`/[locale]/faqs`):**
- Display FAQs grouped by category
- Accordion/expandable format
- Category headers
- Search/filter FAQs
- Respects locale for translations
- RTL support for Arabic

**Header Update:**
- Add "FAQs" link to navigation

**API Endpoints:**
- `GET /api/faqs` - Public, returns FAQs for locale
- `GET /api/admin/faq-categories` - List categories
- `POST /api/admin/faq-categories` - Create category
- `PUT /api/admin/faq-categories` - Update category
- `DELETE /api/admin/faq-categories` - Delete category
- `GET /api/admin/faqs` - List FAQs
- `POST /api/admin/faqs` - Create FAQ
- `PUT /api/admin/faqs` - Update FAQ
- `DELETE /api/admin/faqs` - Delete FAQ

**Files to create:**
- `src/pages/[locale]/faqs.tsx`
- `src/pages/admin/faqs/index.tsx`
- `src/pages/admin/faqs/categories.tsx`
- `src/pages/api/faqs.ts`
- `src/pages/api/admin/faqs.ts`
- `src/pages/api/admin/faq-categories.ts`

**Files to modify:**
- `prisma/schema.prisma` - Add FAQ models
- `src/components/Header.tsx` - Add FAQs link
- `src/components/admin/AdminLayout.tsx` - Add FAQs nav
- `src/messages/en.json` - Add FAQ translations
- `src/messages/ar.json` - Add FAQ translations
- `prisma/seed.ts` - Add sample FAQs

---

### 9.8 Phase 9 Implementation Order

1. **Database Schema Updates**
   - Add all new models to `prisma/schema.prisma`
   - Update existing models (Order, ContactSubmission)
   - Run `npx prisma db push`
   - Regenerate client

2. **Audit Log Foundation**
   - Create `src/lib/audit.ts` helper
   - Create audit log API and page
   - This becomes foundation for tracking other changes

3. **Order Status History**
   - Add OrderStatusHistory model
   - Update order creation to record initial status
   - Update order status API to record changes
   - Add timeline to order detail page

4. **Contact Submissions/Leads**
   - Update ContactSubmission model
   - Create leads admin page
   - Create leads API

5. **Promo Codes**
   - Add PromoCode model
   - Create admin CRUD page and API
   - Create validation API
   - Integrate into checkout page
   - Update order creation with discount

6. **FAQs System**
   - Add FAQ models
   - Create admin category page
   - Create admin FAQs page
   - Create public FAQs page
   - Update Header with FAQs link

7. **Dashboard Analytics**
   - Add WizardSession model (optional)
   - Update dashboard with conversion metrics
   - Add popular states section

8. **Email Notifications**
   - Add email templates
   - Update order API to send emails
   - Test email delivery

9. **Seed Data Updates**
   - Add sample promo codes
   - Add sample FAQ categories and items

10. **Navigation Updates**
    - Update AdminLayout with new nav items
    - Update Header with FAQs link

11. **Verification**
    - Run build and lint
    - Test all new features
    - Update CHECKLIST.md

---

### 9.9 Files Summary

**New Database Models:**
- `PromoCode`
- `AuditLog`
- `OrderStatusHistory`
- `FaqCategory`
- `FaqCategoryTranslation`
- `Faq`
- `FaqTranslation`
- `WizardSession` (optional for analytics)

**Updated Models:**
- `Order` - Add promoCode, discountAmount, statusHistory relation
- `ContactSubmission` - Add status, notes fields

**New Admin Pages:**
- `src/pages/admin/promo-codes.tsx`
- `src/pages/admin/audit-log.tsx`
- `src/pages/admin/leads.tsx`
- `src/pages/admin/faqs/index.tsx`
- `src/pages/admin/faqs/categories.tsx`

**New Public Pages:**
- `src/pages/[locale]/faqs.tsx`

**New API Routes:**
- `src/pages/api/admin/promo-codes.ts`
- `src/pages/api/admin/audit-log.ts`
- `src/pages/api/admin/leads.ts`
- `src/pages/api/admin/faqs.ts`
- `src/pages/api/admin/faq-categories.ts`
- `src/pages/api/promo-codes/validate.ts`
- `src/pages/api/faqs.ts`

**New Lib Files:**
- `src/lib/audit.ts`

**Modified Files:**
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/pages/admin/index.tsx` (analytics)
- `src/pages/[locale]/checkout.tsx` (promo code)
- `src/pages/admin/orders/[id].tsx` (status history)
- `src/pages/api/orders.ts` (email, status history)
- `src/pages/api/admin/orders/[id].ts` (audit, status history)
- `src/pages/api/admin/pricing.ts` (audit)
- `src/pages/api/admin/users.ts` (audit)
- `src/pages/api/quote.ts` (promo code support)
- `src/components/Header.tsx` (FAQs link)
- `src/components/admin/AdminLayout.tsx` (new nav items)
- `src/messages/en.json` (FAQ translations)
- `src/messages/ar.json` (FAQ translations)

---

## CHECKLIST Reference

Update [CHECKLIST.md](./CHECKLIST.md) after completing each phase.
