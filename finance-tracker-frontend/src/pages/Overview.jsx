import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import { symbolFor } from '../api/currencies.js';
import BalanceStrip from '../components/BalanceStrip.jsx';
import CategoryPie from '../components/CategoryPie.jsx';
import Card from '../components/Card.jsx';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export default function Overview() {
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const symbol = symbolFor(user?.currency);

  const refresh = useCallback(async () => {
    try {
      const [a, t, s] = await Promise.all([
        api.getAnalytics(token),
        api.listTransactions(token),
        api.listSubscriptions(token),
      ]);
      setAnalytics(a);
      setTransactions(t.transactions);
      setSubscriptions(s.subscriptions.filter((sub) => sub.isActive));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) return <div className="empty-note">Loading your ledger…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">Where things stand this month.</p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <BalanceStrip analytics={analytics} />
        </motion.div>

        <div className="grid-2">
          <motion.div variants={item}>
            <CategoryPie data={analytics?.categoryBreakdown || []} />
          </motion.div>

          <motion.div variants={item}>
            <Card>
              <h2>Upcoming bills</h2>
              {subscriptions.length === 0 ? (
                <p className="empty-note">No active subscriptions.</p>
              ) : (
                <div className="ledger-list">
                  {subscriptions.slice(0, 5).map((s) => (
                    <div className="ledger-row" key={s._id}>
                      <div className="ledger-row-main">
                        <span className="ledger-cat">{s.name}</span>
                        <span className="ledger-desc">
                          next {new Date(s.nextBillingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <span className="ledger-amount mono-num">{symbol}{Number(s.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <Link to="/subscriptions" className="page-subtitle" style={{ display: 'inline-block', marginTop: 12, fontSize: 12 }}>
                Manage subscriptions →
              </Link>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={item}>
          <Card>
            <h2>Recent activity</h2>
            {transactions.length === 0 ? (
              <p className="empty-note">Nothing logged yet.</p>
            ) : (
              <div className="ledger-list">
                {transactions.slice(0, 6).map((t) => (
                  <div className="ledger-row" key={t._id}>
                    <div className="ledger-row-main">
                      <span className="ledger-cat">{t.category}</span>
                      <span className="ledger-desc">{t.description || (t.source === 'subscription' ? 'Auto-billed' : '—')}</span>
                    </div>
                    <span className="ledger-amount mono-num">{symbol}{Number(t.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/transactions" className="page-subtitle" style={{ display: 'inline-block', marginTop: 12, fontSize: 12 }}>
              View all transactions →
            </Link>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
