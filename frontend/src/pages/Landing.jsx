import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronDown, CircleHelp, MessageCircle, ShieldCheck, Sparkles, Ticket, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const features = [
  { icon: Sparkles, title: "AI campus assistant", text: "Get clear answers grounded in verified campus information, any time you need them.", color: "lavender" },
  { icon: BookOpen, title: "Knowledge, connected", text: "Find the right resource, policy, or service in one searchable campus library.", color: "blue-soft" },
  { icon: Ticket, title: "Support that follows through", text: "Submit a request, keep track of progress, and continue the conversation.", color: "mint" },
  { icon: CalendarDays, title: "Campus life, in sync", text: "Stay current with campus events, important updates, and opportunities.", color: "peach" }
];

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <a className="landing-brand" href="#home"><span className="brand-mark"><span>c</span><i /></span><strong>campus<span>connect</span></strong></a>
        <nav><a href="#features">Features</a><a href="#how">How it works</a><a href="#about">About</a><a href="#faq">FAQ</a></nav>
        <div className="nav-cta"><Link className="nav-login" to="/login">Log in</Link><Link className="button button-primary nav-get-started" to="/register">Get started <ArrowUpRight size={16} /></Link></div>
      </header>

      <section id="home" className="hero-section">
        <div className="hero-grid">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
            <div className="eyebrow"><span className="eyebrow-pulse" /> YOUR CAMPUS, CONNECTED</div>
            <h1>Your campus.<br /><span>One smart</span> connection.</h1>
            <p className="hero-description">The campus companion that brings your resources, support, and student life together — with helpful answers whenever you need them.</p>
            <div className="hero-actions"><Link to="/register" className="button button-primary button-large">Get started <ArrowRight size={17} /></Link><a className="text-button" href="#features">Explore features <ArrowDown size={16} /></a></div>
            <div className="trust-row"><div className="trust-avatars"><i>J</i><i>A</i><i>M</i><i>+</i></div><span>Made for the people who make campus</span></div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .15, duration: .7 }}>
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="preview-window">
              <div className="preview-top"><div className="preview-brand-mini"><span className="brand-mark"><span>c</span><i /></span><strong>campus<span>connect</span></strong></div><span className="preview-avatar">J</span></div>
              <div className="preview-body">
                <div className="preview-welcome"><small>MONDAY, OCTOBER 12</small><h3>Good morning, Jordan <span>✦</span></h3><p>Your campus is looking good today.</p></div>
                <div className="preview-stats"><div><span>Resources</span><strong>24</strong><i>↗ 4 new this week</i></div><div><span>Upcoming events</span><strong>03</strong><i>Next: Design meetup</i></div></div>
                <div className="preview-chat"><div className="preview-chat-head"><span className="ai-orb"><Sparkles size={14} /></span><div><strong>Campus assistant</strong><small><i /> Ready to help</small></div><span className="dots">•••</span></div><div className="chat-question">Where can I find study spaces?</div><div className="chat-answer"><span className="ai-orb mini"><Sparkles size={11} /></span><p>There are quiet study areas in the Learning Commons, open weekdays from 8 AM.<small>Based on Library hours and access <Check size={11} /></small></p></div><div className="chat-input-preview">Ask anything about campus... <span>↑</span></div></div>
              </div>
            </div>
            <div className="floating-note note-top"><span className="note-icon cyan-note"><Zap size={15} /></span><div><strong>Answers you can trust</strong><small>Grounded in campus knowledge</small></div></div>
            <div className="floating-note note-bottom"><span className="note-icon green-note"><Check size={16} /></span><div><strong>You're all caught up</strong><small>3 updates this week</small></div></div>
          </motion.div>
        </div>
        <div className="hero-curve" />
      </section>

      <section className="proof-strip"><span>EVERYTHING CAMPUS, ALL IN ONE PLACE</span><div><span><MessageCircle size={16} /> Answers</span><i /><span><BookOpen size={16} /> Resources</span><i /><span><Users size={16} /> Community</span><i /><span><ShieldCheck size={16} /> Support</span></div></section>

      <section id="features" className="section features-section">
        <div className="section-heading"><span className="eyebrow">MADE FOR CAMPUS LIFE</span><h2>Less searching.<br /><span>More belonging.</span></h2><p>Everything you need to feel informed, supported, and part of what’s happening.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, text, color }, i) => <motion.article className="feature-card" key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}><div className={`feature-icon ${color}`}><Icon size={20} /></div><h3>{title}</h3><p>{text}</p><a href="#how">Discover more <ArrowRight size={14} /></a></motion.article>)}</div>
      </section>

      <section id="how" className="how-section section"><div className="how-copy"><span className="eyebrow">SIMPLE BY DESIGN</span><h2>Your campus,<br />without the <span>runaround.</span></h2><p>Campus Connect takes the guesswork out of campus life. Find what you need, get a clear answer, and spend your time on what matters.</p><Link to="/register" className="button button-dark">Meet your campus hub <ArrowRight size={16} /></Link></div><div className="steps"><div className="step"><span>01</span><div><h3>Sign in with your campus community</h3><p>Your workspace is personal to you, your role, and your campus.</p></div><div className="step-icon"><Users size={19} /></div></div><div className="step"><span>02</span><div><h3>Ask, browse, or find your next event</h3><p>Explore trusted resources or ask the assistant a question in plain language.</p></div><div className="step-icon"><Sparkles size={19} /></div></div><div className="step"><span>03</span><div><h3>Get support that moves with you</h3><p>Keep requests and campus updates in one calm, organized place.</p></div><div className="step-icon"><CircleHelp size={19} /></div></div></div></section>

      <section id="about" className="about-band"><div><span className="eyebrow light-eyebrow">BUILT AROUND YOUR DAY</span><h2>More time for the<br />things that matter.</h2><p>Campus can be a lot to navigate. We bring the important stuff closer, so getting help feels easy and staying connected feels natural.</p><div className="about-checks"><span><Check size={15} /> Answers rooted in verified resources</span><span><Check size={15} /> Support requests you can follow</span><span><Check size={15} /> One place for campus updates</span></div></div><div className="about-metric"><div className="metric-ring"><Sparkles size={25} /><b>360°</b></div><span>A more connected<br />campus experience</span></div></section>

      <section className="quote-section section"><div className="quote-mark">“</div><blockquote>It’s the little things — finding the right office, knowing what’s coming up — that make campus feel like it’s yours.</blockquote><div className="quote-credit"><span className="quote-avatar">S</span><div><strong>Student-first, always</strong><small>Campus Connect community</small></div></div><div className="quote-pagination"><i className="active" /><i /><i /></div></section>

      <section id="faq" className="faq-section section"><div className="section-heading"><span className="eyebrow">GOOD TO KNOW</span><h2>A few things<br /><span>you might wonder.</span></h2></div><div className="faq-list">{[
        ["Who can use Campus Connect?", "Campus Connect is designed for students, faculty, and administrators. Your account role determines which campus tools and management features are available."],
        ["Are the assistant’s answers official campus policies?", "The assistant answers from published campus knowledge articles only. If information is not available or cannot be verified, it will say so and direct you to contact the relevant department."],
        ["How do I get help with something personal?", "Create a support ticket in your workspace. You can follow its status and replies there. Only you and authorized campus staff can see your ticket."],
        ["Can I use Campus Connect on my phone?", "Yes. The experience is responsive and works across desktop, tablet, and mobile screens."]
      ].map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><div className="cta-spark cta-spark-one">✳</div><div className="cta-spark cta-spark-two">✦</div><span className="eyebrow light-eyebrow">YOUR NEXT STEP STARTS HERE</span><h2>Feel more at home<br />on campus.</h2><p>Get connected to your campus in a whole new way.</p><Link to="/register" className="button button-white">Get started <ArrowRight size={16} /></Link></section>

      <footer className="landing-footer"><a className="landing-brand" href="#home"><span className="brand-mark"><span>c</span><i /></span><strong>campus<span>connect</span></strong></a><span>© 2026 Campus Connect. Built for campus communities.</span><div><a href="#features">Features</a><a href="#faq">Help & FAQ</a><Link to="/login">Sign in</Link></div></footer>
    </div>
  );
}
