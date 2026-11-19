import { useEffect, useState } from "react";
import { Bell, Check, Plus, Search, Trash2, Pencil, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState, ErrorState, formatDate, LoadingState, Modal, PageTitle, Pill } from "../components/UI.jsx";

const blank = { title: "", content: "", category: "General", priority: "normal", audience: [], published: false };

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const canManage = ["admin", "faculty"].includes(user.role);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  async function load() {
    try { setError(""); setLoading(true); const { data } = await api.get("/announcements", { params: { search: query || undefined, limit: 50 } }); setItems(data.data); }
    catch (e) { setError(e.response?.data?.message || "Unable to load announcements."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [query]);
  function open(item) {
    setEditing(item || null);
    setForm(item ? { ...item, audience: item.audience || [] } : blank);
    setModal(true);
  }
  async function save(e) {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await api.put(`/announcements/${editing._id}`, form);
      else await api.post("/announcements", form);
      toast.success(editing ? "Announcement updated." : "Announcement created.");
      setModal(false); await load();
    } catch (error) { toast.error(error.response?.data?.message || "Could not save the announcement."); }
    finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try { await api.delete(`/announcements/${item._id}`); toast.success("Announcement deleted."); await load(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not delete the announcement."); }
  }
  const toggleAudience = (role) => setForm({ ...form, audience: form.audience.includes(role) ? form.audience.filter((item) => item !== role) : [...form.audience, role] });

  return <div>
    <PageTitle eyebrow="WHAT’S HAPPENING ON CAMPUS" title="A little in the loop." description="The latest updates and notices, gathered in one place." action={canManage && <button className="button button-primary" onClick={() => open()}><Plus size={16} /> New announcement</button>} />
    <div className="catalog-toolbar"><label className="search-box"><Search size={17} /><input placeholder="Search announcements..." value={query} onChange={(e) => setQuery(e.target.value)} /><span>⌘ K</span></label><span className="results-caption">{items.length} updates</span></div>
    {error ? <ErrorState text={error} onRetry={load} /> : loading ? <LoadingState label="Gathering campus updates..." /> : items.length === 0 ? <EmptyState icon={Bell} title="A quiet moment on campus" text="There are no announcements to show right now." action={canManage && <button className="button button-outline" onClick={() => open()}><Plus size={15} /> Create an announcement</button>} /> :
      <div className="announcement-list">{items.map((item) => <article className={`announcement-card announcement-${item.priority}`} key={item._id}><div className="announcement-mark"><Megaphone size={18} /></div><div className="announcement-content"><div className="announcement-meta"><span>{item.category}</span><i>·</i><span>{formatDate(item.publishedAt || item.createdAt)}</span><Pill tone={item.priority === "urgent" ? "rose" : item.priority === "important" ? "amber" : "neutral"}>{item.priority}</Pill>{!item.published && <Pill tone="amber">Draft</Pill>}</div><h2>{item.title}</h2><p>{item.content}</p><div className="announcement-audience">{item.audience?.length ? `For ${item.audience.join(", ")}` : "For the whole campus"}</div></div>{canManage && <div className="row-actions"><button title="Edit announcement" onClick={() => open(item)}><Pencil size={15} /></button><button title="Delete announcement" onClick={() => remove(item)}><Trash2 size={15} /></button></div>}</article>)}</div>}
    {modal && <Modal title={editing ? "Edit announcement" : "Create announcement"} onClose={() => setModal(false)}><form className="modal-form" onSubmit={save}><label>Headline<input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><div className="form-two-col"><label>Category<input value={form.category} maxLength={100} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label><label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></label></div><label>Details<textarea required rows="5" maxLength={10000} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label><fieldset className="audience-field"><legend>Audience <span className="optional">(no selection means everyone)</span></legend><div>{["student", "faculty", "admin"].map((role) => <label key={role}><input type="checkbox" checked={form.audience.includes(role)} onChange={() => toggleAudience(role)} /> {role}</label>)}</div></fieldset><label className="checkbox-field"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publish announcement</label><div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModal(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : <><Check size={15} /> Save announcement</>}</button></div></form></Modal>}
  </div>;
}
