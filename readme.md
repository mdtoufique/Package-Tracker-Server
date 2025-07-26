# 📦 Aamira Courier Package Tracker – Server

This is the backend server for the Aamira Courier Package Tracker challenge, built with **Node.js**, **Express**, and **MongoDB**. It handles courier updates, real-time dashboard data, stuck-package alerts, and secure access via API tokens.

---

## 📌 Additional Documentation

- [🧠 Assumptions & Design Decisions](./ASSUMPTIONS.md)

---

## 🔧 Tech Stack

- **Node.js** with **Express**
- **MongoDB Atlas** (Mongoose ODM)
- **ES Modules**
- **Deployed on Vercel**

---

## Features

- **Courier Event Ingestion**  
  Accepts package status updates via a secure API endpoint. Handles idempotency by ignoring duplicate or outdated events to maintain data integrity.

- **State & History Persistence**  
  Stores every package event in MongoDB, allowing reconstruction of full package history and reliable state tracking even after server restarts.

- **Real-Time Dispatcher Dashboard**  
  Displays active packages (excluding DELIVERED or CANCELLED) updated within the last 24 hours, showing package ID, current status, time since last update, and map location if available.  
  Supports drill-down into package event timelines. Uses WebSocket or polling for real-time updates with ≤5s latency.

- **Stuck Package Alerts**  
  Automatically detects packages inactive for over 30 minutes and generates alerts. Alerts are logged in a dedicated collection and displayed on the dashboard.  
  Uses a scheduled cron job running every 5 minutes to monitor package activity. Each package generates only one alert until new status updates arrive, avoiding alert spam.

- **Basic Security**  
  Secures API endpoints with an API token sent in the `x-api-token` header, preventing unauthorized access while keeping authentication lightweight.

- **Robust Error Handling**  
  Gracefully handles malformed input and transient database errors without crashing the service.

- **Idempotent & Out-of-Order Event Handling**  
  Manages events arriving out-of-order by comparing event timestamps and updating state accordingly, ensuring consistent package status.

- **Deployment Ready**  
  Backend deployed on Vercel with efficient project structure and environment configuration. Frontend deployed separately on Vercel as well.

- **Extensible Codebase**  
  Modular architecture with clearly separated concerns: controllers, models, routes, services, and utilities for maintainability and easy enhancements.

---

## ⚙️ Functionality Implementation

**F1. Ingest Courier Updates**  
- Implemented a REST POST endpoint `/api/packages/update` that accepts courier status events in JSON format.  
- Ensured idempotency by checking event timestamps and status to avoid duplicate or out-of-order updates corrupting the state.  
- Older events are ignored for updating the current package state but stored in history for audit purposes.

**F2. Persist State & History**  
- Used MongoDB to store all package events and maintain current state per package based on the latest valid event timestamp.  
- On server restart, the current state is reconstructed from the event history to ensure consistency.

**F3. Dispatcher Dashboard (Real-Time View)**  
- Created endpoints to fetch active packages and package timelines within the last 24 hours.  
- Implemented real-time updates using polling every 5 seconds from the frontend to reflect the latest package data without page reload.  
- Display ETA when available; otherwise, show a placeholder.

**F4. Stuck-Package Alerting (>30 Minutes)**  
- Implemented a cron job running every 5 minutes to detect packages inactive for over 30 minutes and still active.  
- Alerts are logged in a dedicated alerts collection and displayed on the dashboard.  
- Alert spam prevention: only one alert per package until a new status update arrives.

**F5. Basic Security / Access Control (Lightweight)**  
- Secured API endpoints by requiring an `x-api-token` header for authenticated routes.  
- The API token is configurable via environment variables and checked on each request to prevent unauthorized access.

---

## 🚀 Live Server

📡 **API Base URL:**  
`https://package-tracker-server-sigma.vercel.app`

---

## 📂 Project Structure

```plaintext
AAMIRA-SERVER/
├── api/
│   └── index.js
├── node_modules/
├── src/
│   ├── controllers/
│   ├── middlewares/
│   │   └── auth.js
│   ├── models/
│   │   ├── Alert.js
│   │   ├── Package.js
│   │   └── PackageEvent.js
│   ├── routes/
│   │   ├── alertRoutes.js
│   │   └── packageRoutes.js
│   ├── scripts/
│   │   └── cleanupOrphanData.js
│   ├── services/
│   │   ├── alertService.js
│   │   └── alertServiceCJ.js
│   ├── utils/
│   │   └── db.js
│   ├── app.js
│   └── server.js
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── readme.md
├── ASSUMPTIONS.md
└── vercel.json

```

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/mdtoufique/Package-Tracker-Server.git
cd Package-Tracker-Server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a .env file in the root:

```ini
PORT=your_port
MONGO_URI=your_mongodb_connection_string
API_TOKEN=your_api_token_here
```

### 4. Run locally

```bash
npm run dev
```

App will be available at: http://localhost:5000

---

## 🌐 API Endpoints

### Public

    GET / → Status check

### Authenticated (requires `x-api-token` header)

    POST /api/packages/update → Ingest courier event

    GET /api/packages/active → List active packages (last 24h)

    GET /api/packages/:id → Get package timeline

    GET /api/alerts/count → Count stuck package alerts

    GET /api/alerts/active → View all triggered alerts

---

## 🔔 Stuck Package Alerts

- Alerts are triggered when a package is inactive for >30 minutes.

- Alerts are logged to the alerts collection.

- Only one alert is generated per package until a new update is received.

- A cron job runs every 5 minutes to check for stuck packages and trigger alerts accordingly.

---


## 🔐 Authentication

Use the `x-api-token` header on all secured routes.

    x-api-token: aamira_2025_TOUFIQUE

---

## 📤 Deployment

Backend is deployed via **Vercel** with `src/api/index.js` as the entry point (mapped to `server.js`).

---

## 🧪 Testing & Debugging

- Logs database connection and alert service start

- Handles malformed input gracefully

- Ignores duplicate or outdated status updates

---

## 📄 Related Repos

- **Frontend**: [Package-Tracker-Client](https://github.com/mdtoufique/Package-Tracker-Client)

---

## 📧 Submission Info

- **GitHub**: [mdtoufique](https://github.com/mdtoufique)  
- **Email**: mdrehmant@email.com
