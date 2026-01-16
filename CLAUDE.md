# CLAUDE.md

This file defines **project-specific, non-negotiable instructions** for Claude (or any AI/code generator) working on this repository.

If these rules conflict with Claude’s defaults or preferences, **THESE RULES WIN**.

---

## 1. Project Overview (READ FIRST)

This is a **production-grade LLC Formation web application**, not a demo, not a landing page, and not a design experiment.

The project consists of:
- Marketing pages
- A multi-step purchase wizard
- An admin panel
- Server-side APIs (email, orders, payments)

This project is governed by **explicit specification documents**. No assumptions are allowed.

---

## 2. Authoritative Specification Files (SOURCE OF TRUTH)

You MUST read and follow these files in order:

1. `00-design-system-and-standards.md`
2. `01-public-pages.md`
3. `02-wizard-flow.md`
4. `03-admin-panel.md`

If something is not defined in these files:
- Do NOT invent it
- Do NOT redesign it
- Add a TODO instead

---

## 3. Tech Stack (LOCKED)

You MUST use:
- Next.js **Pages Router**
- TypeScript
- Tailwind CSS
- framer-motion (restricted usage)
- next-themes (dark/light)
- next-intl (i18n)

You MUST NOT:
- Switch to App Router
- Use static export (`next export`)
- Introduce other frameworks or UI libraries

---

## 4. Styling & UI Rules

These rules are STRICT:

- Use ONLY the colors defined in `00-design-system-and-standards.md`
- Use Inter font only
- No gradients except where explicitly allowed
- No animations except where explicitly allowed
- No UI creativity or reinterpretation

If the spec shows an ASCII layout, you must match it structurally.

---

## 5. Layout & Components

- Reuse components where obvious (Header, Footer, Buttons, Cards)
- Do NOT over-abstract
- Do NOT introduce premature design systems
- Keep components readable and boring

Max content width: `max-w-7xl`

---

## 6. Wizard Flow Rules (CRITICAL)

- Wizard steps must be sequential
- No skipping steps
- Progress indicator must always reflect current step
- State must persist via URL + client state
- Pricing must NOT be hardcoded in UI

Any unclear business logic → TODO

---

## 7. Forms & Validation

- All forms must have basic client-side validation
- Disable submit buttons during submission
- Show inline errors using error color

---

## 8. API & Backend Rules

- API routes live in `/pages/api`
- Use server-side logic for:
  - Email (Nodemailer)
  - Order creation
  - Payment handling

- NEVER use Netlify Forms

If backend integration is incomplete, stub with clear TODOs.

---

## 9. Dark / Light Mode

- Must use `next-themes`
- Must respect defined colors
- Must not introduce new color tokens

---

## 10. Internationalization (i18n)

- Use `next-intl`
- Text must be wrapped for translation
- Do NOT inline copy directly in JSX without i18n wrapper

If translations are missing, use placeholders.

---

## 11. Code Quality Expectations

- Explicit typing preferred over inference
- No `any`
- No unused imports
- No console.logs in final output

---

## 12. Forbidden Actions

You MUST NOT:
- Redesign layouts
- Change copy without instruction
- Add features not in scope
- Optimize prematurely
- Introduce fancy UI patterns
- Replace libraries

---

## 13. How to Handle Uncertainty

If something is unclear:
- Add a `// TODO:` comment
- Reference the relevant spec file
- Do NOT guess

---

## 14. Definition of Done

A task is complete ONLY IF:
- It matches the spec exactly
- It compiles without errors
- It respects all rules above

---

END OF CLAUDE.md

