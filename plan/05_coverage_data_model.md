# 04 – Coverage Data Model (Normalized, Non-Negotiable)

This document explains **how “What’s included in your LLC” coverage must be stored and handled**.

This file exists because this concept is commonly misunderstood and easily implemented incorrectly.

If this document conflicts with any implementation choice, **this document wins**.

---

## 1. Problem This Solves (Plain English)

The site has a page:

> “What’s included in your **[State] LLC**”

With items like:
- EIN filing
- Registered Agent
- BOI filing
- Certificate of Good Standing

These items **must not** be stored as a single text field or JSON blob on the State model.

---

## 2. ❌ Forbidden Approach (Blob / String Storage)

### What NOT to do

```prisma
model State {
  id       String @id
  name     String
  coverage String // ❌ FORBIDDEN
}
```

Examples of forbidden storage:
- Comma-separated strings
- JSON stored as text
- Markdown blobs

Why this is forbidden:
- Cannot toggle individual items
- Cannot localize easily
- Admin UI becomes fragile
- Requires string parsing in code

---

## 3. ✅ Required Approach: Normalized Coverage

**Normalization means:**
> Each coverage item is its own database record, not part of a single text blob.

Think LEGO blocks, not glued paper.

---

## 4. Required Data Models

### 4.1 CoverageItem (Global Master List)

Defines what coverage items exist in the system.

```prisma
model CoverageItem {
  id          String @id
  key         String // e.g. "ein_filing", "registered_agent"
  title       String
  description String?
}
```

Rules:
- `key` is stable and used for i18n
- `title` is default display text

---

### 4.2 StateCoverage (Join Table)

Defines which coverage items apply to which state.

```prisma
model StateCoverage {
  id             String @id @default(uuid())
  stateId        String
  coverageItemId String
  enabled        Boolean
  processingTime String?
}
```

Rules:
- `enabled = false` means item is hidden for that state
- `processingTime` is optional and state-specific

---

### 4.3 State

```prisma
model State {
  id        String @id
  name      String
  basePrice Int
}
```

State does **not** contain coverage text.

---

## 5. How the UI Must Consume This Data

Backend should return **structured arrays**, not text blobs.

Example API response:

```json
[
  {
    "key": "ein_filing",
    "title": "EIN Filing",
    "processingTime": "10–12 working days"
  },
  {
    "key": "registered_agent",
    "title": "Registered Agent",
    "processingTime": null
  }
]
```

Frontend rendering rule:
- Iterate and display
- No conditional parsing
- No string matching

---

## 6. Admin Panel Expectations

Admin UI must be able to:
- Toggle coverage items per state
- Edit processing time per item

Expected admin layout:
```
[✓] EIN Filing              (10–12 days)
[✓] Registered Agent
[✓] BOI Filing
[ ] Certificate of Good Standing
```

This UI is **not possible** with blob/string storage.

---

## 7. Internationalization (i18n) Requirement

- `CoverageItem.key` must be used as the i18n key
- Titles/descriptions should be translatable

Example:
```
coverage.ein_filing.title
coverage.registered_agent.title
```

---

## 8. Non-Negotiable Rules

You MUST:
- Normalize coverage items
- Use join table per state
- Avoid string parsing

You MUST NOT:
- Store coverage as text or JSON blobs
- Hardcode coverage lists in UI
- Infer coverage via string matching

---

## 9. Reference Files

- `02-wizard-flow.md`
- `03-admin-panel.md`
- `04_implementation_plan.md`
- `CLAUDE.md`

---

END OF DOCUMENT
