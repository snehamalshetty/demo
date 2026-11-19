import { useEffect, useState } from "react";
import { BookOpen, Check, ChevronRight, FilePlus2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState, ErrorState, formatDate, LoadingState, Modal, PageTitle, Pill } from "../components/UI.jsx";

const categories = ["Admissions", "Academics", "Examinations", "Attendance", "Fees and Scholarships", "Library", "Hostel", "Transportation", "Placements", "Student Services", "Departments", "General Campus Information"];
const initialForm = { title: "", category: "Academics", summary: "", content: "", tags: "", published: false };

export default function KnowledgePage() {
  const { user } = useAuth();
  const canManage = ["admin", "faculty"].includes(user.role);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setLoading(true); setError("");
      const { data } = await api.get("/knowledge", { params: { search: search || undefined, category: category || undefined, limit: 50 } });
      setArticles(data.data);
    } catch (e) { setError(e.response?.data?.message || "Unable to load knowledge articles."); }
    finally { setLoading(false); }
  }
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [search, category]);

  function openForm(article) {
    setEditing(article || null);
    setForm(article ? { ...article, tags: article.tags?.join(", ") || "" } : initialForm);
    setModal(true);
  }
  async function save(event) {
    event.preventDefault(); setSaving(true);
    const body = { ...form, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) };
    try {
      if (editing) await api.put(`/knowledge/${editing._id}`, body);
      else await api.post("/knowledge", body);
      toast.success(editing ? "Article updated." : "Article added to the knowledge base.");
      setModal(false); await load();
    } catch (e) { toast.error(e.response?.data?.message || "Could not save this article."); }
    finally { setSaving(false); }
  }
  async function remove(article) {
    if (!window.confirm(`Delete “${article.title}”?`)) return;
    try { await api.delete(`/knowledge/${article._id}`); toast.success("Article deleted."); await load(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not delete the article."); }
  }

  return <div>
    <PageTitle eyebrow="THE CAMPUS KNOWLEDGE LIBRARY" title="Find your way around." description="A trusted home for the answers, resources, and services that make campus feel easier." action={canManage && <button className="button button-primary" onClick={() => openForm()}><Plus size={16} /> Add an article</button>} />
    <div className="catalog-toolbar"><label className="search-box"><Search size={17} /><input placeholder="Search resources, topics, or keywords..." value={search} onChange={(e) => setSearch(e.target.value)} /><span>⌘ K</span></label><select className="select-control" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><span className="results-caption">{articles.length} resources</span></div>
    {error ? <ErrorState text={error} onRetry={load} /> : loading ? <LoadingState label="Finding campus resources..." /> : articles.length === 0 ? <EmptyState icon={BookOpen} title="Nothing to show just yet" text={search ? "Try another search or category." : "Campus resources will show up here once they’re published."} action={canManage && <button className="button button-outline" onClick={() => openForm()}><FilePlus2 size={15} /> Add the first article</button>} /> :
      <div className="resource-grid">{articles.map((article) => <article className="resource-card" key={article._id}><div className="resource-card-top"><span className="resource-icon"><BookOpen size={18} /></span><Pill tone={article.published ? "green" : "amber"}>{article.published ? "Published" : "Draft"}</Pill></div><div className="resource-category">{article.category}</div><h2>{article.title}</h2><p>{article.summary || article.content.slice(0, 150)}{article.content.length > 150 && !article.summary ? "…" : ""}</p><div className="resource-tags">{(article.tags || []).slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="resource-card-foot"><span>Updated {formatDate(article.updatedAt, { month: "short", day: "numeric" })}</span>{canManage ? <div className="row-actions"><button title="Edit article" onClick={() => openForm(article)}><Pencil size={15} /></button><button title="Delete article" onClick={() => remove(article)}><Trash2 size={15} /></button></div> : <ChevronRight size={16} />}</div></article>)}</div>}
    {modal && <Modal title={editing ? "Edit campus resource" : "Add a campus resource"} onClose={() => setModal(false)}><form className="modal-form" onSubmit={save}><label>Article title<input required maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><div className="form-two-col"><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Tags <span className="optional">comma separated</span><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="library, hours, services" /></label></div><label>Short summary<textarea rows="2" maxLength={500} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></label><label>Verified information<textarea required rows="6" maxLength={20000} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></label><label className="checkbox-field"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Publish this article for campus members</label><div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModal(false)}>Cancel</button><button className="button button-primary" disabled={saving}>{saving ? "Saving..." : <><Check size={15} /> Save article</>}</button></div></form></Modal>}
  </div>;
}
