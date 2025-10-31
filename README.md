# AyurvedicCare — Ayurvedic Consultation Platform

A full‑stack web application that connects patients with licensed Ayurvedic doctors for online consultations and appointment management. Built with React (frontend), Node.js + Express (API), and MongoDB (database).

## Key features

- Doctor discovery and filtering
- Secure authentication and role‑based access
- Slot locking and reliable booking
- Appointment management: create, view, cancel, reschedule, complete
- Ratings and reviews
- Doctor profile and availability management
- Responsive UI

## Tech stack

- Frontend: React, React Router, React Hook Form, Tailwind CSS, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Security & utilities: JWT, bcryptjs, Helmet, CORS, express‑validator

## Prerequisites

- Node.js v14+ and npm (or yarn)
- MongoDB (local or Atlas)

## Getting started

1. Clone and install dependencies:

```powershell
git clone <repository-url>
cd AyurvedicCare
npm install
cd server; npm install
cd ../client; npm install
```

2. Create and configure the server environment file:

```powershell
cd server
copy env.example .env
# Edit .env to set PORT, MONGODB_URI, JWT_SECRET, etc.
```

3. Start the application (development):

```powershell
# From project root
npm run dev
# Or run backend and frontend separately
cd server; npm run dev
cd client; npm start
```

4. Open the app:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000 (or as configured)

## Project structure

```
AyurvedicCare/
├─ server/            # Express API, models, routes, utilities
├─ client/            # React frontend
├─ package.json       # root scripts and tooling
└─ README.md
```

## API overview

Routes are mounted under `/api/*`. Refer to `server/routes/` for full details. Common endpoints include:

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/doctors`, `GET /api/doctors/:id`
- `POST /api/slots/lock`, `POST /api/slots/book`
- `POST /api/appointments`, `PUT /api/appointments/:id/cancel`

## Testing

- Backend:

```powershell
cd server
npm test
```

- Frontend:

```powershell
cd client
npm test
```

## Deployment notes

- Use MongoDB Atlas or other managed DB in production.
- Set environment variables securely (JWT secrets, DB URIs, etc.).
- Build the frontend (`cd client && npm run build`) and serve static files from a CDN or hosting provider.

## Security considerations

- Keep secrets out of source control.
- Enforce HTTPS in production.
- Use rate limiting, input validation, and secure headers (Helmet).

## Contributing

Contributions welcome. Please submit pull requests against `master` and include tests for new behavior where applicable.
