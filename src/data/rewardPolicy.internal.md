# Reward points policy (internal reference only)

**Do not surface this file in the app UI.** Customer-facing copy lives in `src/data/rewardPolicy.public.md`. Website earn **estimates**: `src/lib/rewardPointsEarn.ts` (used by checkout UI). Redemption helpers: `src/lib/rewardPointsRedemption.ts` (keep in sync with payment backend / PostgreSQL).

## Earning (eligible merchandise subtotal in merchant currency / AZN, regular-price lines only)

- 0–72 → 2% back in points
- 72–180 → 3.5% back in points
- 180+ → 5% back in points

**Conversion:** 1 currency unit of reward value = 11 points (same as checkout `POINTS_PER_AZN`).

Example: 200 eligible at 5% → 10 reward value → 110 points.

**Notes:**
- Eligible subtotal = sum of non-discounted items only.
- Points are calculated per order and rounded down to nearest whole point.
- Reward rates are intentionally conservative to protect premium positioning.

## Redemption

- Points can be applied as a discount at checkout via “Use my points”.
- 11 points = 1 unit discount value (e.g. 1 ₼).
- Points can only be applied to non-discounted items within the cart.
- Points cannot exceed the value of eligible (non-discounted) items.
- Partial redemption is allowed.
- Points expire after 12 months (rolling basis, enforced server-side).

## Exclusions

- No points earned on discounted or promotional line items.
- No points earned on delivery fees or additional services.

## Membership levels (based on cumulative lifetime spend)

### Silver (0–2,999 USD)
- 3% discount on regular-price items
- Early access to new collections

### Gold (3,000–7,199 USD)
- 5% discount on regular-price items
- Early access to new collections
- Early access to promotions

### Platinum (7,200–11,999 USD)
- 8% discount on regular-price items
- Early access to new collections
- Early access to promotions
- Priority customer support

### Platinum+ (12,000+ USD)
- 10% discount on regular-price items
- Early access to new collections
- Early access to promotions
- Priority customer support
- Exclusive member-only offers

## Membership rules

- Membership tier is calculated based on cumulative lifetime spend.
- Tier upgrades apply automatically after threshold is reached.
- Discounts apply to regular-price items only.
- Membership discounts do not stack with other promotions.

## Exclusions on membership benefits

- Membership discounts do not apply to discounted or promotional items.
- Membership discounts do not stack with other promotions.
- Points redemption applies only to non-discounted items.

## Implementation notes

- Always persist reward transactions (earn/redeem/expire) in a dedicated table.
- Never delete reward history (append-only ledger).
- Orders must remain immutable for audit and reporting.
- All calculations must be validated server-side (never trust client input).