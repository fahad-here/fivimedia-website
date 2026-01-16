# 00 – Design System & Global Standards

This document defines **non-negotiable UI/UX, layout, and coding standards**. All other documents reference and depend on this file.

---

## 1. Core Principles

- Conversion-first, not marketing art
- Zero UI improvisation
- Predictable layouts
- Accessibility-first contrast
- Desktop-first, mobile-perfect

---

## 2. Color System (LOCKED)

### Brand Colors
- Primary: `#2563EB`
- Primary Dark: `#1E40AF`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`

### Light Mode
- Background: `#FFFFFF`
- Muted Background: `#F8FAFC`
- Text Primary: `#0F172A`
- Text Muted: `#64748B`
- Border: `#E5E7EB`

### Dark Mode
- Background: `#020617`
- Cards: `#020617`
- Text Primary: `#E5E7EB`
- Text Muted: `#94A3B8`
- Border: `#1E293B`

---

## 3. Typography

- Font: Inter
- Headings: `font-semibold` or `font-bold`
- Body: `font-normal`
- No decorative fonts

---

## 4. Layout Rules

- Max content width: `max-w-7xl`
- Section padding: `py-16`
- Grid gaps: `gap-6` or `gap-8`
- Cards: `rounded-xl`, subtle shadow
- Buttons: `rounded-lg`

---

## 5. Animation Rules (Framer Motion)

Allowed:
- `opacity`
- `translateY (8–12px)`
- `duration: 0.3–0.45s`

Forbidden:
- Scale bounce
- Rotation
- Parallax

---

## 6. Global Components

### Header
- Sticky
- Solid background
- Logo (left)
- Nav links (center)
- Actions (right): language toggle, theme toggle, CTA

### Footer
- Muted background
- Legal links
- Contact email

---

## 7. References

- See `01-public-pages.md`
- See `02-wizard-flow.md`
- See `03-admin-panel.md`

