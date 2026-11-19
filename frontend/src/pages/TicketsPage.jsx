import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronRight, Clock3, MessageSquare, Paperclip, Plus, Send, Ticket as TicketIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState, ErrorState, formatDate, LoadingState, Modal, PageTitle, Pill } from "../components/UI.jsx";

const categories = ["Academic", "Technical", "Fees", "Hostel", "Examination", "Library", "Administration", "Other"];
const blank = { title: "", description: "", category: "Other", priority: "normal" };
const toneForStatus = (status) => status === "resolved" ? "green" : status === "in-progress" ? "blue" : status === "closed" ? "neutral" : "amber";

export default function TicketsPage() {
  const { user } = useAuth();
  const canManage = ["admin", "faculty"].includes(user.role);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [replies, setReplies] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState([]);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setError(""); setLoading(true); const { data } = await api.get("/tickets", { params: { status: filter || undefined, limit: 50 } }); setTickets(data.data); }
    catch (e) { setError(e.response?.data?.message || "Unable to load support tickets."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [filter]);
  async function select(ticket) {
    try { const { data } = await api.get(`/tickets/${ticket._id}`); setSelected(data.ticket); setReplies(data.replies); }
    catch (e) { toast.error(e.response?.data?.message || "Could not open this ticket."); }
  }
  async function create(event) {
    event.preventDefault(); setBusy(true);
    try {
      let attachments = [];
      if (files.length) {
        const formData = new FormData();
        files.forEach((file) => formData.append("attachments", file));
        const uploaded = await api.post("/tickets/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        attachments = uploaded.data.files;
      }
      await api.post("/tickets", { ...form, attachments });
      toast.success("Your support request has been submitted."); setModal(false); setForm(blank); setFiles([]); await load();
    } catch (e) { toast.error(e.response?.data?.message || "Could not submit your request."); }
    finally { setBusy(false); }
  }
  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim()) return;
    try {
      await api.post(`/tickets/${selected._id}/replies`, { content: reply, internal });
      setReply(""); setInternal(false); await select(selected); await load();
    } catch (e) { toast.error(e.response?.data?.message || "Could not add your reply."); }
  }
  async function changeStatus(status) {
    try { await api.put(`/tickets/${selected._id}`, { status }); await select(selected); await load(); toast.success("Ticket status updated."); }
    catch (e) { toast.error(e.response?.data?.message || "Could not update ticket status."); }
  }

  return <div>
    <PageTitle eyebrow="CAMPUS SUPPORT, WITH YOU" title={canManage ? "Support desk." : "We’re here for you."} description={canManage ? "Review campus requests and help move each one forward." : "Tell us what’s going on. You can follow updates and replies right here."} action={!canManage && <button className="button button-primary" onClick={() => setModal(true)}><Plus size={16} /> New support request</button>} />
    {canManage && <div className="manager-note"><TicketIcon size={16} /> Staff view · Student details and responses are private to authorized support staff.</div>}
    <div className="ticket-toolbar"><div className="filter-tabs">{[["", "All tickets"], ["open", "Open"], ["in-progress", "In progress"], ["resolved", "Resolved"], ["closed", "Closed"]].map(([value, label]) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="results-caption">{tickets.length} tickets</span></div>
    {error ? <ErrorState text={error} onRetry={load} /> : loading ? <LoadingState label="Checking your support requests..." /> : tickets.length === 0 ? <EmptyState icon={TicketIcon} title="No requests in this view" text={filter ? "Try another status filter." : "When you need us, your support requests will be here."} action={!canManage && <button className="button button-outline" onClick={() => setModal(true)}><Plus size={15} /> Create a request</button>} /> :
      <div className={`tickets-layout ${selected ? "has-selection" : ""}`}><div className="ticket-list">{tickets.map((ticket) => <button key={ticket._id} className={`ticket-row ${selected?._id === ticket._id ? "selected" : ""}`} onClick={() => select(ticket)}><span className="ticket-row-icon"><TicketIcon size={16} /></span><span className="ticket-row-info"><strong>{ticket.title}</strong><small>{ticket.category} · {formatDate(ticket.updatedAt, { month: "short", day: "numeric" })}{canManage && ticket.student && ` · ${ticket.student.name}`}</small></span><Pill tone={toneForStatus(ticket.status)}>{ticket.status.replace("-", " ")}</Pill><ChevronRight size={15} /></button>)}</div>
        {selected && <section className="ticket-detail"><div className="ticket-detail-head"><div><span className="page-eyebrow">SUPPORT REQUEST</span><h2>{selected.title}</h2></div><Pill tone={toneForStatus(selected.status)}>{selected.status.replace("-", " ")}</Pill></div><div className="ticket-detail-meta"><span>{selected.category}</span><i>·</i><span>{selected.priority} priority</span><i>·</i><span>Opened {formatDate(selected.createdAt)}</span></div><p className="ticket-description">{selected.description}</p>{selected.attachments?.length > 0 && <div className="attachment-list">{selected.attachments.map((file) => <a key={file} href={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${file}`} target="_blank" rel="noreferrer"><Paperclip size={14} /> Attachment</a>)}</div>}
          <div className="reply-heading"><MessageSquare size={16} /> Conversation <span>{replies.length}</span></div><div className="reply-list">{replies.map((item) => <article className={`reply-item ${item.internal ? "internal-reply" : ""}`} key={item._id}><div className="reply-avatar">{item.author?.name?.slice(0, 1) || "C"}</div><div><div className="reply-meta"><strong>{item.author?.name || "Campus team"}</strong><span>{formatDate(item.createdAt, { month: "short", day: "numeric" })}{item.internal && " · Internal note"}</span></div><p>{item.content}</p></div></article>)}{replies.length === 0 && <p className="no-replies">No replies yet. The campus team will follow up here.</p>}</div>
          {canManage && <div className="status-actions"><span>Update status</span>{["open", "in-progress", "resolved", "closed"].map((status) => <button key={status} className={selected.status === status ? "active" : ""} onClick={() => changeStatus(status)}>{status.replace("-", " ")}</button>)}</div>}
          {selected.status !== "closed" && <form className="reply-form" onSubmit={sendReply}><textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={canManage ? "Write a response to the student..." : "Add a message to this request..."} rows="3" maxLength={5000} required />{canManage && <label className="checkbox-field"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note (only staff can see this)</label>}<div><span>Be kind — there’s a person on the other side.</span><button className="button button-primary button-small" disabled={!reply.trim()}><Send size={14} /> Reply</button></div></form>}
        </section>}
      </div>}
    {modal && <Modal title="Tell us how we can help" onClose={() => setModal(false)}><form className="modal-form" onSubmit={create}><label>What do you need help with?<input required minLength={3} maxLength={180} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A short summary" /></label><div className="form-two-col"><label>Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><label>Tell us a little more<textarea required minLength={10} rows="5" maxLength={10000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Share the details that might help us..." /></label><label className="file-input"><Paperclip size={15} /> Add attachments (PDF, JPEG or PNG; max 5 MB each)<input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 3))} /></label>{files.length > 0 && <div className="selected-files">{files.map((file) => <span key={file.name}>{file.name}</span>)}</div>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setModal(false)}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? "Submitting..." : <><Check size={15} /> Submit request</>}</button></div></form></Modal>}
  </div>;
}
