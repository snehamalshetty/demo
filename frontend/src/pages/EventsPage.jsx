import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock3, MapPin, Plus, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState, ErrorState, formatDate, LoadingState, Modal, PageTitle, Pill } from "../components/UI.jsx";

const emptyForm = { title: "", description: "", category: "Campus", location: "", startsAt: "", endsAt: "", capacity: "" };
export default function EventsPage() {
  const { user } = useAuth();
  const canManage = ["admin", "faculty"].includes(user.role);
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  async function load() {
    try { setError(""); setLoading(true); const { data } = await api.get("/events", { params: { upcoming: filter === "all" ? undefined : filter === "upcoming" ? true : false, limit: 50 } }); setItems(data.data); }
    catch (e) { setError(e.response?.data?.message || "Unable to load campus events."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);
  async function register(item) {
    try {
      if (item.registered) await api.delete(`/events/${item._id}/register`);
      else await api.post(`/events/${item._id}/register`);
      toast.success(item.registered ? "Registration cancelled." : "You’re on the list!");
      await load();
    } catch (e) { toast.error(e.response?.data?.message || "Could not update event registration."); }
  }
  async function create(e) {
    e.preventDefault(); setSaving(true);
    try {
      await api.post("/events", { ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined, capacity: form.capacity ? Number(form.capacity) : undefined });
      toast.success("Campus event created."); setModal(false); setForm(emptyForm); await load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not create the event."); }
    finally { setSaving(false); }
  }
  return <div>
    <PageTitle eyebrow="MAKE ROOM FOR SOMETHING GOOD" title="Meet you out there." description="Discover the gatherings, workshops, and little moments happening around campus." action={canManage && <button className="button button-primary" onClick={() => setModal(true)}><Plus size={16} /> Add an event</button>} />
    <div className="event-toolbar"><div className="filter-tabs">{[["upcoming", "Upcoming"], ["past", "Past events"], ["all", "All events"]].map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="results-caption">{items.length} events</span></div>
    {error ? <ErrorState text={error} onRetry={load} /> : loading ? <LoadingState label="Finding campus events..." /> : items.length === 0 ? <EmptyState icon={CalendarDays} title="Nothing on the calendar" text="Check back soon — campus events will appear here." action={canManage && <button className="button button-outline" onClick={() => setModal(true)}><Plus size={15} /> Add an event</button>} /> :
      <div className="events-grid">{items.map((item) => <article className="event-card" key={item._id}><div className="event-banner"><div className="event-date-large"><span>{new Date(item.startsAt).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</span><strong>{new Date(item.startsAt).getDate()}</strong><small>{new Date(item.startsAt).toLocaleDateString(undefined, { weekday: "short" })}</small></div><div className="event-category-tag">{item.category}</div><div className="event-banner-art">✳</div></div><div className="event-info"><div className="event-time"><Clock3 size={14} /> {new Date(item.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}{item.endsAt ? ` — ${new Date(item.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}</div><h2>{item.title}</h2><p>{item.description}</p><div className="event-location"><MapPin size={14} /> {item.location}</div><div className="event-card-foot"><span><Users size={15} /> {item.registrationCount}{item.capacity ? ` / ${item.capacity}` : ""} attending</span>{item.startsAt > new Date().toISOString() && <button className={`button ${item.registered ? "button-outline" : "button-primary"} button-small`} onClick={() => register(item)}>{item.registered ? <><Check size={14} /> Registered</> : "Join event"}</button>}</div></div></article>)}</div>}
    {modal && <Modal title="Add a campus event" onClose={() => setModal(false)}><form className="modal-form" onSubmit={create}><label>Event name<input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><div className="form-two-col"><label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label><label>Location<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label></div><label>About this event<textarea required rows="4" maxLength={10000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><div className="form-two-col"><label>Starts<input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label><label>Ends <span className="optional">(optional)</span><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></label></div><label>Capacity <span className="optional">(leave blank for no limit)</span><input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></label><div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModal(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : <><Check size={15} /> Create event</>}</button></div></form></Modal>}
  </div>;
}
