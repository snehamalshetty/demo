import { useEffect, useRef, useState } from "react";
import { ArrowUp, MessageCircle, MoreHorizontal, Plus, Sparkles, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState, ErrorState, formatDate, LoadingState, PageTitle } from "../components/UI.jsx";

const suggestions = ["Where can I find study spaces?", "How do I request an enrollment letter?", "Who can help with campus Wi-Fi?"];

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  async function loadConversations() {
    try { setError(""); const { data } = await api.get("/chat/conversations"); setConversations(data.data); }
    catch (e) { setError(e.response?.data?.message || "Unable to load conversation history."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function openConversation(id) {
    try {
      const { data } = await api.get(`/chat/conversations/${id}`);
      setActiveId(id); setMessages(data.messages); setError("");
    } catch (e) { toast.error(e.response?.data?.message || "Could not open that conversation."); }
  }
  async function newConversation() {
    try {
      const { data } = await api.post("/chat/conversations");
      setActiveId(data.conversation._id); setMessages([]); await loadConversations(); inputRef.current?.focus();
    } catch (e) { toast.error(e.response?.data?.message || "Could not start a conversation."); }
  }
  async function deleteConversation(event, id) {
    event.stopPropagation();
    if (!window.confirm("Delete this conversation and its messages?")) return;
    try {
      await api.delete(`/chat/conversations/${id}`);
      setConversations((list) => list.filter((item) => item._id !== id));
      if (id === activeId) { setActiveId(null); setMessages([]); }
      toast.success("Conversation deleted.");
    } catch (e) { toast.error(e.response?.data?.message || "Could not delete the conversation."); }
  }
  async function sendMessage(event, selectedText) {
    event?.preventDefault();
    const text = (selectedText || input).trim();
    if (!text || sending) return;
    setInput(""); setSending(true); setError("");
    const optimisticMessage = { _id: `pending-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((items) => [...items, optimisticMessage]);
    try {
      const { data } = await api.post("/chat", { message: text, conversationId: activeId || undefined });
      setActiveId(data.conversationId);
      setMessages((items) => [...items.filter((item) => item._id !== optimisticMessage._id), data.userMessage, data.assistantMessage]);
      await loadConversations();
    } catch (e) {
      setMessages((items) => items.filter((item) => item._id !== optimisticMessage._id));
      setInput(text);
      toast.error(e.response?.data?.message || "Could not get an answer. Please try again.");
    } finally { setSending(false); inputRef.current?.focus(); }
  }

  return <div className="chat-page">
    <PageTitle eyebrow="A HELPFUL PLACE TO START" title="Ask your campus." description="Get answers from published campus resources — and a clear next step when we can’t verify something." />
    <div className="chat-workspace">
      <aside className="chat-history"><div className="chat-history-head"><div><span className="page-eyebrow">YOUR CHATS</span><strong>Recent conversations</strong></div><button className="new-chat-button" onClick={newConversation} title="Start a new chat"><Plus size={17} /></button></div>
        {loading ? <LoadingState label="Loading chats..." /> : conversations.length ? <div className="history-list">{conversations.map((item) => <button key={item._id} className={`history-item ${activeId === item._id ? "selected" : ""}`} onClick={() => openConversation(item._id)}><MessageCircle size={15} /><span><strong>{item.title}</strong><small>{formatDate(item.updatedAt, { month: "short", day: "numeric" })}</small></span><i onClick={(event) => deleteConversation(event, item._id)} role="button" aria-label="Delete conversation"><Trash2 size={14} /></i></button>)}</div> : <div className="history-empty">Your conversations will show up here.</div>}
        <div className="history-footer">Your chats are private to your account.</div>
      </aside>
      <section className="chat-panel">
        <div className="chat-panel-top"><div className="assistant-identity"><span className="assistant-avatar"><Sparkles size={17} /></span><div><strong>Campus assistant</strong><small><i /> Answers from campus knowledge</small></div></div><button className="icon-button" title="New chat" onClick={newConversation}><MoreHorizontal size={19} /></button></div>
        <div className="chat-transcript">
          {!messages.length ? <div className="chat-welcome"><div className="welcome-spark"><Sparkles size={22} /></div><span className="page-eyebrow">HERE FOR THE SMALL STUFF AND BIG QUESTIONS</span><h2>Hi {user.name.split(" ")[0]},<br />what’s on your mind?</h2><p>Ask me about campus services, resources, or where to go next.</p><div className="suggested-prompts">{suggestions.map((text) => <button key={text} onClick={() => sendMessage(null, text)}>{text}<ArrowUp size={13} /></button>)}</div></div> :
            <div className="message-list">{messages.map((message) => <article key={message._id} className={`chat-message message-${message.role}`}><div className={`message-avatar ${message.role === "assistant" ? "assistant-avatar" : ""}`}>{message.role === "assistant" ? <Sparkles size={14} /> : user.name.slice(0, 1).toUpperCase()}</div><div className="message-content"><div className="message-meta"><strong>{message.role === "assistant" ? "Campus assistant" : "You"}</strong><span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div><div className="message-bubble">{message.content.split("\n").map((line, index) => <p key={index}>{line || <br />}</p>)}
              {message.sources?.length > 0 && <div className="source-list"><span>VERIFIED SOURCES</span>{message.sources.map((source) => <span className="source-chip" key={source._id}>{source.title}</span>)}</div>}</div></div></article>)}
              {sending && <article className="chat-message message-assistant"><div className="message-avatar assistant-avatar"><Sparkles size={14} /></div><div className="typing-indicator"><i /><i /><i /></div></article>}
              <div ref={bottomRef} />
            </div>}
        </div>
        {error && <div className="chat-inline-error">{error}</div>}
        <form className="chat-composer" onSubmit={(event) => sendMessage(event)}><textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="Ask a question about campus..." maxLength={4000} rows="1" /><div><span>Campus answers are based on published resources.</span><button type="submit" className="send-button" disabled={!input.trim() || sending} aria-label="Send message"><ArrowUp size={17} /></button></div></form>
      </section>
    </div>
  </div>;
}
