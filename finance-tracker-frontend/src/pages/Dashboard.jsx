import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import AmbientBackground from '../components/AmbientBackground.jsx';
import BalanceStrip from '../components/BalanceStrip.jsx';
import CategoryPie from '../components/CategoryPie.jsx';
import DailyTrend from '../components/DailyTrend.jsx';
import TransactionPanel from '../components/TransactionPanel.jsx';
import SubscriptionPanel from '../components/SubscriptionPanel.jsx';
import './Dashboard.css';
import './BalanceStrip.css';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24, rotateX: -6 },
  show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [a, t, s] = await Promise.all([
        api.getAnalytics(token),
        api.listTransactions(token),
        api.listSubscriptions(token),
      ]);
      setAnalytics(a);
      setTransactions(t.transactions);
      setSubscriptions(s.subscriptions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <>
      <AmbientBackground />
      <div className="dash-shell">
        <motion.header
          className="dash-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dash-brand">Ledger</div>
          <div className="dash-user">
            <span>{user?.name}</span>
            <button className="link-btn" onClick={logout}>
              Sign out
            </button>
          </div>
        </motion.header>

        {error && <div className="dash-error">{error}</div>}

        {loading ? (
          <div className="dash-loading">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              Loading your ledger…
            </motion.span>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item}>
              <BalanceStrip analytics={analytics} />
            </motion.div>

            <div className="dash-grid">
              <motion.div variants={item}>
                <CategoryPie data={analytics?.categoryBreakdown || []} />
              </motion.div>
              <motion.div variants={item}>
                <DailyTrend data={analytics?.dailyTrend || []} />
              </motion.div>
            </div>

            <div className="dash-grid">
              <motion.div variants={item}>
                <TransactionPanel token={token} transactions={transactions} onChange={refresh} />
              </motion.div>
              <motion.div variants={item}>
                <SubscriptionPanel token={token} subscriptions={subscriptions} onChange={refresh} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
