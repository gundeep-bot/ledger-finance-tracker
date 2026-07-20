# Personal Finance & Subscription Tracker — Backend

## Setup
```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
npm run dev             # or: npm start
```

Requires a running MongoDB instance (local or Atlas).

## Architecture
- **models/** — Mongoose schemas: `User`, `Transaction`, `Subscription`
- **controllers/** — business logic per resource
- **routes/** — Express routers, mounted under `/api/*`
- **middleware/auth.js** — verifies JWT, attaches `req.userId`
- **jobs/billingJob.js** — `node-cron` job (hourly) that finds subscriptions
  with a due `nextBillingDate`, creates a `Transaction` for each, and
  advances the subscription to its next cycle. Wrapped in a MongoDB
  transaction so a partial failure never bills a Transaction without
  advancing the date (or vice versa).

## API Overview

### Auth (`/api/auth`)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /register | name, email, password, monthlyBudget? | returns { user, token } |
| POST | /login | email, password | returns { user, token } |
| GET | /me | — | requires `Authorization: Bearer <token>` |

### Transactions (`/api/transactions`) — all require auth
| Method | Path | Notes |
|---|---|---|
| POST | / | create manual expense: amount, category, description?, date? |
| GET | /?month=YYYY-MM&category= | list, filterable |
| PUT | /:id | update |
| DELETE | /:id | delete |
| GET | /analytics?year=&month= | burn rate, category breakdown (pie), daily trend (line) |

### Subscriptions (`/api/subscriptions`) — all require auth
| Method | Path | Notes |
|---|---|---|
| POST | / | name, amount, billingCycle (weekly/monthly/quarterly/yearly), startDate? |
| GET | / | list |
| PUT | /:id | update |
| DELETE | /:id | soft-cancel (sets isActive: false, stops future billing) |

## Next steps
- React frontend (auth forms, expense form, pie/line charts via Recharts)
- Input validation library (e.g. Zod/Joi) on request bodies
- Rate limiting + helmet for production hardening
