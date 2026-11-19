import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity, Bell, BookOpen, CalendarDays, ChevronLeft, ChevronRight, CircleHelp,
  LayoutDashboard, LogOut, Menu, MessageCircle, Settings2, Shield, Sparkles, Ticket, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const mainLinks = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/app/knowledge", label: "Knowledge base", icon: BookOpen },
  { to: "/app/announcements", label: "Announcements", icon: Bell },
  { to: "/app/events", label: "Campus events", icon: CalendarDays },
  { to: "/app/tickets", label: "Support tickets", icon: Ticket }
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = [...mainLinks, ...(user.role === "admin" ? [{ to: "/app/admin", label: "Admin analytics", icon: Activity }] : [])];

  async function signOut() {
    await logout();
    navigate("/");
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><span>c</span><i /></div>
          {!collapsed && <div><strong>campus<span>connect</span></strong><small>STUDENT HUB</small></div>}
          <button className="sidebar-collapse" onClick={() => setCollapsed(!collapsed)} aria-label="Collapse sidebar">{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>
        {!collapsed && <div className="nav-caption">WORKSPACE</div>}
        <nav className="side-nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)}>
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {!collapsed && <div className="help-card"><div className="help-icon"><CircleHelp size={17} /></div><strong>Need a hand?</strong><p>Our campus team is here to help you.</p><NavLink to="/app/tickets">Get support <ChevronRight size={13} /></NavLink></div>}
          <NavLink className="profile-link" to="/app/profile"><div className="avatar">{user.name?.slice(0, 1).toUpperCase()}</div>{!collapsed && <><div className="profile-name"><strong>{user.name}</strong><small>{user.role}</small></div><Settings2 size={17} /></>}</NavLink>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="breadcrumb"><span>Campus Connect</span><span className="crumb-slash">/</span><strong>Student workspace</strong></div>
          <div className="topbar-actions"><div className="online-indicator"><i /> Campus services online</div><button className="icon-button" aria-label="Help"><CircleHelp size={19} /></button><button className="topbar-user" onClick={signOut} title="Sign out"><LogOut size={17} /></button></div>
        </header>
        <main className="page-content"><Outlet /></main>
        <footer className="app-footer">© 2026 Campus Connect <span>•</span> Your campus, one smart connection.</footer>
      </div>
    </div>
  );
}
