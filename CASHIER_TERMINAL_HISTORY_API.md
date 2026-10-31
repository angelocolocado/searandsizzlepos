# Cashier Terminal History API

This endpoint returns the authenticated cashier's orders and sales KPI for **today only**. It is read-only. It does not expose an operation for voiding an order.

## Endpoint

### `GET /api/v1/orders/terminal-history`

Authentication:

```http
Authorization: Bearer <sanctum-token>
```

The endpoint determines the cashier from the authenticated Sanctum user. It does not accept a `cashier_id`, username, date, or period parameter, so a cashier cannot request another cashier's data or another date.

Only users with account type `CASHIER` may call this endpoint. Owners, branch managers, and other account types receive `403 Forbidden`; they should use `GET /api/v1/sales` for admin sales history.

## Successful response (`200 OK`)

```json
{
  "kpi": {
    "date": "2026-11-01",
    "revenue": 100,
    "total_orders": 2,
    "successful_orders": 1,
    "voided_orders": 1,
    "paid_orders": 1
  },
  "orders": [
    {
      "id": 15,
      "order_number": 23,
      "cart_id": "cart-uuid",
      "item_count": 1,
      "order_type": "take_out",
      "payment_method": "cash",
      "payment_status": "paid",
      "status": "cooked",
      "subtotal_amount": 100,
      "total_amount": 90,
      "voucher_applied": true,
      "voucher_code": "LESS10",
      "discount_amount": 10,
      "void_reason": null,
      "admin_void_reason": null,
      "voided_by": null,
      "voided_at": null,
      "order_items": [
        {
          "name": "Beef Meal",
          "quantity": 1,
          "modifiers": []
        }
      ],
      "created_at": "2026-11-01T00:01:00.000000Z",
      "updated_at": "2026-11-01T00:01:00.000000Z"
    }
  ]
}
```

`orders` contains all orders created today by the authenticated cashier, including paid, pay-later, and voided orders. Results are ordered newest first.

## KPI rules

| Field | Meaning |
|---|---|
| `date` | The server's current local date used for the query. |
| `revenue` | Gross `subtotal_amount` for paid, non-voided orders. Legacy orders fall back to `total_amount`; vouchers do not reduce this value. |
| `total_orders` | All of the cashier's orders created today, including voided and pay-later orders. |
| `successful_orders` | Paid orders created today that are not voided. |
| `voided_orders` | Orders whose status is `void`, regardless of payment status. |
| `paid_orders` | Alias-style count of paid, non-voided orders included in successful sales. |

No pagination or client-provided date filter is supported because this endpoint is intended for the current cashier terminal's daily view.

## Void restriction

This endpoint only performs `GET` retrieval and has no void route. Cashier terminal history must not display an admin void action. Admin/manager voiding remains available only through:

```http
POST /api/v1/sales/{order}/void
```

The existing operational status route is separate from this endpoint:

```http
PATCH /api/v1/orders/{order}/status
```

## Error responses

### Unauthenticated (`401`)

Returned when no valid Sanctum token is supplied.

### Forbidden (`403`)

Returned when the authenticated account is not a cashier.
