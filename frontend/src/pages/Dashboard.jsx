import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CalendarDays, ChevronRight, Clock3, MessageCircle, Sparkles, Ticket, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorState, formatDate, LoadingState, PageTitle, Pill } from "../components/UI.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try { setError(""); const response = await api.get("/dashboard/student"); setData(response.data); }
    catch (e) { setError(e.response?.data?.message || "Check that the API and MongoDB are running."); }
  }
  useEffect(() => { load(); }, []);

  if (error && !data) return <><PageTitle eyebrow="YOUR CAMPUS AT A GLANCE" title={`Good to see you, ${user.name.split(" ")[0]}.`} description="Here’s what’s happening around your campus." /><ErrorState text={error} onRetry={load} /></>;
  if (!data) return <LoadingState />;
  const stats = [
    { label: "Campus resources", value: data.stats.resources, note: "Published and verified", icon: BookOpen, tone: "stat-blue" },
    { label: "Upcoming events", value: data.stats.upcomingEvents, note: "Ready to explore", icon: CalendarDays, tone: "stat-cyan" },
    { label: "Active requests", value: data.stats.activeTickets, note: "We’re on it", icon: Ticket, tone: "stat-violet" }
  ];

  return <div className="dashboard-page">
    <PageTitle eyebrow={`${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase()} · YOUR CAMPUS AT A GLANCE`} title={`Good to see you, ${user.name.split(" ")[0]}.`} description="Here’s what’s happening around your campus." action={<Link className="button button-primary" to="/app/assistant"><Sparkles size={16} /> Ask your campus assistant</Link>} />
    <section className="welcome-strip"><div className="welcome-symbol"><Sparkles size={20} /></div><div><strong>Your campus, one smart connection.</strong><p>Find trusted answers, keep up with campus life, and get support when it matters.</p></div><Link to="/app/knowledge">Explore your campus <ArrowRight size={15} /></Link></section>
    <section className="stat-grid">{stats.map(({ label, value, note, icon: Icon, tone }) => <article className="stat-card" key={label}><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-caption">{label}</div><div className="stat-value">{value}</div><div className="stat-note"><span className="stat-positive"><TrendingUp size={13} /></span>{note}</div><div className="stat-decoration" /></article>)}</section>
    <div className="dashboard-grid">
      <section className="surface-card dashboard-card"><div className="card-heading"><div><span className="page-eyebrow">STAY IN THE LOOP</span><h2>Campus updates</h2></div><Link to="/app/announcements" className="card-link">All updates <ChevronRight size={15} /></Link></div>
        {data.announcements.length ? <div className="update-list">{data.announcements.map((item) => <article className="update-item" key={item._id}><div className={`update-dot priority-${item.priority}`} /><div className="update-main"><div className="update-meta"><span>{item.category}</span><i>·</i>{formatDate(item.publishedAt || item.createdAt)}</div><h3>{item.title}</h3><p>{item.content}</p></div><Pill tone={item.priority === "urgent" ? "rose" : item.priority === "important" ? "amber" : "neutral"}>{item.priority}</Pill></article>)}</div> : <div className="inline-empty"><p>No announcements just yet.</p></div>}
      </section>
      <section className="surface-card dashboard-card"><div className="card-heading"><div><span className="page-eyebrow">SAVE THE DATE</span><h2>Coming up</h2></div><Link to="/app/events" className="card-link">All events <ChevronRight size={15} /></Link></div>
        {data.events.length ? <div className="event-mini-list">{data.events.map((event) => <article key={event._id} className="event-mini"><div className="event-date"><span>{new Date(event.startsAt).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</span><strong>{new Date(event.startsAt).getDate()}</strong></div><div><h3>{event.title}</h3><p><Clock3 size={13} /> {new Date(event.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} <i>·</i> {event.location}</p></div><ChevronRight size={16} /></article>)}</div> : <div className="inline-empty"><p>No upcoming events yet.</p></div>}
      </section>
      <section className="surface-card dashboard-card tickets-card"><div className="card-heading"><div><span className="page-eyebrow">WE’RE HERE TO HELP</span><h2>Your support requests</h2></div><Link to="/app/tickets" className="card-link">View tickets <ChevronRight size={15} /></Link></div>
        {data.tickets.length ? <div className="ticket-mini-list">{data.tickets.map((ticket) => <Link to="/app/tickets" className="ticket-mini" key={ticket._id}><span className="ticket-icon"><Ticket size={16} /></span><div><h3>{ticket.title}</h3><p>Updated {formatDate(ticket.updatedAt)}</p></div><Pill tone={ticket.status === "resolved" ? "green" : ticket.status === "in-progress" ? "blue" : "amber"}>{ticket.status.replace("-", " ")}</Pill></Link>)}</div> : <div className="inline-empty"><p>No support requests yet.</p><Link to="/app/tickets">Tell us how we can help <ArrowRight size={14} /></Link></div>}
      </section>
      <section className="assistant-promo"><div className="promo-orb"><Sparkles size={22} /></div><div className="promo-eyebrow">A LITTLE CAMPUS CLARITY</div><h2>Have a question?<br />Start right here.</h2><p>Ask about campus services, resources, or where to go next.</p><Link to="/app/assistant" className="button button-white">Chat with the assistant <ArrowRight size={15} /></Link><div className="promo-art">✳</div></section>
    </div>
    <div className="dashboard-bottom-note"><MessageCircle size={15} /> Need a person? <Link to="/app/tickets">Our support team is one message away.</Link></div>
  </div>;
}
