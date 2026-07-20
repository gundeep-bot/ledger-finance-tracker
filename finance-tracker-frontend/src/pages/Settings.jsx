import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import CurrencySelect from '../components/CurrencySelect.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import Card from '../components/Card.jsx';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const [budget, setBudget] = useState(user?.monthlyBudget ?? 0);
  const [currency, setCurrency] = useState(user?.currency ?? 'USD');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateUser({ monthlyBudget: Number(budget) || 0, currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Your account, budget, and preferences.</p>
      </div>

      <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card hover={false}>
          <h2>Account</h2>
          <div className="settings-row">
            <div className="settings-row-label">
              <strong>Name</strong>
              <span>{user?.name}</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">
              <strong>Email</strong>
              <span>{user?.email}</span>
            </div>
          </div>
        </Card>

        <Card hover={false}>
          <h2>Budget & currency</h2>
          <div className="settings-row">
            <div className="settings-row-label">
              <strong>Monthly budget</strong>
              <span>Used to calculate remaining balance and burn rate</span>
            </div>
            <input
              type="number"
              min="0"
              className="settings-input"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <div className="settings-row">
            <div className="settings-row-label">
              <strong>Currency</strong>
              <span>Shown across the whole app</span>
            </div>
            <div style={{ width: 160 }}>
              <CurrencySelect value={currency} onChange={setCurrency} />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-label">
              <strong>Save changes</strong>
              {error && <span style={{ color: 'var(--red)' }}>{error}</span>}
              {saved && <span className="settings-success">Saved.</span>}
            </div>
            <button className="settings-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </Card>

        <Card hover={false}>
          <h2>Appearance</h2>
          <div className="settings-row">
            <div className="settings-row-label">
              <strong>Theme</strong>
              <span>Currently {theme === 'dark' ? 'dark' : 'light'} mode</span>
            </div>
            <ThemeToggle />
          </div>
        </Card>
      </div>
    </div>
  );
}
