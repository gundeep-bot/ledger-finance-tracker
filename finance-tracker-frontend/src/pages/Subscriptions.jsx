import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import SubscriptionPanel from '../components/SubscriptionPanel.jsx';

export default function Subscriptions() {
  const { token } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const s = await api.listSubscriptions(token);
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
    <div>
      <div className="page-header">
        <h1 className="page-title">Subscriptions</h1>
        <p className="page-subtitle">Recurring bills, billed automatically on schedule.</p>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="empty-note">Loading…</div>
      ) : (
        <SubscriptionPanel token={token} subscriptions={subscriptions} onChange={refresh} full />
      )}
    </div>
  );
}
