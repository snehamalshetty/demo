import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const [values, setValues] = useState({ name: "", email: "", password: "", department: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  function update(event) { setValues({ ...values, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      if (isRegister) await register(values);
      else await login({ email: values.email, password: values.password });
      toast.success(isRegister ? "Welcome to Campus Connect!" : "Welcome back!");
      navigate("/app");
    } catch (error) {
      toast.error(error.response?.data?.message || "We couldn't sign you in. Please try again.");
    } finally { setBusy(false); }
  }

  return <div className="auth-page">
    <aside className="auth-aside"><Link to="/" className="auth-back"><ArrowLeft size={16} /> Back to home</Link><div className="auth-aside-content"><div className="auth-orb"><Sparkles size={27} /></div><span className="eyebrow light-eyebrow">YOUR CAMPUS, CONNECTED</span><h2>A little closer<br />to everything.</h2><p>Answers, support, and campus life — all in one welcoming place.</p><div className="auth-quote"><span>“</span><p>Campus feels better when you know where to turn.</p></div></div><div className="auth-aside-foot">© 2026 Campus Connect</div></aside>
    <main className="auth-main"><Link to="/" className="mobile-auth-brand"><span className="brand-mark"><span>c</span><i /></span><strong>campus<span>connect</span></strong></Link><div className="auth-card"><span className="eyebrow">{isRegister ? "A GOOD PLACE TO START" : "GOOD TO SEE YOU AGAIN"}</span><h1>{isRegister ? "Join your campus." : "Welcome back."}</h1><p className="auth-subtitle">{isRegister ? "Create your student account and get connected." : "Sign in to pick up right where you left off."}</p>
      <form className="auth-form" onSubmit={submit}>
        {isRegister && <label>Full name<input name="name" value={values.name} onChange={update} placeholder="e.g. Jordan Lee" required minLength={2} maxLength={100} autoComplete="name" /></label>}
        <label>Campus email<input name="email" type="email" value={values.email} onChange={update} placeholder="you@campus.edu" required autoComplete="email" /></label>
        {isRegister && <label>Department <span className="optional">(optional)</span><input name="department" value={values.department} onChange={update} placeholder="e.g. Arts & Sciences" maxLength={100} /></label>}
        <label>Password<div className="password-wrap"><input name="password" type={showPassword ? "text" : "password"} value={values.password} onChange={update} placeholder={isRegister ? "At least 8 characters" : "Enter your password"} required minLength={isRegister ? 8 : 1} autoComplete={isRegister ? "new-password" : "current-password"} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? "One moment..." : isRegister ? "Create account" : "Sign in"} {!busy && <ArrowRight size={16} />}</button>
      </form><div className="auth-switch">{isRegister ? "Already have an account?" : "New to Campus Connect?"} <Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></div><div className="auth-privacy">Your information stays within your campus workspace.</div>
    </div></main>
  </div>;
}
