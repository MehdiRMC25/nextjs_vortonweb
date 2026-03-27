# Vorton — Customer reward points policy

This document is the source of truth for the reward points programme. The website and backend apply the **calculation rules** below; **redemption** (paying with points at checkout) may be enabled in a future release—in the meantime, balances accrue and rules are shown to customers.

## Earning points

Customers earn reward points on **eligible** purchase value (order subtotal excluding discounted or promotional lines), tiered by **eligible amount in AZN**:

| Eligible order value (AZN) | Points back (% of eligible subtotal) |
|----------------------------|--------------------------------------|
| 0 – 119.99                 | 3%                                   |
| 120 – 299.99               | 5%                                   |
| 300+                       | 7%                                   |

**Conversion:** reward value is computed in AZN, then converted to points at:

**1 AZN = 11 points** (i.e. points = `round(AZN_reward × 11)`).

**Example:** Eligible subtotal 300 AZN at 7% → 21 AZN reward → **231 points**.

## Exclusions (no points earned)

- **Discounted or promotional line items** — lines where the paid price is below the regular/list price do not count toward the eligible subtotal.
- If the **entire** order is discounted/promotional, **zero** points are earned for that order.

## Redemption

- Points are **not** applied automatically at checkout. The customer must choose an action such as **“Use my points”** before any discount is taken from the order total.
- Points may be used on **future** purchases.
- **Up to 30–50%** of an order may be paid with points (the site currently caps at **50%** of merchandise total unless configured otherwise).
- Points **cannot** be combined with **active discounts** or **special promotions** on the same order (enforcement may be extended per line flags).
- Points may **expire** (e.g. **12 months** from the date they were earned); expiry is recorded per accrual in the ledger.

## After purchase

- Earned points for an order are stored on the order record and added to the customer’s **reward points balance**.
- Customers see their **balance** on **My account** and **points earned per order** in order history / order detail where applicable.

## Technical reference

- Backend: `payement_backend/src/services/rewardPointsPolicy.ts` (pure calculation).
- Backend: `payement_backend/src/services/rewardPointsService.ts` (persistence, idempotent per order).
- SQL: `payement_backend/sql/reward-points.sql`.
