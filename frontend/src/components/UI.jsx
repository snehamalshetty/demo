import { AlertCircle, ArrowRight, LoaderCircle, Search, X } from "lucide-react";

export function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-title-row"><div><div className="page-eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

export function LoadingState({ label = "Loading your campus..." }) {
  return <div className="loading-state"><LoaderCircle className="spinner-icon" size={22} />{label}</div>;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return <div className="empty-state">{Icon && <div className="empty-icon"><Icon size={22} /></div>}<strong>{title}</strong><p>{text}</p>{action}</div>;
}

export function ErrorState({ text, onRetry }) {
  return <div className="error-state"><AlertCircle size={19} /><div><strong>We couldn’t load this right now.</strong><p>{text}</p></div>{onRetry && <button className="button button-outline button-small" onClick={onRetry}>Try again</button>}</div>;
}

export function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><div><span className="page-eyebrow">CAMPUS CONNECT</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button></div>{children}</section></div>;
}

export function SearchBox({ value, onChange, placeholder = "Search..." }) {
  return <label className="search-box"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><span>⌘ K</span></label>;
}

export function Pill({ children, tone = "neutral" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function formatDate(date, options = { month: "short", day: "numeric", year: "numeric" }) {
  return date ? new Date(date).toLocaleDateString(undefined, options) : "Date not set";
}

export function ArrowLink({ to, children }) {
  return <a className="arrow-link" href={to}>{children}<ArrowRight size={14} /></a>;
}
