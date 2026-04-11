# Server truth: auth, checkout, and payement-backend

**Audience:** frontend + payement-backend maintainers. Customer copy stays in `src/data/rewardPolicy.public.md`.

**One-line summary (paste under prompts):**  
Coordinate with payement-backend: read tier from `GET /api/v1/auth/me` → `membership`; send order lines with the same flags/prices the backend validates; treat membership discount as server-authoritative once the API recomputes totals and rejects mismatched `total_price`.

---

## 1) Auth payload shape (payement-backend)

`GET /api/v1/auth/me` returns **`{ user, membership }`** (not user alone).

- **Tier / discount for membership** should come from **`membership`** (e.g. `membership.name`, or whatever fields the backend exposes for tier and optional `%`), **not** only from `user.membership_level` on the raw user row.
- If the site maps **`membership_level` only from `user.membership_level`**, tier can stay wrong vs the canonical membership service.
- **Normalize** tier labels to the product set: **silver / gold / platinum / platinum+** (and map legacy strings consistently).

**Website today (`src/api/auth.ts` → `getMe`):** the response is parsed and **`toAuthUser(d.user)`** is used when `user` is present. The sibling **`membership`** object is **not yet merged** into `AuthUser` in this repo—implement by merging `membership` into `toAuthUser` (or passing both) so `membership_level`, `membership_tier_raw`, and optional `membership_discount_*` reflect **`membership` first**, then fall back to `user`.

---

## 2) Order / payment payload contract (what the Next.js site sends today)

Checkout does **not** call `POST /orders` directly. It calls **`createPayment`** (`src/api/payment.ts`), which **POSTs** to the configured payment path (default **`/api/v1/payments/create`**, see `NEXT_PUBLIC_PAYMENT_CREATE_PATH`) with:

```ts
{
  amount: number        // AZN — net to charge (merchandise after membership − points discount + shipping)
  currency: string      // e.g. "AZN"
  reference: string
  returnUrl: string
  order?: {
    customer_id?: number
    customer_name: string
    mobile: string
    address?: string | null
    membership_level?: 'silver' | 'gold' | 'platinum' | 'none'
    order_date: string
    delivery_due_date?: string | null
    items: Array<{
      name: string
      quantity: number
      price: number              // unit price after membership rules (per line)
      sku_color?: string
      size?: string
      product_id?: string
      is_discounted?: boolean    // optional — excluded from reward earning (policy)
      promotional?: boolean     // optional — e.g. on-sale flag when not “discounted” line
    }>
    total_price: number         // must align with backend validation (see §3)
    points_to_redeem?: number
    delivery_contact_log_id?: number  // optional, from checkout-delivery log
  }
}
```

**Staff / sales** flows may use **`POST /orders`** via `src/api/orders.ts` (`createOrder`)—different from customer checkout; keep backend rules aligned.

**Backend line fields:** at minimum `price`, `quantity`, and identifiers the server uses (`product_id`, `sku_color`, `size`). Optional `is_discounted` / `promotional` for earning/stacking rules. If the backend models shipping as a synthetic line (e.g. `product_id: "__delivery__"`), document that in payement-backend—**this repo does not send that line today**; shipping is included in `amount` / checkout math on the client.

**Required rule:** **`charged amount` must match** what the backend **recomputes** from **items + `customer_id` + `points_to_redeem` + membership (+ shipping rules)**. The frontend must not be the only authority.

---

## 3) Backend enforcement status (honesty)

- **Until** payement-backend **validates** membership discount on **create payment / order** and **recomputes** `membership_discount_azn` (and merchandise totals), the **website breakdown is UX only**.
- **Risk:** tampered client or drift vs policy; **`total_price` / `amount` can be rejected** once the API enforces equality (e.g. the validation message about merchandise + shipping − points).
- **Goal:** backend recomputes **`membership_discount_azn`** and totals; **rejects wrong `total_price`**; frontend follows the same contract once shipped.

---

## 4) Single source of truth for rates

- **Prefer** backend-provided fields on **`membership`** or **`user`**: e.g. **`membership_discount_pct`** (0–100) or **`membership_discount_fraction`** (0–1), or an explicit tier table from the API.
- If only **`membership.name`** (or similar) exists, **hardcoded tier → fraction** in Next.js is acceptable **only** as a fallback and **must** stay aligned with **membershipService** / policy docs (`src/data/rewardPolicy.internal.md`, `src/lib/membershipDiscount.ts`, `src/lib/checkoutMerchandise.ts`).

---

## 5) Stacking order vs current backend (web + mobile alignment)

**Intended order (policy):**

1. **Merchandise** with **membership** on eligible (non-promo) catalogue lines → **post-membership merchandise subtotal**.
2. **Reward points redemption** applies to **merchandise**, **excluding shipping** (see `src/lib/rewardPointsRedemption.ts`, `rewardPolicy.internal.md`).
3. **Points cap** is computed vs **post-membership merchandise** (not pre-membership, not including shipping)—**confirm this matches payement-backend** when implemented; one sentence for mobile/web: *“Redemption caps and point discounts apply to merchandise after membership, before shipping.”*

Shipping is added **after** merchandise net and points discount in checkout (`src/app/checkout/page.tsx`).

---

## 6) Environment (same surface as mobile)

Use the **same API base** and **`/api/v1`** prefix as the mobile app so **`/auth/me`**, **`/products`**, and payment routes behave consistently:

- `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_AUTH_API_URL` / `NEXT_PUBLIC_PAYMENT_API_URL` → typically one host (e.g. payement-backend on Render).
- Paths are configured in `src/config.ts` (`authMePath`, `paymentCreatePath`, `productsPath`, etc.).

---

## Related files

| Area | Location |
|------|----------|
| Auth `getMe` | `src/api/auth.ts` |
| Payment payload types | `src/api/payment.ts` |
| Checkout totals + order body | `src/app/checkout/page.tsx` |
| Membership fraction fallback | `src/lib/membershipDiscount.ts` |
| Line-level merchandise + membership | `src/lib/checkoutMerchandise.ts` |
| Points redemption cap | `src/lib/rewardPointsRedemption.ts` |
| Reward policy (internal) | `src/data/rewardPolicy.internal.md` |
