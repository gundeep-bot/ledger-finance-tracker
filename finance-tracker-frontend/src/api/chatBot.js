const FAQ = [
  {
    keywords: ['expense', 'log', 'spend', 'add expense', 'groceries', 'purchase'],
    answer:
      "Head to the Transactions page and use the form at the top — enter an amount, pick a category, and optionally a note. It's saved instantly and shows up in your charts on Analytics.",
  },
  {
    keywords: ['subscription', 'recurring', 'netflix', 'bill', 'gym', 'rent'],
    answer:
      'On the Subscriptions page, add a name, amount, and billing cycle (weekly, monthly, quarterly, yearly). The system automatically logs an expense for it on each billing date — you don\u2019t need to re-enter it.',
  },
  {
    keywords: ['cancel', 'delete', 'remove', 'stop'],
    answer:
      'To cancel a subscription, click the × next to it on the Subscriptions page — it stops future billing but keeps your history. To delete a single expense, click the × next to it on Transactions.',
  },
  {
    keywords: ['budget', 'limit', 'over budget', 'remaining'],
    answer:
      'Your monthly budget is set on the Settings page. The Overview page shows how much you\u2019ve spent, what\u2019s left, and turns red if you go over.',
  },
  {
    keywords: ['currency', 'usd', 'eur', 'inr', 'crypto', 'bitcoin'],
    answer:
      'You can change your currency any time on Settings — it updates the symbol shown across the whole app immediately.',
  },
  {
    keywords: ['theme', 'dark', 'light', 'mode'],
    answer:
      'There\u2019s a toggle at the bottom of the sidebar (and top of Settings) to switch between light and dark mode. Your choice is remembered.',
  },
  {
    keywords: ['chart', 'analytics', 'graph', 'trend', 'category', 'pie', 'line'],
    answer:
      'The Analytics page has a category breakdown (pie chart) and a daily spending trend (line chart) for whichever month you select.',
  },
  {
    keywords: ['burn rate', 'burn'],
    answer:
      'Burn rate is just how fast you\u2019re spending this month — shown as "Spent this month" on Overview, compared against your budget.',
  },
  {
    keywords: ['export', 'download', 'csv'],
    answer:
      "There's no export feature built in yet — right now the app is for tracking and viewing your spending inside the dashboard.",
  },
];

const GREETING =
  "Hi! I can help you find your way around — ask me about logging expenses, subscriptions, budgets, currencies, or charts.";

const FALLBACK =
  "I'm not sure about that one. Try asking about expenses, subscriptions, budgets, currency, themes, or analytics — or just click around the sidebar, everything's one page away.";

export function getGreeting() {
  return GREETING;
}

export function answerQuery(query) {
  const q = query.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const entry of FAQ) {
    const score = entry.keywords.reduce((acc, kw) => (q.includes(kw) ? acc + kw.length : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best ? best.answer : FALLBACK;
}
