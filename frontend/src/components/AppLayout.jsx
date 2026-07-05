import Sidebar from './Sidebar.jsx';

export default function AppLayout({ children, admin = false }) {
  return (
    <div className="app-shell">
      <Sidebar admin={admin} />
      <main className="app-main">{children}</main>
    </div>
  );
}
