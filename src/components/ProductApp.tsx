"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { send } from "@/lib/api";
import { useSession } from "@/lib/session";

type Screen = "landing" | "auth" | "dashboard";
type AuthMode = "login" | "signup";

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 38 34" fill="none"><path d="M19 31 3 18.2V3.5c0-1.5 1.8-2.3 2.9-1.3L19 12.6v18.4Z" fill="#2F7BFF" /><path d="m19 31 16-12.8V3.5c0-1.5-1.8-2.3-2.9-1.3L19 12.6V31Z" fill="#7258F5" /><path d="m19 12.6-13.1-10c-1.1-.9-2.9-.1-2.9 1.4v3.1l16 12.7v-4.5l-13-10 13 10v-.7Z" fill="#4DB9FF" opacity=".7" /></svg>
      <strong className={light ? "brand-light" : ""}>MoodVerse</strong>
    </span>
  );
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    heart: <path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.7 4.7 0 0 1 12 6.3a4.7 4.7 0 0 1 8.8 2.5Z" />,
    spark: <><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" /><path d="m19 16 .6 2.1L22 19l-2.4.8L19 22l-.6-2.2L16 19l2.4-.9L19 16Z" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.5 8.3-8 10-4.5-1.7-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M4 5.5v16" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
    google: <><path d="M21 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7.1Z" fill="currentColor" stroke="none" /><path d="M12 21c2.6 0 4.8-.8 6.3-2.2l-3.1-2.4c-.9.6-1.9.9-3.2.9-2.4 0-4.5-1.6-5.2-3.8H3.6V16c1.5 3 4.7 5 8.4 5Z" fill="currentColor" stroke="none" opacity=".7" /><path d="M6.8 13.5a5.4 5.4 0 0 1 0-3.4V7.7H3.6a9.5 9.5 0 0 0 0 8.2l3.2-2.4Z" fill="currentColor" stroke="none" opacity=".45" /><path d="M12 6.3c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.8 3.5 14.6 2.5 12 2.5c-3.7 0-6.9 2.1-8.4 5.2l3.2 2.4C7.5 7.9 9.6 6.3 12 6.3Z" fill="currentColor" stroke="none" opacity=".85" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function PublicNav({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
  return <header className="site-nav"><a href="#top" aria-label="MoodVerse home"><Logo /></a><nav className="nav-links" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#about">About</a></nav><div className="nav-actions"><button className="nav-login" onClick={() => onAuth("login")}>Sign in</button><button className="button button-small" onClick={() => onAuth("signup")}>Begin your journey <Icon name="arrow" size={16} /></button></div></header>;
}

function Landing({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
  return <div className="public-page" id="top"><PublicNav onAuth={onAuth} /><main><section className="hero-section"><div className="hero-copy"><span className="eyebrow"><Icon name="spark" size={15} /> Faith <b>+</b> Emotion <b>=</b> Guidance</span><h1>Your emotions<br /><em>meet scripture.</em></h1><p>Share what is on your heart and find a passage that meets you there. A quieter place to reflect, understand, and grow.</p><div className="hero-actions"><button className="button" onClick={() => onAuth("signup")}>Start your reflection <Icon name="arrow" size={18} /></button><a className="text-link" href="#how-it-works">Explore how it works <Icon name="arrow" size={16} /></a></div></div><div className="hero-art"><div className="hero-quote">“The Lord is close to<br />the brokenhearted.”<small>Psalm 34:18</small></div></div></section><section className="trust-row" id="features"><div><Icon name="heart" size={24} /><h3>Emotion-aware</h3><p>We meet what you feel, not just what you type.</p></div><div><Icon name="shield" size={24} /><h3>Trusted sources</h3><p>Thoughtfully curated scripture for the moment.</p></div><div><Icon name="spark" size={24} /><h3>Smart retrieval</h3><p>Meaningful guidance, grounded in real text.</p></div><div><Icon name="book" size={24} /><h3>A space to return to</h3><p>Save the words that stay with you.</p></div></section><section className="story-section" id="how-it-works"><div className="story-image" /><div className="story-copy"><span className="section-kicker">A gentler way to reflect</span><h2>Come as you are.<br /><em>Leave with a little light.</em></h2><p>MoodVerse helps you turn an honest feeling into a meaningful moment. Write freely, choose your tradition, and receive scripture with context and care.</p><div className="steps"><div><b>01</b><span><strong>Put it into words</strong><small>There is no right way to begin.</small></span></div><div><b>02</b><span><strong>Find a passage</strong><small>Let wisdom meet you where you are.</small></span></div><div><b>03</b><span><strong>Keep what helps</strong><small>Build a personal library of light.</small></span></div></div></div></section><section className="closing-quote" id="about"><p>“When life feels heavy,<br /><em>let your heart find peace.</em>”</p><span>MoodVerse</span></section></main><footer className="site-footer"><Logo /><span>Made for the moments in between.</span><span>© 2026 MoodVerse</span></footer></div>;
}

function AuthScreen({ mode, onModeChange, onBack }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void; onBack: () => void }) {
  const session = useSession(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(null); const exchange = await send({ baseUrl: session.baseUrl, method: "POST", path: mode === "login" ? "/auth/login" : "/auth/register", form: mode === "login" ? { username: email, password } : undefined, json: mode === "signup" ? { email, password, display_name: name || undefined } : undefined, endpointId: mode, label: mode === "login" ? "POST /auth/login" : "POST /auth/register" }); session.absorb(exchange); const token = (exchange.response?.json as { access_token?: string } | undefined)?.access_token; if (token) { const me = await send({ baseUrl: session.baseUrl, method: "GET", path: "/auth/me", bearer: token, endpointId: "me", label: "GET /auth/me" }); session.absorb(me); } if (!exchange.response?.ok) setError(exchange.error ?? `Could not ${mode === "login" ? "sign in" : "create your account"}.`); setBusy(false); };
  const google = () => {
    const redirectUri = encodeURIComponent(window.location.origin);
    window.location.href = `${session.baseUrl.replace(/\/$/, "")}/auth/oidc/login?redirect_uri=${redirectUri}`;
  };
  return <div className="auth-page"><div className="auth-visual"><button className="back-button" onClick={onBack}>← Back to home</button><div className="auth-visual-copy"><Logo light /><p>“There is a quiet<br />strength in beginning<br />again.”</p><small>Find your way back to what grounds you.</small></div></div><div className="auth-panel"><div className="auth-panel-inner"><div className="mobile-auth-logo"><Logo /></div><span className="section-kicker">Your private space for reflection</span><h1>{mode === "login" ? "Welcome back." : "Begin your journey."}</h1><p className="auth-intro">{mode === "login" ? "Pick up where you left off." : "A few details, then we can begin."}</p><button className="google-button" onClick={google}><Icon name="google" size={18} /> Continue with Google</button><div className="divider"><span>or use your email</span></div><form onSubmit={submit} className="auth-form">{mode === "signup" && <label>Your name<input value={name} onChange={e => setName(e.target.value)} placeholder="How should we call you?" /></label>}<label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="button auth-submit" disabled={busy}>{busy ? "One moment…" : mode === "login" ? "Sign in" : "Create my account"} <Icon name="arrow" size={17} /></button></form><p className="auth-switch">{mode === "login" ? "New to MoodVerse?" : "Already have an account?"} <button onClick={() => onModeChange(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p><p className="auth-legal">By continuing, you agree to create a thoughtful space for yourself. Your reflections stay yours.</p></div></div></div>;
}

function ReligionGate() {
  const session = useSession();
  const [choice, setChoice] = useState<"bible" | "quran" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!choice) return;
    setBusy(true);
    setError(null);
    const exchange = await send({
      baseUrl: session.baseUrl,
      method: "PATCH",
      path: "/auth/me/preferences",
      json: { preferred_religion: choice },
      bearer: session.accessToken,
      endpointId: "preferences",
      label: "PATCH /auth/me/preferences",
    });
    session.absorb(exchange);
    if (!exchange.response?.ok) setError("We could not save that choice. Please try again.");
    setBusy(false);
  };

  return <div className="auth-page"><div className="auth-visual"><div className="auth-visual-copy"><Logo light /><p>“Let wisdom meet<br />you where you are.”</p><small>Your first step shapes the space ahead.</small></div></div><div className="auth-panel"><form className="auth-panel-inner religion-form" onSubmit={save}><span className="section-kicker">One gentle question</span><h1>What grounds you?</h1><p className="auth-intro">Choose the scripture tradition you would like MoodVerse to use as your starting point. You can change this later.</p><div className="religion-options"><button type="button" className={choice === "bible" ? "religion-choice selected" : "religion-choice"} onClick={() => setChoice("bible")}><span className="religion-symbol">✦</span><span><strong>Christianity</strong><small>Bible</small></span>{choice === "bible" && <span className="choice-check">✓</span>}</button><button type="button" className={choice === "quran" ? "religion-choice selected" : "religion-choice"} onClick={() => setChoice("quran")}><span className="religion-symbol">☾</span><span><strong>Islam</strong><small>Quran</small></span>{choice === "quran" && <span className="choice-check">✓</span>}</button></div>{error && <p className="form-error">{error}</p>}<button className="button auth-submit" disabled={!choice || busy}>{busy ? "Saving your choice…" : "Continue to MoodVerse"} <Icon name="arrow" size={17} /></button></form></div></div>;
}

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const session = useSession(); const [reflection, setReflection] = useState(""); const [religion, setReligion] = useState<"bible" | "quran">(session.user?.preferred_religion ?? "bible"); const [submitted, setSubmitted] = useState(false); const name = session.user?.display_name?.split(" ")[0] || "friend";
  const submit = (event: FormEvent) => { event.preventDefault(); if (reflection.trim()) setSubmitted(true); };
  return <div className="dashboard-page"><aside className="dashboard-sidebar"><a href="#dashboard"><Logo /></a><nav><button className="active"><Icon name="spark" size={18} /> Home</button><button><Icon name="book" size={18} /> My reflections</button><button><Icon name="heart" size={18} /> Favorites</button><button><Icon name="clock" size={18} /> History</button></nav><div className="sidebar-bottom"><div className="sidebar-prompt">Small steps.<br />Beautiful moments.<br />With God.</div><button className="profile-button" onClick={onSignOut}><span className="avatar">{name[0].toUpperCase()}</span><span><strong>{session.user?.display_name || "Your space"}</strong><small>{session.user?.email}</small></span><span>↗</span></button></div></aside><main className="dashboard-main"><header className="dashboard-header"><div><span className="section-kicker">Your reflection space</span><h1>Good evening, {name} <span aria-hidden="true">👋</span></h1><p>You’re never alone. Let’s find a word for your heart today.</p></div><div className="dashboard-tools"><button aria-label="Search">⌕</button><button aria-label="Sign out" onClick={onSignOut}>↗</button></div></header><div className="dashboard-grid"><section><div className="reflection-hero"><div className="reflection-hero-text"><span className="section-kicker light-kicker">A moment for you</span><h2>What’s on your heart<br />today?</h2><p>Share your thoughts, feelings, or what you’re going through. We’ll find a passage that speaks to you.</p><form onSubmit={submit}><textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="e.g. I feel anxious about the future, I’m grateful today, I need strength…" /><div className="reflection-controls"><select value={religion} onChange={e => setReligion(e.target.value as "bible" | "quran")}><option value="bible">◈ Bible</option><option value="quran">☾ Quran</option></select><span>◉ Voice input coming soon</span><button aria-label="Find scripture" disabled={!reflection.trim()}><Icon name="arrow" size={18} /></button></div></form>{submitted && <p className="submitted-note">Your reflection is ready. Connect the API to begin scripture retrieval.</p>}</div></div><div className="insight-grid"><button><span className="insight-icon lilac"><Icon name="heart" /></span><strong>Find peace</strong><small>In moments of anxiety,<br />fear, or stress.</small><Icon name="arrow" size={16} /></button><button><span className="insight-icon mint"><Icon name="shield" /></span><strong>Get encouragement</strong><small>When you feel discouraged,<br />weak, or alone.</small><Icon name="arrow" size={16} /></button><button><span className="insight-icon blue"><Icon name="spark" /></span><strong>Find hope</strong><small>For a brighter tomorrow<br />and renewed faith.</small><Icon name="arrow" size={16} /></button></div><section className="featured-scripture"><div className="scripture-art" /><div><span className="section-kicker">Featured scripture</span><blockquote>“The Lord is close to the brokenhearted and saves those who are crushed in spirit.”</blockquote><cite>— Psalm 34:18</cite><button className="outline-button">View full scripture <Icon name="arrow" size={15} /></button></div></section></section><aside className="recent-panel"><div className="panel-heading"><h2>Recent reflections</h2><button>View all</button></div>{[["☼", "Feeling anxious about the future", "Today, 8:42 PM", "Isaiah 41:10"],["♡", "Feeling grateful", "Yesterday, 7:15 PM", "Psalm 136:1"],["♙", "Feeling lonely", "Aug 28, 2025", "Psalm 23:4"],["△", "Need strength", "Aug 26, 2025", "Philippians 4:13"],["❧", "Feeling hopeful", "Aug 24, 2025", "Jeremiah 29:11"]].map(([icon, title, date, verse]) => <button className="recent-item" key={title}><span>{icon}</span><span><strong>{title}</strong><small>{date}</small><small>{verse}</small></span></button>)}<div className="dashboard-quote">When you feel lost,<br />remember: the same God<br />who created the stars<br />also cares about your story.<small>MoodVerse</small></div></aside></div></main></div>;
}

export function ProductApp() {
  const session = useSession(); const [screen, setScreen] = useState<Screen>(session.user ? "dashboard" : "landing"); const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const { baseUrl, user, absorb, setAccessToken, setRefreshToken } = session;
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken || user) return;
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    window.history.replaceState({}, "", window.location.pathname);
    void send({ baseUrl, method: "GET", path: "/auth/me", bearer: accessToken, endpointId: "me", label: "GET /auth/me (Google OIDC)" }).then(absorb);
  }, [baseUrl, user, absorb, setAccessToken, setRefreshToken]);
  const openAuth = (mode: AuthMode) => { setAuthMode(mode); setScreen("auth"); };
  if (session.user && !session.user.preferred_religion) return <ReligionGate />;
  if (session.user || screen === "dashboard") return <Dashboard onSignOut={() => { session.signOut(); setScreen("landing"); }} />;
  if (screen === "auth") return <AuthScreen mode={authMode} onModeChange={setAuthMode} onBack={() => setScreen("landing")} />;
  return <Landing onAuth={openAuth} />;
}