# Kitchen Order Actions and Pay-Later Settlement

All routes use the `/api/v1` prefix.

## Kitchen order statuses

Orders start as `cooking`. The allowed final statuses are `cooked` and `void`.
Orders marked `cooked` or `void` are no longer returned by
`GET /api/v1/orders/cooking`.

## Mark an order as cooked

```http
PATCH /api/v1/orders/{orderId}/status
Content-Type: application/json
```

```json
{
  "status": "cooked"
}
```

Response:

```json
{
  "orderNumber": 1,
  "status": "cooked",
  "void_reason": null
}
```

## Void an order

Use the same endpoint with a required enum-backed reason:

```json
{
  "status": "void",
  "void_reason": 2
}
```

| Value | Reason |
|---:|---|
| `1` | Customer Changed Mind |
| `2` | Cashier Encoding Error |
| `3` | Out of Stock / Unavailable |
| `4` | Quality Issue / Damaged |

Response:

```json
{
  "orderNumber": 1,
  "status": "void",
  "void_reason": 2
}
```

`void_reason` is required only when `status` is `void`. Invalid requests return
HTTP `422` with Laravel validation errors.

## Kitchen order list

```http
GET /api/v1/orders/cooking
```

Only `cooking` orders are returned:

```json
[
  {
    "orderNumber": 1,
    "itemCount": 3,
    "elapsed": "1 min ago",
    "type": "Dine in",
    "payment_status": "pay_later",
    "totalPayment": 180,
    "order": [
      {
        "name": "Chicken Adobo",
        "quantity": 1,
        "modifiers": [
          {
            "name": "Plain Rice",
            "quantity": 4
          }
        ]
      }
    ]
  }
]
```

The `order` field is included for every payment status. It contains the menu
name, menu quantity, and selected modifier names and quantities captured when
the order was created. `totalPayment` is included only when
`payment_status` is `pay_later`.

## Pay a pay-later order

Create a pay-later order through `POST /api/v1/checkout` using
`payment_method: pay_later`, or through `POST /api/v1/pay-later` using
`payment_method: cash` or `cashless`.

To settle the existing order:

```http
POST /api/v1/orders/{orderId}/pay
Content-Type: application/json
```

```json
{
  "payment_method": "cash"
}
```

Only `cash` and `cashless` are accepted for settlement. A successful response:

```json
{
  "status": "success",
  "orderNumber": 1,
  "payment_method": "cash",
  "payment": {
    "status": "accepted",
    "amount": 180
  }
}
```

Settlement changes the order's `payment_status` from `pay_later` to `paid`.
Inventory is not deducted again because it was deducted when the order was
created.

Kitchen orders are separate from ingredient stock records and stock logs.
