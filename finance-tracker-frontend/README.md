# Ledger — Frontend

## Setup
```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173. Requests to `/api/*` are proxied to your backend at
`http://localhost:5000` (configured in `vite.config.js`), so **make sure your backend
is running first** (see backend/README.md).

## What's here
- `src/pages/AuthPage.jsx` — sign in / create account
- `src/pages/Dashboard.jsx` — main screen: balance strip, charts, forms, ledger lists
- `src/components/BalanceStrip.jsx` — spent / budget / remaining, with progress bar
- `src/components/CategoryPie.jsx` — pie chart of spending by category (Recharts)
- `src/components/DailyTrend.jsx` — line chart of daily spending (Recharts)
- `src/components/TransactionPanel.jsx` — log an expense, see recent entries
- `src/components/SubscriptionPanel.jsx` — add a recurring bill, see next billing dates
- `src/context/AuthContext.jsx` — holds the JWT + user, persisted to localStorage
- `src/api/client.js` — thin fetch wrapper for the backend API

## Notes
- The session token is stored in `localStorage` under the key `ledger:session` so
  refreshing the page doesn't log you out. Signing out clears it.
- Subscription "delete" is actually a soft-cancel on the backend (sets `isActive: false`),
  so canceled subscriptions stop being billed but aren't destroyed.
