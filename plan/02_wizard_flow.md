# 02 – Wizard Flow (Conversion Core)

This document defines the **multi-step LLC purchase flow**.
Must strictly follow layout and behavior rules.

---

## Global Wizard Rules

- Persistent progress indicator
- Steps must not be skippable
- State stored in URL + client state

---

## Step A – Entity & State (`/start`)

### Wireframe
```
[Progress: Step 1 of 4]

[Select Entity]
[ Dropdown: LLC ]

[Select State]
[ Dropdown ]

[Recommended States]
[ WY ] [ FL ] [ TX ] [ MT ] [ NM ]

[Continue Button – disabled]
```

### Behavior
- Continue enabled only when both selected

---

## Step B – State Coverage (`/start/[state]/included`)

### Wireframe
```
[Progress: Step 2 of 4]

What's included in your [State] LLC

✓ EIN filing (10–12 days)
✓ Registered Agent
✓ Mailing Address
✓ BOI Filing
✓ Certificate of Good Standing

[Notice Box: Processing time]

[Continue]
```

---

## Step C – Add-ons & Pricing (`/start/[state]/pricing`)

### Wireframe
```
[Progress: Step 3 of 4]

┌──────────────┐   ┌──────────────────────┐
│ Base Price   │   │ Order Summary        │
│ $XXX         │   │ State: XX             │
└──────────────┘   │ Add-ons:              │
                   │ Total: $XXX           │
                   └──────────────────────┘

[Add-ons]
[ ] Bank Setup
[ ] Business Address
[ ] US Phone Number

[Continue to Checkout]
```

### Notes
- Order summary sticky on desktop

---

## Step D – Checkout (`/checkout`)

### Wireframe
```
[Progress: Step 4 of 4]

[Customer Info Form]
- Full Name
- Email
- Phone / WhatsApp
- Country
- Business Name
- Notes

[Order Summary – read only]

[Stripe Checkout Button]
[OR]
[Place Order]
```

---

## Success Page (`/order/success`)

```
[Success Icon]
Order Confirmed

Order ID: XXXXX

Next steps explanation
```

---

## References
- `00-design-system-and-standards.md`
- `01-public-pages.md`

