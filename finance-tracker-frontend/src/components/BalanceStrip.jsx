import { motion } from 'framer-motion';
import CountUp from './CountUp.jsx';
import Card from './Card.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { symbolFor } from '../api/currencies.js';

export default function BalanceStrip({ analytics }) {
  const { user } = useAuth();
  const symbol = symbolFor(user?.currency);

  if (!analytics) return null;

  const { totalSpent, monthlyBudget, remaining, percentUsed } = analytics;
  const overBudget = remaining < 0;
  const pct = percentUsed == null ? null : Math.min(percentUsed, 100);

  return (
    <Card className="balance-strip" hover={false}>
      <div className="balance-row">
        <div className="balance-cell">
          <span className="balance-label">Spent this month</span>
          <span className="balance-value">
            {symbol}<CountUp value={totalSpent ?? 0} decimals={2} />
          </span>
        </div>
        <div className="balance-cell">
          <span className="balance-label">Monthly budget</span>
          <span className="balance-value">
            {symbol}<CountUp value={monthlyBudget ?? 0} decimals={2} />
          </span>
        </div>
        <div className="balance-cell">
          <span className="balance-label">{overBudget ? 'Over by' : 'Remaining'}</span>
          <span className="balance-value" style={{ color: overBudget ? 'var(--red)' : 'var(--accent)' }}>
            {symbol}<CountUp value={Math.abs(remaining ?? 0)} decimals={2} />
          </span>
        </div>
      </div>
      {pct != null && (
        <div className="balance-track">
          <motion.div
            className="balance-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ background: overBudget ? 'var(--red)' : 'var(--accent)' }}
          />
        </div>
      )}
    </Card>
  );
}
