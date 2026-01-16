# 01 – Public Pages Specification

This document defines **all non-wizard, public-facing pages**.
Must follow rules in `00-design-system-and-standards.md`.

---

## Home Page (`/`)

### Visual Structure (Desktop)
```
┌────────────────────────────────────────────┐
│ Header (logo | nav | CTA)                  │
├────────────────────────────────────────────┤
│ HERO                                      │
│ [Headline text]      [Illustration]       │
│ [Subheading]                              │
│ [Start Now Button]                        │
├────────────────────────────────────────────┤
│ HOW IT WORKS (3–4 steps)                  │
│ [Icon] Step 1   [Icon] Step 2   ...       │
├────────────────────────────────────────────┤
│ WHAT'S INCLUDED                           │
│ ✓ EIN Filing                              │
│ ✓ Registered Agent                        │
│ ✓ Compliance                              │
├────────────────────────────────────────────┤
│ WHY CHOOSE US                             │
│ [3 feature cards]                         │
├────────────────────────────────────────────┤
│ CTA STRIP (gradient)                      │
│ [Start LLC Button]                       │
├────────────────────────────────────────────┤
│ Footer                                    │
└────────────────────────────────────────────┘
```

### Notes
- Hero CTA must be above the fold
- No sliders
- Illustration must be abstract, not cartoon

---

## LLC Formation (`/llc-formation`)

### Purpose
Educational page for hesitant users.

### Structure
```
[Hero Title]
[Short explainer paragraph]

[Section: What is an LLC]
[Section: Benefits]
[Section: What we handle]

[CTA Banner]
```

---

## Pricing Overview (`/pricing`)

### Purpose
Explain pricing logic without forcing selection.

### Structure
```
[Title]
[Explanation: pricing varies by state]

[Example State Cards]

[Add-ons explanation]

[CTA to Start]
```

---

## Contact Page (`/contact`)

### Structure
```
[Title]

[Form]
- Name
- Email
- Message

[Submit Button]

[Success Message Inline]
```

### Behavior
- POST to `/api/contact`
- Disable button while submitting

---

## Legal Pages (`/terms`, `/privacy`)

- Simple centered content
- Max width: `max-w-3xl`
- No animations

---

## References
- `00-design-system-and-standards.md`
- `02-wizard-flow.md`

