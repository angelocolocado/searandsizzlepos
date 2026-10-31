# Checkout Voucher Integration API

This document describes the checkout changes required by the voucher/coupon feature. All routes require the existing Sanctum authentication and `throttle:100` middleware. Cashiers may use these routes through the existing `OrderPolicy::checkout` authorization.

## Modified endpoint

### `POST /api/v1/checkout`

The existing checkout request now accepts the optional `voucher_code` field. The cashier terminal may send it during both `intent: "prepare"` and `intent: "checkout"`.

The existing `items`, `payment_method`, `order_type`, `cart_uuid`, and `intent` fields remain unchanged.

#### Request with a voucher

```json
{
  "intent": "checkout",
  "cart_uuid": "1f7e5d64-9a9d-4c0f-b4f3-0f377b07d3b0",
  "order_type": "dine_in",
  "payment_method": "cash",
  "voucher_code": "SAVE20",
  "items": [
    {
      "menu_id": "2e0d1f24-8e06-4f4d-a50d-b2fb4b0d1e5d",
      "quantity": 2,
      "modifiers": []
    }
  ]
}
```

`voucher_code` is optional, is case-insensitive, and is normalized to uppercase. A valid voucher is checked again inside the checkout transaction. Its stock is decremented only during a real checkout, not during `prepare` or voucher validation. If the voucher is invalid at checkout, the request returns `422` and no order, payment, inventory deduction, or voucher stock change is committed.

#### Response with a voucher

The existing response fields remain available. Voucher checkout responses additionally include:

```json
{
  "status": "success",
  "order_number": 42,
  "subtotal": 1000,
  "discount_amount": 200,
  "totalAmount": 800,
  "voucher_code": "SAVE20",
  "payment_method": "cash",
  "payment": {
    "status": "accepted",
    "amount": 800
  }
}
```

`subtotal` is the cart total before discount. `discount_amount` is the actual discount after applying the voucher rules and maximum cap. `totalAmount` and the payment amount are the final amount after discount.

When no voucher is provided, existing response behavior is preserved and voucher-specific response fields are omitted.

#### Prepare response with a voucher

For `intent: "prepare"`, the response contains the recalculated amount and does not consume stock:

```json
{
  "totalAmount": 800,
  "subtotal": 1000,
  "discount_amount": 200,
  "voucher_code": "SAVE20",
  "voucher_valid": true,
  "voucher_message": null
}
```

When the voucher is invalid during prepare, `voucher_valid` is `false`, `discount_amount` is `0`, `totalAmount` equals `subtotal`, and `voucher_message` explains the reason. The prepare call itself does not fail or consume stock; the final checkout still validates the voucher and returns `422` if it remains invalid.

## New endpoint: validate voucher

### `POST /api/v1/checkout/voucher`

This endpoint is intended for the cashier terminal after the cashier enters a voucher. It calculates the cart subtotal using the same menu/modifier pricing logic as checkout and previews the discount without consuming stock.

#### Request

```json
{
  "voucher_code": "SAVE20",
  "items": [
    {
      "menu_id": "2e0d1f24-8e06-4f4d-a50d-b2fb4b0d1e5d",
      "quantity": 2,
      "modifiers": [
        {
          "modifier_id": "b9e8d8a0-4b89-438e-a77a-0aa1d49db55e",
          "quantity": 1
        }
      ]
    }
  ]
}
```

The `items` contract is the same as checkout. The endpoint returns `422` for malformed cart items or unknown menu/modifier IDs.

#### Valid response (`200 OK`)

```json
{
  "valid": true,
  "voucher_code": "SAVE20",
  "subtotal": 1000,
  "discount_amount": 200,
  "total_amount": 800,
  "message": null
}
```

#### Invalid voucher response (`200 OK`)

```json
{
  "valid": false,
  "voucher_code": "SAVE20",
  "subtotal": 1000,
  "discount_amount": 0,
  "total_amount": 1000,
  "message": "This voucher has expired."
}
```

Invalid voucher codes, inactive vouchers, expired vouchers, out-of-stock vouchers, and orders below the minimum purchase return `200` with `valid: false`, allowing the terminal to display the reason without treating the preview request as a transport error. No stock is consumed.

## Discount rules

- `percentage`: `subtotal * discount_value / 100`, capped by `max_discount_amount` when configured.
- `fixed`: subtracts `discount_value` pesos.
- Discount cannot exceed the subtotal; final amount is never negative.
- `minimum_purchase` is evaluated against the subtotal before discount.
- Voucher status is checked for `active`, expiry, and available stock.
- A successful real checkout decrements stock by exactly one and stores `voucher_code` and `discount_amount` on the order.
- Voucher records are not deleted when they expire or run out of stock.

## Error contracts

Authentication failure: `401 Unauthorized`.

Insufficient checkout permission: `403 Forbidden`.

Malformed request/cart: `422 Unprocessable Entity` with Laravel validation errors.

Voucher becomes invalid between preview and checkout: `422 Unprocessable Entity`.

Example checkout validation error:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "voucher_code": [
      "This voucher has expired."
    ]
  }
}
```
