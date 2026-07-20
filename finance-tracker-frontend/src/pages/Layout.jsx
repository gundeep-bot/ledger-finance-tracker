import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ChatWidget from '../components/ChatWidget.jsx';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
      <ChatWidget />
    </div>
  );
}
