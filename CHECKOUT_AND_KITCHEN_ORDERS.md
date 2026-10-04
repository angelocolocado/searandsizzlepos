# Checkout and Kitchen Orders

## Checkout routes

### `POST /api/v1/checkout`

Supports:

- `intent: prepare` — calculates `totalAmount` only.
- `intent: checkout` — calculates the total, deducts inventory, processes payment, and records an order.

For `intent: checkout`, the request must include:

```json
{
  "intent": "checkout",
  "order_type": "dine_in",
  "payment_method": "cash",
  "cart": [
    {
      "menu_id": "01a105fc-5aaa-7182-b632-603ec02e1902",
      "quantity": 1,
      "modifiers": [
        {
          "modifier_id": "01a105fe-9fde-726b-9eca-680ba32991b3",
          "quantity": 4
        }
      ]
    }
  ]
}
```

`order_type` accepts:

- `dine_in`
- `take_out`

`payment_method` accepts:

- `cash`
- `cashless`
- `pay_later`

Successful checkout response:

```json
{
  "status": "success",
  "totalAmount": 180,
  "payment_method": "cash",
  "payment": {
    "status": "accepted",
    "amount": 180
  }
}
```

`pay_later` records the order with `payment_status: pay_later`. Cash and cashless
record the order with `payment_status: paid`. The order always starts with
`status: cooking`.

### `POST /api/v1/pay-later`

This is a dedicated pay-later checkout route. It accepts the same cart and
`intent: checkout` payload, but its `payment_method` is intentionally limited to:

- `cash`
- `cashless`

The route calculates the amount, deducts inventory, sends the payment to the
appropriate cash or cashless service, and records the order as `pay_later`.

Example:

```json
{
  "intent": "checkout",
  "order_type": "take_out",
  "payment_method": "cash",
  "cart": [
    {
      "menu_id": "01a105fc-5aaa-7182-b632-603ec02e1902",
      "quantity": 1,
      "modifiers": [
        {
          "modifier_id": "01a105fe-9fde-726b-9eca-680ba32991b3",
          "quantity": 4
        }
      ]
    }
  ]
}
```

This route is intended for orders where payment is collected later even though
the selected checkout/payment processing service is cash or cashless.

## Kitchen orders

### `GET /api/v1/orders/cooking`

Returns only orders whose kitchen status is currently `cooking`. Orders marked
`cooked` are not returned.

Example response:

```json
[
  {
    "orderNumber": 1,
    "itemCount": 3,
    "elapsed": "1 min ago",
    "type": "Dine in",
    "payment_status": "paid"
  },
  {
    "orderNumber": 2,
    "itemCount": 2,
    "elapsed": "5 mins ago",
    "type": "Take out",
    "payment_status": "pay_later"
  }
]
```

`itemCount` counts menu units from the cart quantities. Modifier quantities are
not added to this count.

The order record is separate from ingredient stock and stock-log records. It
tracks kitchen state, order type, payment method, payment status, total amount,
and the order number for kitchen display.

## Validation and unsuccessful responses

Invalid input returns HTTP `422`:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "order_type": [
      "The order type field is required."
    ]
  }
}
```

Insufficient inventory also returns HTTP `422`; the transaction rolls back, so
the payment is not accepted and no order is recorded.
