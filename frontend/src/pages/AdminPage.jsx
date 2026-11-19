import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, CalendarDays, GraduationCap, Search, ShieldCheck, Ticket, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { ErrorState, LoadingState, PageTitle, Pill } from "../components/UI.jsx";

const colors = ["#3478F6", "#20C4D8", "#8B78F6", "#F2A65A", "#53B889", "#EC718B"];
const roleTone = (role) => role === "admin" ? "violet" : role === "faculty" ? "blue" : "neutral";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true); setError("");
      const { data: stats } = await api.get("/dashboard/admin");
      setData(stats);
    } catch (e) { setError(e.response?.data?.message || "Could not load analytics."); }
    finally { setLoading(false); }
  }
  async function loadUsers() {
    try { const { data: result } = await api.get("/users", { params: { search: search || undefined, role: role || undefined, limit: 30 } }); setUsers(result.data); }
    catch (e) { toast.error(e.response?.data?.message || "Could not load users."); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { const timer = setTimeout(loadUsers, 250); return () => clearTimeout(timer); }, [search, role]);
  async function updateUser(id, changes) {
    try { await api.put(`/users/${id}`, changes); toast.success("User updated."); await loadUsers(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not update this user."); }
  }
  async function deactivate(user) {
    if (!window.confirm(`Deactivate ${user.name}’s account?`)) return;
    try { await api.delete(`/users/${user._id}`); toast.success("Account deactivated."); await loadUsers(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not deactivate this user."); }
  }

  if (loading && !data) return <LoadingState label="Gathering campus analytics..." />;
  if (error && !data) return <><PageTitle eyebrow="CAMPUS OPERATIONS" title="The admin view." description="A clear picture of what’s happening across your campus workspace." /><ErrorState text={error} onRetry={load} /></>;

  const statCards = [
    { label: "Registered students", value: data.stats.students, icon: GraduationCap, tone: "stat-blue" },
    { label: "Faculty members", value: data.stats.faculty, icon: Users, tone: "stat-cyan" },
    { label: "Knowledge articles", value: data.stats.articles, icon: BookOpen, tone: "stat-violet" },
    { label: "Campus announcements", value: data.stats.announcements, icon: Bell, tone: "stat-peach" },
    { label: "Campus events", value: data.stats.events, icon: CalendarDays, tone: "stat-green" },
    { label: "Support tickets", value: data.stats.tickets, icon: Ticket, tone: "stat-rose" }
  ];

  return <div className="admin-page"><PageTitle eyebrow="CAMPUS OPERATIONS" title="The admin view." description="A clear picture of what’s happening across your campus workspace." action={<button className="button button-outline" onClick={load}><Activity size={16} /> Refresh analytics</button>} />
    <div className="admin-stat-grid">{statCards.map(({ label, value, icon: Icon, tone }) => <article className="admin-stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={17} /></div><span>{label}</span><strong>{value}</strong></article>)}</div>
    <div className="admin-ticket-strip"><div className="admin-ticket-copy"><span className="page-eyebrow">SUPPORT OVERVIEW</span><strong>Keep campus moving.</strong><p>Track requests and follow up on what needs attention.</p></div><div><span>Open / in progress</span><strong>{data.stats.openTickets}</strong></div><div><span>Resolved</span><strong>{data.stats.resolvedTickets}</strong></div><div className="admin-strip-icon"><Ticket size={21} /></div></div>
    <div className="analytics-grid"><section className="surface-card analytics-card"><div className="card-heading"><div><span className="page-eyebrow">LAST SIX MONTHS</span><h2>New campus members</h2></div><Pill tone="blue">Registration trend</Pill></div><div className="chart-area"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.charts.registrations}><CartesianGrid stroke="#edf0f5" vertical={false} /><XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: "#8290a5", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#8290a5", fontSize: 11 }} allowDecimals={false} /><Tooltip cursor={{ fill: "#f5f8ff" }} /><Bar dataKey="count" fill="#3478F6" radius={[5, 5, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></div></section>
      <section className="surface-card analytics-card"><div className="card-heading"><div><span className="page-eyebrow">TICKETS</span><h2>Support status</h2></div><Pill tone="amber">{data.stats.openTickets} need attention</Pill></div><div className="chart-area pie-area"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.charts.ticketsByStatus} dataKey="count" nameKey="_id" innerRadius={56} outerRadius={86} paddingAngle={4}>{data.charts.ticketsByStatus.map((entry, index) => <Cell key={entry._id} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-legend">{data.charts.ticketsByStatus.map((entry, index) => <span key={entry._id}><i style={{ backgroundColor: colors[index % colors.length] }} />{entry._id.replace("-", " ")} <b>{entry.count}</b></span>)}</div></div></section>
      <section className="surface-card analytics-card"><div className="card-heading"><div><span className="page-eyebrow">CAMPUS LIBRARY</span><h2>Articles by category</h2></div><BookOpen size={18} className="subtle-icon" /></div><div className="category-chart">{data.charts.knowledgeByCategory.map((entry, index) => <div key={entry._id} className="category-bar"><div><span>{entry._id}</span><strong>{entry.count}</strong></div><i><b style={{ width: `${Math.max(4, entry.count / Math.max(...data.charts.knowledgeByCategory.map((item) => item.count)) * 100)}%`, background: colors[index % colors.length] }} /></i></div>)}</div></section>
      <section className="surface-card analytics-card admin-shortcuts"><span className="page-eyebrow">QUICK MANAGEMENT</span><h2>Keep your campus current.</h2><p>Publish relevant updates and maintain the information students rely on.</p><a href="/app/knowledge"><BookOpen size={17} /> Manage knowledge <ArrowUpRight size={14} /></a><a href="/app/announcements"><Bell size={17} /> Manage announcements <ArrowUpRight size={14} /></a><a href="/app/events"><CalendarDays size={17} /> Manage campus events <ArrowUpRight size={14} /></a><div className="shortcuts-shield"><ShieldCheck size={24} /></div></section>
    </div>
    <section className="surface-card user-management"><div className="card-heading"><div><span className="page-eyebrow">ACCESS & PERMISSIONS</span><h2>Campus members</h2><p>Manage account status and workspace roles.</p></div><Pill tone="green"><Users size={13} /> {users.length} members</Pill></div><div className="user-toolbar"><label className="search-box"><Search size={16} /><input placeholder="Find a member by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} /></label><select className="select-control" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="student">Student</option><option value="faculty">Faculty</option><option value="admin">Admin</option></select></div><div className="table-scroll"><table className="member-table"><thead><tr><th>MEMBER</th><th>ROLE</th><th>DEPARTMENT</th><th>JOINED</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{users.map((member) => <tr key={member._id}><td><div className="member-identity"><span className="member-avatar">{member.name.slice(0, 1).toUpperCase()}</span><div><strong>{member.name}</strong><small>{member.email}</small></div></div></td><td><select className="role-select" value={member.role} onChange={(e) => updateUser(member._id, { role: e.target.value })}><option value="student">Student</option><option value="faculty">Faculty</option><option value="admin">Admin</option></select></td><td>{member.department || "—"}</td><td>{new Date(member.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td><td><Pill tone={member.active ? "green" : "rose"}>{member.active ? "Active" : "Inactive"}</Pill></td><td><button className="table-action" disabled={!member.active} onClick={() => deactivate(member)}>{member.active ? "Deactivate" : "Inactive"}</button></td></tr>)}</tbody></table>{users.length === 0 && <div className="table-empty">No members match these filters.</div>}</div><div className="management-note"><ShieldCheck size={15} /> New registrations are always assigned the student role. Only admins can change roles.</div></section>
  </div>;
}
