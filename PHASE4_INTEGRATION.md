# Phase 4 — Connect TicketPass to the ML API

## Where this hooks in

The ML call happens **after** the existing system has already found and
validated the ticket — never before, never instead of it:

```
QR scanned → ticket found → ticket validated → [ NEW: call ML API ] → response to frontend
```

The ML API (Phase 3, `predict_api.py`) is a separate service. TicketPass's
existing backend calls it over HTTP with the order's data and gets back
`{"ticket_type": "DIGITAL", "confidence": 0.94}`.

## Request the TicketPass backend should send

`POST http://<ml-api-host>:5000/predict`

```json
{
  "payment_method": "ABA",
  "unit_price": 15,
  "quantity": 1,
  "total_amount": 15,
  "hour_of_purchase": 14,
  "day_of_week": "MONDAY",
  "has_notes": true,
  "ticket_tier": "VIP",
  "time_since_purchase_hours": 48
}
```

`payment_method`, `day_of_week`, and `ticket_tier` can be sent either as
these human-readable strings or as the already-encoded integers — see the
maps at the top of `predict_api.py` (these still need to be confirmed
against however `training_data.csv` was originally generated).

## Example: calling it from a Node.js/Express backend

```javascript
async function getMlTicketTypePrediction(order) {
  const response = await fetch("http://localhost:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      payment_method: order.paymentMethod,
      unit_price: order.unitPrice,
      quantity: order.quantity,
      total_amount: order.totalAmount,
      hour_of_purchase: new Date(order.purchasedAt).getHours(),
      day_of_week: new Date(order.purchasedAt)
        .toLocaleDateString("en-US", { weekday: "long" })
        .toUpperCase(),
      has_notes: Boolean(order.notes && order.notes.length > 0),
      ticket_tier: order.ticketTier,
      time_since_purchase_hours:
        (Date.now() - new Date(order.purchasedAt)) / 1000 / 60 / 60,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`ML API error: ${err.error}`);
  }
  return response.json(); // { ticket_type, confidence }
}

// inside the existing QR-scan/validate route, AFTER validation succeeds:
const ticket = await findTicketByQrToken(qrToken);
const isValid = await validateTicket(ticket);

if (isValid) {
  const prediction = await getMlTicketTypePrediction(ticket.order);
  return res.json({ ...ticket, ml_prediction: prediction });
}
```

## Example: calling it from a Python backend (Django/Flask/FastAPI)

```python
import requests

def get_ml_ticket_type_prediction(order: dict) -> dict:
    response = requests.post(
        "http://localhost:5000/predict",
        json={
            "payment_method": order["payment_method"],
            "unit_price": order["unit_price"],
            "quantity": order["quantity"],
            "total_amount": order["total_amount"],
            "hour_of_purchase": order["purchased_at"].hour,
            "day_of_week": order["purchased_at"].strftime("%A").upper(),
            "has_notes": bool(order.get("notes")),
            "ticket_tier": order["ticket_tier"],
            "time_since_purchase_hours": order["hours_since_purchase"],
        },
        timeout=5,
    )
    response.raise_for_status()
    return response.json()  # {"ticket_type": ..., "confidence": ...}

# inside the existing QR-scan/validate view, AFTER validation succeeds:
ticket = find_ticket_by_qr_token(qr_token)
if validate_ticket(ticket):
    prediction = get_ml_ticket_type_prediction(ticket.order)
    return JsonResponse({**ticket_data, "ml_prediction": prediction})
```

## Failure handling (recommended)

The ML prediction should never be able to block a valid ticket from being
accepted — treat it as informational, not gatekeeping:

```javascript
let prediction = null;
try {
  prediction = await getMlTicketTypePrediction(ticket.order);
} catch (e) {
  console.error("ML prediction unavailable:", e.message);
  // fall through — ticket is still valid, we just skip the prediction
}
```

## Still needed before this is production-ready

1. **Confirm the categorical encodings** in `predict_api.py`
   (`PAYMENT_METHOD_MAP`, `TICKET_TIER_MAP`) against whatever actually
   generated `training_data.csv` — right now they're placeholders.
2. **Tell me what language/framework the real TicketPass backend uses**
   (Node/Express, Django, Laravel, etc.) if you want the exact route
   wired in rather than the generic example above.
3. Decide on deployment: run `predict_api.py` as its own service (e.g.
   with `gunicorn`) alongside the main backend, on the same host or a
   separate one reachable over the network.
