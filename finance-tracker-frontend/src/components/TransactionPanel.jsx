import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { symbolFor } from '../api/currencies.js';
import Card from './Card.jsx';

const CATEGORIES = [
  'Groceries', 'Transport', 'Entertainment', 'Rent', 'Utilities',
  'Subscriptions', 'Health', 'Dining', 'Other',
];

export default function TransactionPanel({ token, transactions, onChange, full = false }) {
  const { user } = useAuth();
  const symbol = symbolFor(user?.currency);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createTransaction(token, {
        amount: Number(amount),
        category,
        description,
      });
      setAmount('');
      setDescription('');
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTransaction(token, id);
      onChange();
    } catch (err) {
      setError(err.message);
    }
  }

  const visible = full ? transactions : transactions.slice(0, 8);

  return (
    <Card>
      <h2>Log an expense</h2>

      <form className="quick-form" onSubmit={handleSubmit}>
        <div className="quick-form-row">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {error && <div className="form-error">{error}</div>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add expense'}
        </button>
      </form>

      <div className="ledger-list">
        {transactions.length === 0 && <p className="empty-note">No expenses logged yet.</p>}
        {visible.map((t) => (
          <div className="ledger-row" key={t._id}>
            <div className="ledger-row-main">
              <span className="ledger-cat">{t.category}</span>
              <span className="ledger-desc">{t.description || (t.source === 'subscription' ? 'Auto-billed' : '—')}</span>
            </div>
            <span className="ledger-amount mono-num">{symbol}{Number(t.amount).toFixed(2)}</span>
            <button className="ledger-delete" onClick={() => handleDelete(t._id)} aria-label="Delete">
              ×
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
