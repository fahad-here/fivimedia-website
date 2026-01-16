# 03 – Admin Panel Specification

Admin interface for managing pricing, coverage, and orders.

---

## Access
- Route: `/admin`
- Protected via middleware

---

## Dashboard

```
[Stats Cards]
- Total Orders
- Pending Orders
- Revenue

[Recent Orders Table]
```

---

## Pricing Management (`/admin/pricing`)

```
[State List]
[Edit Base Price]
[Edit Add-on Prices]
[Save]
```

---

## State Coverage (`/admin/states`)

```
[State Selector]
[Editable Coverage Checklist]
[Save]
```

---

## Orders (`/admin/orders`)

```
[Orders Table]
- ID
- State
- Total
- Status
- Created At

[Click Row → Order Detail]
```

---

## Order Detail

```
Order Info
Customer Info
Selected Add-ons

[Status Dropdown]
[Save]
```

---

## References
- `00-design-system-and-standards.md`

