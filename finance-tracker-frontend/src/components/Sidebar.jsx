import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const ICONS = {
  overview: (
    <svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="11.5" y="2.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="2.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="11.5" y="11.5" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
  ),
  transactions: (
    <svg viewBox="0 0 20 20" fill="none"><path d="M3 6h14M3 10h14M3 14h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
  ),
  subscriptions: (
    <svg viewBox="0 0 20 20" fill="none"><path d="M10 3a7 7 0 1 0 6.6 9.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M17 3v4h-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  analytics: (
    <svg viewBox="0 0 20 20" fill="none"><path d="M3 17V9M9 17V3M15 17v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
  ),
  settings: (
    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4"/><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
  ),
};

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: 'overview', end: true },
  { to: '/transactions', label: 'Transactions', icon: 'transactions' },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">Ledger</div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{ICONS[item.icon]}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <ThemeToggle />
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <button className="sidebar-signout" onClick={logout}>Sign out</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
