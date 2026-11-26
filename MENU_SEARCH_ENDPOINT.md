# Menu search endpoint contract

The frontend searches menu items already loaded in memory first. If there are
no local matches, it calls this endpoint after a 350 ms debounce.

## Request

`GET /v1/menus/search?query=<text>&limit=<number>`

- `query` is required, trimmed, and 1-100 characters.
- `limit` is optional, defaults to `10`, and must be capped at `20`.
- Search menu names and descriptions case-insensitively across categories
  visible to the authenticated user. Match partial text.
- Return menu records in the same shape as
  `app/types/menu-category.ts`'s `MenuItem`, including availability and
  modifier data, so the POS can display and select a result.
- Include unavailable matches too; the frontend disables results that cannot
  currently be added to an order.

Example:

```http
GET /v1/menus/search?query=spicy%20chicken&limit=10
Accept: application/json
```

## Success response

Return HTTP `200` with the normalized query and a `results` array. Return an
empty array when there are no matches.

```json
{
  "query": "spicy chicken",
  "results": [
    {
      "id": "menu-123",
      "name": "Spicy Chicken",
      "selling_price": 250,
      "description": "Grilled chicken with spicy sauce",
      "status": "available",
      "insufficient": false,
      "max_quantity": 8,
      "modifiers": [
        {
          "id": "modifier-456",
          "name": "Extra sauce",
          "price": 20,
          "category": "Add-ons"
        }
      ]
    }
  ]
}
```

## Errors

- `401` when the caller is unauthenticated.
- `422` for a missing/invalid `query` or invalid `limit`, using the API's
  standard validation error response.

The frontend treats `404` as an endpoint-not-implemented response until this
contract is available on the backend.
