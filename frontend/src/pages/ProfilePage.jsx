import { useState } from "react";
import { Check, LockKeyhole, Save, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { PageTitle, Pill } from "../components/UI.jsx";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user.name || "", department: user.department || "", studentId: user.studentId || "", year: user.year || "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(event) {
    event.preventDefault(); setSavingProfile(true);
    try { const { data } = await api.put("/auth/profile", profile); updateUser(data.user); toast.success("Your profile is up to date."); }
    catch (e) { toast.error(e.response?.data?.message || "Could not save your profile."); }
    finally { setSavingProfile(false); }
  }
  async function changePassword(event) {
    event.preventDefault();
    if (password.newPassword !== password.confirm) { toast.error("Your new passwords don’t match."); return; }
    setSavingPassword(true);
    try { await api.put("/auth/password", { currentPassword: password.currentPassword, newPassword: password.newPassword }); setPassword({ currentPassword: "", newPassword: "", confirm: "" }); toast.success("Password changed successfully."); }
    catch (e) { toast.error(e.response?.data?.message || "Could not change your password."); }
    finally { setSavingPassword(false); }
  }

  return <div><PageTitle eyebrow="YOUR CAMPUS IDENTITY" title="A little about you." description="Keep your profile details current so your campus workspace feels like yours." />
    <div className="profile-layout"><section className="surface-card profile-card"><div className="profile-card-heading"><span className="profile-large-avatar">{user.name.slice(0, 1).toUpperCase()}</span><div><h2>{user.name}</h2><p>{user.email}</p><Pill tone="blue">{user.role}</Pill></div></div><form className="modal-form profile-form" onSubmit={saveProfile}><div className="profile-section-title"><UserRound size={17} /> Personal details</div><label>Full name<input required minLength={2} maxLength={100} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label><label>Campus email<input value={user.email} disabled /></label><div className="form-two-col"><label>Department<input maxLength={100} value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} placeholder="Your department" /></label><label>Student / staff ID<input maxLength={50} value={profile.studentId} onChange={(e) => setProfile({ ...profile, studentId: e.target.value })} placeholder="Your campus ID" /></label></div><label>Year or role details<input maxLength={50} value={profile.year} onChange={(e) => setProfile({ ...profile, year: e.target.value })} placeholder="e.g. Third year" /></label><div className="profile-save"><span>Some details may only apply to students.</span><button className="button button-primary" disabled={savingProfile}>{savingProfile ? "Saving..." : <><Save size={15} /> Save changes</>}</button></div></form></section>
      <section className="surface-card password-card"><div className="profile-section-title"><LockKeyhole size={17} /> Update password</div><p>Choose a password with at least 8 characters.</p><form className="modal-form" onSubmit={changePassword}><label>Current password<input type="password" autoComplete="current-password" required value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} /></label><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} /></label><label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })} /></label><button className="button button-primary" disabled={savingPassword}>{savingPassword ? "Updating..." : <><Check size={15} /> Update password</>}</button></form><div className="privacy-note"><ShieldCheck size={17} /><span>Your password is encrypted and never shared with other campus members.</span></div></section></div>
  </div>;
}
