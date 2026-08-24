"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { EventRecord, ServiceHourRecord, SessionUser } from "@/lib/types";
import {
  completeGoogleRedirectLogin,
  firebaseApi,
  loginWithGoogle,
} from "@/lib/firebase";
import { officialImages } from "./content";
import { VisualContentEditor } from "./VisualContentEditor";
import { AdminEvents } from "./AdminEvents";

type Navigate = (route: "home" | "login" | "portal" | "admin") => void;
type Json = Record<string, unknown>;

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  return firebaseApi<T>(url, options);
}

async function optimizeStoryImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/"))
    throw new Error("Choose a JPG, PNG, or WebP image.");
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob) throw new Error("The image could not be optimized.");
    return new File(
      [blob],
      `${file.name.replace(/\.[^.]+$/, "") || "story"}.webp`,
      {
        type: "image/webp",
      },
    );
  } catch (error) {
    if (file.size <= 5 * 1024 * 1024) return file;
    throw error instanceof Error
      ? error
      : new Error("The image could not be optimized.");
  }
}

function AppLogo({
  navigate,
  inverse = true,
}: {
  navigate: Navigate;
  inverse?: boolean;
}) {
  return (
    <button
      className={`logo ${inverse ? "logo-inverse" : ""}`}
      onClick={() => navigate("home")}
    >
      <span className="logo-mark">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span>
        <b>INSPIRE</b>
        <em>YOUTH IN SERVICE</em>
      </span>
    </button>
  );
}
function Notice({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return message ? (
    <div className={`form-notice ${error ? "error" : "success"}`}>
      {message}
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="portal-loading">
      <span>♫</span>
      <p>Loading your workspace…</p>
    </div>
  );
}

export function LoginApp({ navigate }: { navigate: Navigate }) {
  const [mode, setMode] = useState<"signin" | "create">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    instrument: "",
  });
  const openWorkspace = useCallback(
    (user: SessionUser) =>
      navigate(user.role === "member" ? "portal" : "admin"),
    [navigate],
  );
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const redirected = await completeGoogleRedirectLogin();
        if (redirected) {
          if (active) openWorkspace(redirected);
          return;
        }
        const { user } = await api<{ user: SessionUser | null }>(
          "/api/auth/session",
        );
        if (active && user) openWorkspace(user);
      } catch (error) {
        if (active)
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to complete Google sign-in",
          );
      }
    })();
    return () => {
      active = false;
    };
  }, [openWorkspace]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const path = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const result = await api<{
        user: SessionUser | null;
        verificationRequired?: boolean;
      }>(path, { method: "POST", body: JSON.stringify(form) });
      if (result.verificationRequired) {
        setMode("signin");
        setMessage(
          "A verification email was sent. Verify it, then sign in to activate the webmaster account.",
        );
        return;
      }
      if (result.user)
        navigate(result.user.role === "member" ? "portal" : "admin");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }
  async function googleSignIn() {
    setBusy(true);
    setMessage("");
    try {
      const user = await loginWithGoogle();
      if (user) openWorkspace(user);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in with Google",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-photo">
        <AppLogo navigate={navigate} />
        <img src={officialImages.hero} alt="Youth orchestra performance" />
        <div />
        <blockquote>
          “The best part of making music is discovering who it can reach.”
        </blockquote>
      </div>
      <div className="auth-panel">
        <button className="back-link" onClick={() => navigate("home")}>
          ← Back to site
        </button>
        <div className="auth-box">
          <p className="eyebrow">SECURE MEMBER PORTAL</p>
          <h1>{mode === "signin" ? "Welcome back." : "Join the movement."}</h1>
          <p>
            {mode === "signin"
              ? "Sign in to find events, manage your profile, and track service."
              : "Create your volunteer account. Your information is stored securely."}
          </p>
          <Notice
            message={message}
            error={/unable|invalid|error|failed|incorrect|cancelled|blocked/i.test(
              message,
            )}
          />
          <button
            className="google-auth-button"
            type="button"
            disabled={busy}
            onClick={googleSignIn}
          >
            <span aria-hidden="true">G</span>
            {mode === "signin" ? "Sign in with Google" : "Continue with Google"}
          </button>
          <div className="auth-divider">
            <span>or use email and password</span>
          </div>
          <form onSubmit={submit}>
            {mode === "create" && (
              <>
                <label>
                  Full name
                  <input
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>
                <label>
                  Primary instrument
                  <input
                    value={form.instrument}
                    onChange={(e) =>
                      setForm({ ...form, instrument: e.target.value })
                    }
                    placeholder="Violin, cello, piano…"
                  />
                </label>
              </>
            )}
            <label>
              Email address
              <input
                required
                autoComplete="username"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                required
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength={mode === "create" ? 10 : 1}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <button className="button coral" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in →"
                  : "Create account →"}
            </button>
          </form>
          <div className="auth-switch">
            {mode === "signin"
              ? "New to Inspire With Music?"
              : "Already a member?"}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "create" : "signin");
                setMessage("");
              }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type MemberTab =
  "Overview" | "Opportunities" | "My hours" | "Submit a story" | "My profile";
export function MemberPortal({ navigate }: { navigate: Navigate }) {
  const [tab, setTab] = useState<MemberTab>("Overview");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [hours, setHours] = useState<ServiceHourRecord[]>([]);
  const [totals, setTotals] = useState({
    verified_minutes: 0,
    pending_minutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const [dash, eventData, hourData] = await Promise.all([
        api<{
          user: SessionUser;
          totals: { verified_minutes: number; pending_minutes: number };
        }>("/api/dashboard"),
        api<{ events: EventRecord[] }>("/api/events"),
        api<{ hours: ServiceHourRecord[] }>("/api/hours"),
      ]);
      if (dash.user.role !== "member") {
        navigate("admin");
        return;
      }
      setUser(dash.user);
      setTotals(dash.totals);
      setEvents(eventData.events);
      setHours(hourData.hours);
    } catch {
      navigate("login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    load();
  }, [load]);
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    navigate("login");
  }
  async function toggleSignup(event: EventRecord) {
    setMessage("");
    if (
      event.is_signed_up &&
      !confirm(`Cancel your signup for ${event.title}?`)
    )
      return;
    try {
      await api(`/api/events/${event.id}/signup`, {
        method: event.is_signed_up ? "DELETE" : "POST",
      });
      setMessage(
        event.is_signed_up ? "Signup cancelled." : "You are signed up!",
      );
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update signup",
      );
    }
  }
  if (loading || !user) return <Loading />;
  const verifiedHours = totals.verified_minutes / 60;
  return (
    <div className="portal-shell">
      <MemberSidebar
        navigate={navigate}
        tab={tab}
        setTab={setTab}
        logout={logout}
      />
      <main className="portal-main">
        <div className="portal-top">
          <div>
            <p>MEMBER WORKSPACE</p>
            <h1>
              Hello, <em>{user.name.split(" ")[0]}.</em>
            </h1>
          </div>
          <button className="avatar">
            {user.name
              .split(" ")
              .map((x) => x[0])
              .slice(0, 2)
              .join("")}
          </button>
        </div>
        <Notice message={message} />
        {tab === "Overview" && (
          <MemberOverview
            user={user}
            events={events}
            hours={hours}
            verifiedHours={verifiedHours}
            pendingMinutes={totals.pending_minutes}
            toggleSignup={toggleSignup}
            setTab={setTab}
          />
        )}{" "}
        {tab === "Opportunities" && (
          <Opportunities events={events} toggleSignup={toggleSignup} />
        )}{" "}
        {tab === "My hours" && <HoursPage hours={hours} onSaved={load} />}{" "}
        {tab === "Submit a story" && (
          <StorySubmission
            onSaved={() => setMessage("Your story was submitted for review.")}
          />
        )}{" "}
        {tab === "My profile" && <ProfileForm user={user} onSaved={load} />}
      </main>
    </div>
  );
}

function MemberSidebar({
  navigate,
  tab,
  setTab,
  logout,
}: {
  navigate: Navigate;
  tab: MemberTab;
  setTab: (x: MemberTab) => void;
  logout: () => void;
}) {
  const tabs: MemberTab[] = [
    "Overview",
    "Opportunities",
    "My hours",
    "Submit a story",
    "My profile",
  ];
  const [open, setOpen] = useState(false);
  return (
    <aside className={`portal-sidebar ${open ? "workspace-menu-open" : ""}`}>
      <AppLogo navigate={navigate} />
      <button
        className="workspace-menu-button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="member-workspace-navigation"
      >
        <span>{open ? "Close" : "Menu"}</span>
        <b aria-hidden="true">{open ? "×" : "☰"}</b>
      </button>
      <nav id="member-workspace-navigation">
        {tabs.map((x, i) => (
          <button
            key={x}
            className={tab === x ? "selected" : ""}
            onClick={() => {
              setTab(x);
              setOpen(false);
            }}
          >
            <b>{["⌂", "◫", "◴", "✎", "♙"][i]}</b>
            <span>{x}</span>
          </button>
        ))}
      </nav>
      <div>
        <button onClick={() => navigate("home")}>
          ↗ <span>View website</span>
        </button>
        <button onClick={logout}>
          ↪ <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
function MemberOverview({
  user,
  events,
  hours,
  verifiedHours,
  pendingMinutes,
  toggleSignup,
  setTab,
}: {
  user: SessionUser;
  events: EventRecord[];
  hours: ServiceHourRecord[];
  verifiedHours: number;
  pendingMinutes: number;
  toggleSignup: (x: EventRecord) => void;
  setTab: (x: MemberTab) => void;
}) {
  return (
    <>
      <div className={`membership-banner ${user.membership_status}`}>
        <div>
          <b>
            {user.membership_status === "official_member"
              ? "Official member"
              : "Website account"}
          </b>
          <p>
            {user.membership_status === "official_member" ? (
              "Your official membership is active. You can join all eligible volunteer opportunities."
            ) : (
              <>
                To become an official Inspire With Music member, contact{" "}
                <a href="mailto:inspirewithmusic.org@gmail.com">
                  inspirewithmusic.org@gmail.com
                </a>
                .
              </>
            )}
          </p>
        </div>
      </div>
      <div className="portal-hero">
        <div>
          <p>YOUR VERIFIED IMPACT</p>
          <b>{verifiedHours.toFixed(1)}</b>
          <span>service hours</span>
          <div className="progress">
            <i
              style={{ width: `${Math.min(100, (verifiedHours / 40) * 100)}%` }}
            />
          </div>
          <small>
            {(pendingMinutes / 60).toFixed(1)} hours awaiting verification
          </small>
        </div>
        <span className="portal-note">♪</span>
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <span>♪</span>OPEN OPPORTUNITIES
          </p>
          <h2>Where will you make a difference next?</h2>
        </div>
        <button className="text-link" onClick={() => setTab("Opportunities")}>
          View all →
        </button>
      </div>
      <EventList
        events={events.filter((x) => x.signup_open).slice(0, 3)}
        toggleSignup={toggleSignup}
      />
      <div className="portal-bottom-grid">
        <div className="hours-card">
          <p className="eyebrow">RECENT SERVICE</p>
          <h2>Your hours</h2>
          {hours.slice(0, 4).map((x) => (
            <div key={x.id}>
              <span>{x.activity}</span>
              <b>{(x.minutes / 60).toFixed(1)} h</b>
              <em>{x.status}</em>
            </div>
          ))}
          {!hours.length && <p>No hours submitted yet.</p>}
          <button onClick={() => setTab("My hours")}>
            View and submit hours →
          </button>
        </div>
        <div className="story-submit">
          <span>✦</span>
          <h2>Share your story</h2>
          <p>Submit a reflection from your latest volunteer experience.</p>
          <button onClick={() => setTab("Submit a story")}>
            Start a submission →
          </button>
        </div>
      </div>
    </>
  );
}
function EventList({
  events,
  toggleSignup,
}: {
  events: EventRecord[];
  toggleSignup: (x: EventRecord) => void;
}) {
  return (
    <div className="event-list">
      {events.map((event) => {
        const date = new Date(event.starts_at);
        const signupEnabled = Boolean(
          event.can_signup || (event.is_signed_up && event.signup_open),
        );
        return (
          <article key={event.id}>
            <div className="event-date">
              <b>{date.getDate()}</b>
              <span>
                {date.toLocaleString("en", { month: "short" }).toUpperCase()}
              </span>
            </div>
            <div>
              <h3>{event.title}</h3>
              <p>
                {date.toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · {event.location}
              </p>
            </div>
            <span className="spots">
              {event.audience === "official_members"
                ? "Official members"
                : "All users"}{" "}
              · {Math.max(0, event.capacity - event.signup_count)} spots
            </span>
            <button
              className={event.is_signed_up ? "joined" : ""}
              disabled={!signupEnabled}
              onClick={() => toggleSignup(event)}
            >
              {event.is_signed_up && event.signup_open
                ? "Cancel signup"
                : event.can_signup
                  ? "Sign up →"
                  : event.signup_block_reason || "Signup closed"}
            </button>
            <details className="member-event-details">
              <summary>View event details</summary>
              <div>
                <p>
                  {event.description || "More information will be added soon."}
                </p>
                <dl>
                  <div>
                    <dt>Starts</dt>
                    <dd>
                      {new Date(event.starts_at).toLocaleString([], {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt>Ends</dt>
                    <dd>
                      {new Date(event.ends_at).toLocaleString([], {
                        dateStyle: "full",
                        timeStyle: "short",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{event.location}</dd>
                  </div>
                  <div>
                    <dt>Eligibility</dt>
                    <dd>
                      {event.audience === "official_members"
                        ? "Official members only"
                        : "All website users"}
                    </dd>
                  </div>
                  <div>
                    <dt>Service credit</dt>
                    <dd>
                      {(event.service_minutes / 60).toFixed(1)} hours after
                      attendance is confirmed
                    </dd>
                  </div>
                </dl>
                {event.is_signed_up && (
                  <strong>You are signed up for this event.</strong>
                )}
              </div>
            </details>
          </article>
        );
      })}
      {!events.length && (
        <div className="empty-row">No opportunities are open right now.</div>
      )}
    </div>
  );
}
function Opportunities({
  events,
  toggleSignup,
}: {
  events: EventRecord[];
  toggleSignup: (x: EventRecord) => void;
}) {
  return (
    <>
      <PortalTitle
        eyebrow="VOLUNTEER OPPORTUNITIES"
        title="Find your next event."
      />
      <EventList events={events} toggleSignup={toggleSignup} />
    </>
  );
}
function HoursPage({
  hours,
  onSaved,
}: {
  hours: ServiceHourRecord[];
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    activity: "",
    serviceDate: new Date().toISOString().slice(0, 10),
    minutes: 60,
    notes: "",
  });
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/hours", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage("Hours submitted for verification.");
      setForm({ ...form, activity: "", minutes: 60, notes: "" });
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit");
    }
  }
  return (
    <>
      <PortalTitle eyebrow="SERVICE RECORD" title="My service hours." />
      <div className="workspace-grid">
        <form className="workspace-form" onSubmit={submit}>
          <h3>Submit hours</h3>
          <Notice message={message} />
          <p className="event-hours-explainer">
            Event hours appear automatically after an administrator confirms
            your attendance. Use this form only for service completed outside a
            listed event.
          </p>
          <label>
            Activity
            <input
              required
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
            />
          </label>
          <div className="two-fields">
            <label>
              Date
              <input
                required
                type="date"
                value={form.serviceDate}
                onChange={(e) =>
                  setForm({ ...form, serviceDate: e.target.value })
                }
              />
            </label>
            <label>
              Minutes
              <input
                required
                type="number"
                min="1"
                value={form.minutes}
                onChange={(e) =>
                  setForm({ ...form, minutes: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>
          <button className="button ink">Submit for verification →</button>
        </form>
        <div className="workspace-list">
          <h3>History</h3>
          {hours.map((x) => (
            <article key={x.id}>
              <div>
                <b>{x.activity}</b>
                <span>
                  {x.service_date} · {(x.minutes / 60).toFixed(1)} hours
                </span>
              </div>
              <em className={`status-${x.status}`}>{x.status}</em>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
function StorySubmission({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    body: "",
    coverUrl: "",
  });
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  async function uploadCover(file: File) {
    setMessage("");
    setUploading(true);
    try {
      const optimized = await optimizeStoryImage(file);
      const data = new FormData();
      data.set("file", optimized);
      const result = await api<{ public_url: string }>("/api/story-media", {
        method: "POST",
        body: data,
      });
      setForm((current) => ({ ...current, coverUrl: result.public_url }));
      setMessage("Image uploaded and optimized.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to upload image",
      );
    } finally {
      setUploading(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/stories", { method: "POST", body: JSON.stringify(form) });
      setForm({ title: "", excerpt: "", body: "", coverUrl: "" });
      setMessage(
        "Submitted. A webmaster will review your story before publication.",
      );
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit");
    }
  }
  return (
    <>
      <PortalTitle eyebrow="STORIES IN ACTION" title="Share your experience." />
      <form className="workspace-form wide" onSubmit={submit}>
        <Notice message={message} />
        <label>
          Story title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label>
          Short introduction
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />
        </label>
        <label>
          Your reflection
          <textarea
            className="story-body"
            required
            minLength={40}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </label>
        <label className="story-image-upload">
          Story image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadCover(file);
            }}
          />
          <small>
            JPG, PNG, or WebP. Large images are resized automatically for faster
            loading.
          </small>
        </label>
        {form.coverUrl && (
          <img
            className="story-cover-preview"
            src={form.coverUrl}
            alt="Story cover preview"
          />
        )}
        <button className="button ink" disabled={uploading}>
          {uploading ? "Optimizing image…" : "Submit for review →"}
        </button>
      </form>
    </>
  );
}
function ProfileForm({
  user,
  onSaved,
}: {
  user: SessionUser;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    instrument: user.instrument,
  });
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setMessage("Profile updated.");
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save");
    }
  }
  return (
    <>
      <PortalTitle eyebrow="MEMBER PROFILE" title="Your information." />
      <form className="workspace-form" onSubmit={submit}>
        <Notice message={message} />
        <label>
          Name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Email
          <input disabled value={user.email} />
        </label>
        <label>
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label>
          Instrument
          <input
            value={form.instrument}
            onChange={(e) => setForm({ ...form, instrument: e.target.value })}
          />
        </label>
        <button className="button ink">Save profile →</button>
      </form>
    </>
  );
}
function PortalTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-heading portal-title">
      <div>
        <p className="eyebrow">
          <span>♪</span>
          {eyebrow}
        </p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

type AdminTab =
  | "Overview"
  | "Site content"
  | "Media library"
  | "Stories"
  | "Events"
  | "Members"
  | "Service hours"
  | "Contact inbox"
  | "Settings";
type AdminStats = {
  members: number;
  verified_minutes: number;
  events: number;
  stories_pending: number;
  hours_pending: number;
};
const emptyAdminStats: AdminStats = {
  members: 0,
  verified_minutes: 0,
  events: 0,
  stories_pending: 0,
  hours_pending: 0,
};
export function AdminPortal({ navigate }: { navigate: Navigate }) {
  const [tab, setTab] = useState<AdminTab>("Overview");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = useState<AdminStats>(emptyAdminStats);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const result = await api<{ user: SessionUser; stats: AdminStats }>(
        "/api/dashboard",
      );
      if (result.user.role === "member") {
        navigate("portal");
        return;
      }
      setUser(result.user);
      setDashboard(result.stats);
    } catch {
      navigate("login");
    }
  }, [navigate]);
  useEffect(() => {
    let active = true;
    api<{ user: SessionUser | null }>("/api/auth/session")
      .then((result) => {
        if (!active) return;
        if (!result.user) return navigate("login");
        if (result.user.role === "member") return navigate("portal");
        setUser(result.user);
        setLoading(false);
        void refresh();
      })
      .catch(() => navigate("login"));
    return () => {
      active = false;
    };
  }, [navigate, refresh]);
  if (loading || !user) return <Loading />;
  const webmaster = user.role === "webmaster";
  const allowed: AdminTab[] = webmaster
    ? [
        "Overview",
        "Site content",
        "Media library",
        "Stories",
        "Events",
        "Members",
        "Service hours",
        "Contact inbox",
        "Settings",
      ]
    : ["Overview", "Events", "Members", "Service hours"];
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    navigate("login");
  }
  return (
    <div className="admin-shell">
      <aside
        className={`admin-sidebar ${menuOpen ? "workspace-menu-open" : ""}`}
      >
        <AppLogo navigate={navigate} />
        <button
          className="workspace-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="admin-workspace-navigation"
        >
          <span>{menuOpen ? "Close" : "Menu"}</span>
          <b aria-hidden="true">{menuOpen ? "×" : "☰"}</b>
        </button>
        <div className="role-pill">
          {user.role.replace("_", " ").toUpperCase()}
        </div>
        <nav id="admin-workspace-navigation">
          {allowed.map((x, i) => (
            <button
              key={x}
              className={tab === x ? "selected" : ""}
              onClick={() => {
                setTab(x);
                setMenuOpen(false);
              }}
            >
              <span>{["⌂", "✎", "▧", "☷", "◫", "♙", "◴", "✉", "⚙"][i]}</span>
              {x}
            </button>
          ))}
        </nav>
        <button className="admin-exit" onClick={() => navigate("home")}>
          ↗ View website
        </button>
        <button className="admin-exit" onClick={logout}>
          ↪ Sign out
        </button>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <div>
            <p>{user.role.replace("_", " ").toUpperCase()}</p>
            <h1>{tab}</h1>
          </div>
          <button className="admin-user" aria-label="Account menu">
            {user.name
              .split(" ")
              .map((x) => x[0])
              .slice(0, 2)
              .join("")}
          </button>
        </div>
        {tab === "Overview" && (
          <RealAdminOverview
            stats={dashboard}
            setTab={setTab}
            webmaster={webmaster}
          />
        )}{" "}
        {tab === "Events" && (
          <AdminEvents onDashboardChange={refresh} webmaster={webmaster} />
        )}{" "}
        {tab === "Members" && <RealMembersAdmin webmaster={webmaster} />}{" "}
        {tab === "Service hours" && <HoursAdmin canReview={webmaster} />}{" "}
        {tab === "Site content" && webmaster && <VisualContentEditor />}{" "}
        {tab === "Media library" && webmaster && <MediaAdmin />}{" "}
        {tab === "Stories" && webmaster && <StoriesAdmin />}{" "}
        {tab === "Contact inbox" && webmaster && <InboxAdmin />}{" "}
        {tab === "Settings" && webmaster && <RealSettings />}
      </main>
    </div>
  );
}
function RealAdminOverview({
  stats,
  setTab,
  webmaster,
}: {
  stats: AdminStats;
  setTab: (x: AdminTab) => void;
  webmaster: boolean;
}) {
  const cards = webmaster
    ? [
        [stats.members, "Active volunteers"],
        [(stats.verified_minutes / 60).toFixed(1), "Verified hours"],
        [stats.events, "Total events"],
        [stats.stories_pending, "Stories in review"],
      ]
    : [
        [stats.events, "Volunteer events"],
        [(stats.verified_minutes / 60).toFixed(1), "Recorded hours"],
        [stats.hours_pending, "Pending hour records"],
      ];
  const actions = webmaster
    ? [
        ["◫", "Create and manage events", "Events"],
        ["✓", "Review volunteer hours", "Service hours"],
        ["♙", "Manage members and roles", "Members"],
        ["✎", "Edit public website", "Site content"],
      ]
    : [
        ["◫", "Add volunteer events", "Events"],
        ["◴", "View volunteer hours", "Service hours"],
      ];
  return (
    <>
      <div className="admin-welcome">
        <div>
          <p>{webmaster ? "WEBSITE CONTROL CENTER" : "VOLUNTEER OPERATIONS"}</p>
          <h2>
            {webmaster ? (
              <>
                Make updates.
                <br />
                <em>See them live.</em>
              </>
            ) : (
              <>
                Plan events.
                <br />
                <em>Track service.</em>
              </>
            )}
          </h2>
          <span className="admin-welcome-copy">
            {webmaster
              ? "Edit the public site visually, publish new images and content, and manage the organization from one workspace."
              : "Create volunteer opportunities and keep service records organized."}
          </span>
        </div>
        <div className="admin-welcome-actions">
          <button
            className="button coral"
            onClick={() => setTab(webmaster ? "Site content" : "Events")}
          >
            {webmaster ? "✎ Edit website" : "+ Create an event"}
          </button>
          <button
            className="button admin-welcome-secondary"
            onClick={() => setTab("Events")}
          >
            Manage events →
          </button>
        </div>
      </div>
      <div className="stat-cards">
        {cards.map((x, i) => (
          <article key={String(x[1])}>
            <span>0{i + 1}</span>
            <b>{x[0]}</b>
            <p>{x[1]}</p>
            <small>Live</small>
          </article>
        ))}
      </div>
      <div className="admin-grid">
        <section>
          <div className="admin-section-head">
            <h3>{webmaster ? "Management" : "Volunteer administration"}</h3>
          </div>
          {actions.map((x) => (
            <button
              className="quick-action"
              key={String(x[1])}
              onClick={() => setTab(x[2] as AdminTab)}
            >
              <span>{x[0]}</span>
              {x[1]}
              <span>→</span>
            </button>
          ))}
        </section>
        <section>
          <div className="admin-section-head">
            <h3>Permissions</h3>
          </div>
          <p className="admin-copy">
            {webmaster
              ? "The Webmaster has complete control of website content, programs, members, events, stories, messages, settings, and service-hour review."
              : "Volunteer Admin access includes creating and editing events, managing signup rosters, confirming attendance, and viewing service hours."}
          </p>
        </section>
      </div>
    </>
  );
}
type AdminUser = SessionUser & { verified_minutes: number; created_at: string };
function RealMembersAdmin({ webmaster }: { webmaster: boolean }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(
    () =>
      api<{ users: AdminUser[] }>("/api/users").then((x) => setUsers(x.users)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function update(id: string, change: Json) {
    try {
      await api(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(change),
      });
      setMessage("Member updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update");
    }
  }
  return (
    <div className="table-card">
      <div className="table-toolbar">
        <div>
          <h2>Members and administrators</h2>
          <p>
            Approve website users as official members here. Only the Webmaster
            can change account roles or access status.
          </p>
        </div>
      </div>
      <Notice message={message} />
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Instrument</th>
              <th>Hours</th>
              <th>Membership</th>
              <th>Status</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((x) => {
              const owner =
                x.email.toLowerCase() === "inspirewithmusic.org@gmail.com";
              return (
                <tr key={x.id}>
                  <td>
                    <b>{x.name}</b>
                    <span>{x.email}</span>
                  </td>
                  <td>{x.instrument || "—"}</td>
                  <td>{(x.verified_minutes / 60).toFixed(1)} h</td>
                  <td>
                    {owner ? (
                      <em>official member</em>
                    ) : (
                      <select
                        value={x.membership_status}
                        onChange={(e) =>
                          update(x.id, { membershipStatus: e.target.value })
                        }
                        aria-label={"Membership for " + x.name}
                      >
                        <option value="website_user">website user</option>
                        <option value="official_member">official member</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {owner || !webmaster ? (
                      <em>active</em>
                    ) : (
                      <select
                        value={x.status}
                        onChange={(e) =>
                          update(x.id, { status: e.target.value })
                        }
                      >
                        <option>active</option>
                        <option>pending</option>
                        <option>inactive</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {owner || !webmaster ? (
                      <em>
                        {owner
                          ? "webmaster · protected"
                          : x.role.replace("_", " ")}
                      </em>
                    ) : (
                      <select
                        value={x.role}
                        onChange={(e) => update(x.id, { role: e.target.value })}
                      >
                        <option value="member">member</option>
                        <option value="volunteer_admin">volunteer admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function HoursAdmin({ canReview }: { canReview: boolean }) {
  const [hours, setHours] = useState<ServiceHourRecord[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(
    () =>
      api<{ hours: ServiceHourRecord[] }>("/api/hours").then((x) =>
        setHours(x.hours),
      ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function decide(id: string, status: "verified" | "rejected") {
    await api(`/api/hours/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setMessage(`Hours ${status}.`);
    await load();
  }
  return (
    <div className="table-card">
      <div className="table-toolbar">
        <div>
          <h2>
            {canReview ? "Service-hour review" : "Volunteer service hours"}
          </h2>
          <p>
            {canReview
              ? "Verify or reject member submissions."
              : "Read-only record of submitted volunteer hours."}
          </p>
        </div>
      </div>
      <Notice message={message} />
      <div className="responsive-table">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Activity</th>
              <th>Date</th>
              <th>Hours</th>
              <th>{canReview ? "Status / actions" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.member_name}</b>
                  <span>{x.member_email}</span>
                </td>
                <td>
                  {x.activity}
                  <span>{x.notes}</span>
                </td>
                <td>{x.service_date}</td>
                <td>{(x.minutes / 60).toFixed(1)}</td>
                <td>
                  {canReview && x.status === "pending" ? (
                    <>
                      <button onClick={() => decide(x.id, "verified")}>
                        Verify
                      </button>
                      <button
                        className="danger-link"
                        onClick={() => decide(x.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <em>{x.status}</em>
                  )}
                </td>
              </tr>
            ))}
            {!hours.length && (
              <tr>
                <td colSpan={5}>No hour submissions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
type MediaAsset = {
  id: string;
  filename: string;
  public_url: string;
  mime_type: string;
  byte_size: number;
  alt_text: string;
};
function MediaAdmin() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(
    () =>
      api<{ assets: MediaAsset[] }>("/api/media").then((x) =>
        setAssets(x.assets),
      ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("altText", alt);
    try {
      await api("/api/media", { method: "POST", body: form });
      setMessage("Image uploaded. Its URL is ready to use in Site Content.");
      setFile(null);
      setAlt("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    }
  }
  return (
    <>
      <form className="media-upload" onSubmit={upload}>
        <div>
          <h2>Media library</h2>
          <p>Upload website images up to 10 MB.</p>
        </div>
        <label>
          Image
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Accessible description
          <input
            required
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </label>
        <button className="button coral">Upload image →</button>
      </form>
      <Notice message={message} />
      <div className="media-grid">
        {assets.map((x) => (
          <article key={x.id}>
            <img src={x.public_url} alt={x.alt_text} />
            <div>
              <b>{x.filename}</b>
              <span>{(x.byte_size / 1024).toFixed(0)} KB</span>
              <button
                onClick={() => navigator.clipboard.writeText(x.public_url)}
              >
                Copy URL
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
type StoryRecord = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  cover_url: string;
  status: string;
  author_name: string;
  created_at: string;
};
function StoriesAdmin() {
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(
    () =>
      api<{ stories: StoryRecord[] }>("/api/stories").then((x) =>
        setStories(x.stories),
      ),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  async function decide(id: string, status: string) {
    await api(`/api/stories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setMessage(`Story ${status}.`);
    await load();
  }
  return (
    <div className="review-list">
      <div className="table-toolbar">
        <div>
          <h2>Student stories</h2>
          <p>Review submissions before they appear publicly.</p>
        </div>
      </div>
      <Notice message={message} />
      {stories.map((x) => (
        <article key={x.id}>
          <div>
            {x.cover_url && <img src={x.cover_url} alt="" />}
            <p>
              {x.author_name} · {x.status}
            </p>
            <h3>{x.title}</h3>
            <span>{x.excerpt}</span>
            <details>
              <summary>Read submission</summary>
              <p>{x.body}</p>
            </details>
          </div>
          <div>
            <button onClick={() => decide(x.id, "published")}>Publish</button>
            <button onClick={() => decide(x.id, "rejected")}>Reject</button>
          </div>
        </article>
      ))}
      {!stories.length && (
        <div className="empty-row">No stories submitted yet.</div>
      )}
    </div>
  );
}
type ContactRecord = {
  id: string;
  name: string;
  email: string;
  interest: string;
  message: string;
  status: string;
  created_at: string;
};
function InboxAdmin() {
  const [messages, setMessages] = useState<ContactRecord[]>([]);
  useEffect(() => {
    api<{ messages: ContactRecord[] }>("/api/messages").then((x) =>
      setMessages(x.messages),
    );
  }, []);
  return (
    <div className="review-list">
      <div className="table-toolbar">
        <div>
          <h2>Contact inbox</h2>
          <p>Messages submitted from the public Join page.</p>
        </div>
      </div>
      {messages.map((x) => (
        <article key={x.id}>
          <div>
            <p>
              {x.interest} · {new Date(x.created_at).toLocaleString()}
            </p>
            <h3>{x.name}</h3>
            <a href={`mailto:${x.email}`}>{x.email}</a>
            <span>{x.message}</span>
          </div>
          <a className="button ink" href={`mailto:${x.email}`}>
            Reply
          </a>
        </article>
      ))}
      {!messages.length && (
        <div className="empty-row">No contact messages yet.</div>
      )}
    </div>
  );
}
function RealSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    project_id: "inspirewithmusic123",
    storage_bucket: "inspirewithmusic123.firebasestorage.app",
    from_email: "hello@inspirewithmusic.org",
  });
  const [database, setDatabase] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<{
      settings: Record<string, string>;
      database: { provider: string; connected: boolean };
    }>("/api/settings").then((x) => {
      setSettings((s) => ({ ...s, ...x.settings }));
      setDatabase(x.database.provider);
    });
  }, []);
  async function save() {
    try {
      await api("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
      setMessage("Settings saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save");
    }
  }
  return (
    <div className="settings-page">
      <div className="settings-note">
        <span>i</span>
        <p>
          <b>Firebase environment</b>Authentication, roles, content, program
          data, events, and media are protected by deployed Firebase Security
          Rules.
        </p>
      </div>
      <Notice message={message} />
      <section>
        <div>
          <p>FIREBASE</p>
          <h2>Project connection</h2>
        </div>
        <div className="settings-fields">
          <label>
            Project ID
            <input disabled value={settings.project_id} />
          </label>
          <label>
            Storage bucket
            <input disabled value={settings.storage_bucket} />
          </label>
          <label>
            From email
            <input
              type="email"
              value={settings.from_email}
              onChange={(e) =>
                setSettings({ ...settings, from_email: e.target.value })
              }
            />
          </label>
          <label>
            Database
            <div className="connection-ok">● Connected · {database}</div>
          </label>
        </div>
      </section>
      <button className="button ink" onClick={save}>
        Save settings →
      </button>
    </div>
  );
}
