import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { symbolFor } from '../api/currencies.js';
import Card from './Card.jsx';

const CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly'];

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SubscriptionPanel({ token, subscriptions, onChange }) {
  const { user } = useAuth();
  const symbol = symbolFor(user?.currency);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name || !amount || Number(amount) <= 0) {
      setError('Enter a name and an amount greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createSubscription(token, {
        name,
        amount: Number(amount),
        billingCycle,
        startDate: startDate || undefined,
      });
      setName('');
      setAmount('');
      setStartDate('');
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id) {
    try {
      await api.cancelSubscription(token, id);
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  const active = subscriptions.filter((s) => s.isActive);

  return (
    <Card>
      <h2>Recurring bills</h2>

      <form className="quick-form" onSubmit={handleSubmit}>
        <div className="quick-form-row">
          <input
            type="text"
            placeholder="Name (e.g. Netflix)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="quick-form-row">
          <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)}>
            {CYCLES.map((c) => (
              <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="First billing date (defaults to today)"
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add subscription'}
        </button>
      </form>

      <div className="ledger-list">
        {active.length === 0 && <p className="empty-note">No active subscriptions.</p>}
        {active.map((s) => (
          <div className="ledger-row" key={s._id}>
            <div className="ledger-row-main">
              <span className="ledger-cat">{s.name}</span>
              <span className="ledger-desc">
                {s.billingCycle} · next {formatDate(s.nextBillingDate)}
              </span>
            </div>
            <span className="ledger-amount mono-num">{symbol}{Number(s.amount).toFixed(2)}</span>
            <button className="ledger-delete" onClick={() => handleCancel(s._id)} aria-label="Cancel">
              ×
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
