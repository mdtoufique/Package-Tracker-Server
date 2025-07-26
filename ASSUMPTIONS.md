# 📄 ASSUMPTIONS – Backend (Aamira Package Tracker)

This document outlines assumptions, design choices, and known limitations made while building the backend for the Aamira Courier Package Tracker challenge.

---

## 🧠 General Assumptions

- The system is for internal use only, meant for dispatchers and couriers.
- No full authentication system is needed—lightweight API token-based access is sufficient.
- MongoDB Atlas is used for data persistence due to flexibility and faster development.
- Project is deployed on Vercel with `src/api/index.js` as the entry point.

---

## 📦 Package Lifecycle & Statuses

- The `status` field follows a strict set of enumerated values for validation:  
  `CREATED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `EXCEPTION`, `CANCELLED`.
- ✅ An additional custom status `STUCK` was introduced.  
  This status is not courier-submitted but **generated internally** by the backend to:
  - flag stuck packages in the database,  
  - enable easier filtering in dashboards,  
  - and **improve visibility of alert-triggered packages**.
- Terminal statuses like `DELIVERED` and `CANCELLED` define when a package becomes inactive.

---
## 📦 Package Status Lifecycle

This system enforces a strict status transition lifecycle to ensure reliable tracking and consistent updates.

---

### 🧾 Status Definitions

- `CREATED` – Label generated; package not yet picked up.
- `PICKED_UP` – Courier has picked up the package.
- `IN_TRANSIT` – Package is moving between hubs or facilities.
- `OUT_FOR_DELIVERY` – Package is out with a delivery agent for final drop.
- `DELIVERED` – Package delivered to the recipient.
- `EXCEPTION` – Temporary issue such as address error, weather hold, etc.
- `STUCK` – Package has not progressed in a while; awaiting further updates.
- `CANCELLED` – Shipment was cancelled.

---

### 🔁 Status Transition Table

| **Current Status**     | **Allowed Next Statuses**                      |
|------------------------|------------------------------------------------|
| `CREATED`              | `PICKED_UP`, `CANCELLED`, `EXCEPTION` ,`STUCK` |
| `PICKED_UP`            | `IN_TRANSIT`, `EXCEPTION`, `STUCK`             |
| `IN_TRANSIT`           | `OUT_FOR_DELIVERY`, `EXCEPTION`, `STUCK`       |
| `OUT_FOR_DELIVERY`     | `DELIVERED`, `EXCEPTION`, `STUCK`              |
| `EXCEPTION`            | *(Can transition forward again)*               |
| `STUCK`                | *(Can transition forward again)*               |
| `DELIVERED`            | *(No further transitions)*                     |
| `CANCELLED`            | *(No further transitions)*                     |

---

### ⚠️ Backend Validation Rules

- A package must be initialized with the `CREATED` status.
- No updates are accepted once a package is `DELIVERED` or `CANCELLED`.
- Only valid transitions (as per the table above) are allowed.
- Skipping intermediate steps (e.g., `CREATED` → `IN_TRANSIT`) is **not allowed**.
- `EXCEPTION` and `STUCK` are temporary states and allow resuming forward progression.

---

### 🧭 Example Lifecycle

```text
CREATED     →   PICKED_UP   →   IN_TRANSIT  →   OUT_FOR_DELIVERY    →   DELIVERED
|→ (CANCELLED)      ↘              ↘                 ↘
|→------------------------------------------------------------→  (EXCEPTION || STUCK) → (resume flow FORWARD)

```

---

## 🧾 Data Model Design

- MongoDB is chosen for flexibility and document-oriented modeling.
- Collections:
  - `packages`: stores the latest state per package.
  - `packageevents`: stores full chronological history of all package updates.
  - `alerts`: stores alert records triggered for stuck packages.

---

## ⏱️ Out-of-Order & Duplicate Events

- If a new event's `event_timestamp` is **older than** the current one, it is:
  - ignored for updating state,
  - but **stored in `PackageEvent` collection** to preserve audit history.
- If a new event has the **same timestamp but different content**, it **updates** the record.
- All events are saved in `PackageEvent`, even if they don't change the latest status.

---

## 🔁 Stuck Package Alerting Strategy

- Packages inactive for more than **30 minutes** (no new events) are considered stuck.
- A **cron job** runs every **5 minutes** to detect and resolve for such packages.
- Each package triggers **only one alert** until a new status is received.
- Alerts are stored in the `alerts` collection and exposed via the API (`/api/alerts/active`, etc.).
- Alerts are not re-triggered periodically to avoid spam.

---

## 🌐 Real-Time Updates

- Frontend uses **polling every 5 seconds** to retrieve updated package info.
- WebSocket support was not added to simplify the initial implementation, but the system can easily be extended to use it in the future.

---

## 🔐 Security

- All API require an `x-api-token` header to access.
- The token is stored securely in environment variables.
- No user-role authentication is implemented but can be added later.

---

## 🗺️ Location & ETA Handling

- `lat`, `lon`, and `eta` are **optional** fields in courier updates.
- ETA is taken as-is from the courier/client—**no dynamic computation** is done.
- Frontend converts timestamps and ETA to **Bangladesh Time (UTC+6)** for display consistency.

---

## 🚫 Limitations & Trade-offs

- ❌ No WebSocket or SSE—real-time achieved via frontend polling.
- ❌ No admin panel to manually manage stuck packages or view system health.
- ❌ No advanced logging or metrics integration.
- ❌ NO Send e-mail functionality for alerts

---

## 🔜 Future Improvements

- Implement WebSocket or Server-Sent Events (SSE) for true real-time updates, reducing polling overhead.
- Add role-based authentication and authorization for enhanced security (e.g., separate courier and dispatcher roles).
- Develop an admin dashboard for manual alert management and package state overrides.
- Integrate advanced logging, monitoring, and alerting tools for operational insights.
- Enhance input validation and introduce rate limiting to prevent abuse.
- Automated email support for alerts

---

## 📌 Additional Notes

- Timestamp fields (like `event_timestamp`) are **intentionally made uneditable** through the UI and API.  
  This prevents tampering or misuse of the system and ensures integrity in tracking and alerting.  
  ✅ It enforces data trust and protecting.

---

**Author:** [mdtoufique](https://github.com/mdtoufique)  
**Challenge:** Aamira Courier Package Tracker – Backend  
**Date:** July 26, 2025
