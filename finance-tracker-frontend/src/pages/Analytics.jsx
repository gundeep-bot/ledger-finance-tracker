import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import CategoryPie from '../components/CategoryPie.jsx';
import DailyTrend from '../components/DailyTrend.jsx';

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export default function Analytics() {
  const { token } = useAuth();
  const [period, setPeriod] = useState(currentYearMonth());
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const a = await api.getAnalytics(token, `?year=${period.year}&month=${period.month}`);
      setAnalytics(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function shiftMonth(delta) {
    setPeriod((p) => {
      let month = p.month + delta;
      let year = p.year;
      if (month > 12) { month = 1; year += 1; }
      if (month < 1) { month = 12; year -= 1; }
      return { year, month };
    });
  }

  const monthLabel = new Date(period.year, period.month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Category breakdown and daily spending trend.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="month-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
          <span className="month-label mono-num">{monthLabel}</span>
          <button className="month-nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
        </div>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="empty-note">Loading…</div>
      ) : (
        <div className="grid-2">
          <CategoryPie data={analytics?.categoryBreakdown || []} />
          <DailyTrend data={analytics?.dailyTrend || []} />
        </div>
      )}
    </div>
  );
}
