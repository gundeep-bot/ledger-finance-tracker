# Ledger — Personal Finance & Subscription Tracker

Track spending and recurring bills, in one calm place.

## Live Demo
- Frontend: https://ledger-finance-tracker-brown.vercel.app
- Backend API: https://ledger-finance-tracker.onrender.com/api/health

## Tech Stack
**Frontend:** React, Vite, React Router, Recharts, Framer Motion
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT Authentication
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

## Features
- User authentication (JWT-based sign up/login)
- Transaction tracking and history
- Subscription/recurring bill management
- Automated hourly billing cron job

## Running Locally

### Backend
\`\`\`bash
cd finance-tracker-backend
npm install
npm run dev
\`\`\`
Create a `.env` file based on `.env.example` with your own MongoDB URI and JWT secret.

### Frontend
\`\`\`bash
cd finance-tracker-frontend
npm install
npm run dev
\`\`\`

## Note
Backend runs on Render's free tier — the first request after a period of inactivity may take 20-30 seconds to respond (cold start).