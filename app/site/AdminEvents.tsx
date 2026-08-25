"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { firebaseApi } from "@/lib/firebase";
import type { EventRecord, EventSignup, SessionUser } from "@/lib/types";

type EventForm = {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  serviceMinutes: number;
  status: EventRecord["status"];
  audience: EventRecord["audience"];
};
const blankEvent: EventForm = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  capacity: 20,
  serviceMinutes: 120,
  status: "open",
  audience: "all_users",
};
const toLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const fromEvent = (event: EventRecord): EventForm => ({
  title: event.title,
  description: event.description,
  location: event.location,
  startsAt: toLocal(event.starts_at),
  endsAt: toLocal(event.ends_at),
  capacity: event.capacity,
  serviceMinutes: event.service_minutes,
  status: event.status,
  audience: event.audience ?? "all_users",
});

function EventFields({
  form,
  setForm,
  submitLabel,
  onSubmit,
}: {
  form: EventForm;
  setForm: (form: EventForm) => void;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const invalidDates = Boolean(
    form.startsAt &&
    form.endsAt &&
    new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime(),
  );
  return (
    <form className="event-editor-form" onSubmit={onSubmit}>
      <div className="two-fields">
        <label>
          Event title
          <input
            required
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
          />
        </label>
        <label>
          Location
          <input
            required
            value={form.location}
            onChange={(event) =>
              setForm({ ...form, location: event.target.value })
            }
          />
        </label>
      </div>
      <label>
        Description
        <textarea
          required
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />
      </label>
      <div className="event-four-fields">
        <label>
          Starts
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => {
              const startsAt = event.target.value;
              setForm({
                ...form,
                startsAt,
                endsAt:
                  form.endsAt &&
                  new Date(form.endsAt).getTime() <=
                    new Date(startsAt).getTime()
                    ? ""
                    : form.endsAt,
              });
            }}
          />
        </label>
        <label>
          Ends
          <input
            required
            type="datetime-local"
            min={form.startsAt || undefined}
            value={form.endsAt}
            onChange={(event) =>
              setForm({ ...form, endsAt: event.target.value })
            }
          />
        </label>
        <label>
          Capacity
          <input
            required
            min="1"
            type="number"
            value={form.capacity}
            onChange={(event) =>
              setForm({ ...form, capacity: Number(event.target.value) })
            }
          />
        </label>
        <label>
          Service minutes
          <input
            required
            min="1"
            type="number"
            value={form.serviceMinutes}
            onChange={(event) =>
              setForm({ ...form, serviceMinutes: Number(event.target.value) })
            }
          />
        </label>
      </div>
      {invalidDates && (
        <p className="event-date-error" role="alert">
          End time must be after the start time.
        </p>
      )}
      <div className="two-fields">
        <label>
          Who can sign up?
          <select
            value={form.audience}
            onChange={(event) =>
              setForm({
                ...form,
                audience: event.target.value as EventForm["audience"],
              })
            }
          >
            <option value="all_users">All website users</option>
            <option value="official_members">Official members only</option>
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(event) =>
              setForm({
                ...form,
                status: event.target.value as EventForm["status"],
              })
            }
          >
            <option value="draft">Draft</option>
            <option value="open">Open for signup</option>
            <option value="closed">Signup closed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
      <button className="button ink" disabled={invalidDates}>
        {submitLabel} →
      </button>
    </form>
  );
}

function safeCsv(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function AdminEvents({
  onDashboardChange,
  webmaster,
}: {
  onDashboardChange: () => Promise<void>;
  webmaster: boolean;
}) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EventForm>(blankEvent);
  const [signups, setSignups] = useState<EventSignup[]>([]);
  const [members, setMembers] = useState<SessionUser[]>([]);
  const [memberId, setMemberId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const selected = events.find((event) => event.id === selectedId);
  const selectedEndsAt = selected?.ends_at ?? "";
  const loadEvents = useCallback(async () => {
    const result = await firebaseApi<{ events: EventRecord[] }>("/api/events");
    setEvents(result.events);
    setSelectedId((current) =>
      current && result.events.some((event) => event.id === current)
        ? current
        : (result.events[0]?.id ?? ""),
    );
  }, []);
  const loadRoster = useCallback(async (eventId: string) => {
    if (!eventId) {
      setSignups([]);
      setMembers([]);
      return;
    }
    const result = await firebaseApi<{
      signups: EventSignup[];
      members: SessionUser[];
    }>(`/api/events/${eventId}/signups`);
    setSignups(result.signups);
    setMembers(result.members);
  }, []);
  useEffect(() => {
    loadEvents().catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Unable to load events",
      ),
    );
  }, [loadEvents]);
  useEffect(() => {
    loadRoster(selectedId).catch((error) =>
      setMessage(
        error instanceof Error ? error.message : "Unable to load signup list",
      ),
    );
  }, [selectedId, loadRoster]);
  useEffect(() => {
    if (!selectedEndsAt) return;
    const remaining = new Date(selectedEndsAt).getTime() - clock;
    if (remaining <= 0) return;
    const timer = window.setTimeout(
      () => setClock(Date.now()),
      Math.min(remaining + 50, 60000),
    );
    return () => window.clearTimeout(timer);
  }, [selectedEndsAt, clock]);
  const availableMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          (selected?.audience !== "official_members" ||
            member.membership_status === "official_member") &&
          !signups.some((signup) => signup.user_id === member.id),
      ),
    [members, signups, selected?.audience],
  );
  async function refresh() {
    await Promise.all([
      loadEvents(),
      loadRoster(selectedId),
      onDashboardChange(),
    ]);
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await firebaseApi("/api/events", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      });
      setMessage("Event created.");
      setForm(blankEvent);
      setCreating(false);
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create event",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      await firebaseApi(`/api/events/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      });
      setMessage("Event details saved.");
      setEditing(false);
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save event",
      );
    } finally {
      setBusy(false);
    }
  }
  async function addVolunteer() {
    if (!selected || !memberId) return;
    setBusy(true);
    try {
      await firebaseApi(`/api/events/${selected.id}/signups`, {
        method: "POST",
        body: JSON.stringify({ userId: memberId }),
      });
      setMemberId("");
      setMessage("Volunteer added to the signup list.");
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to add volunteer",
      );
    } finally {
      setBusy(false);
    }
  }
  async function attendance(
    userId: string,
    status: "pending" | "attended" | "absent",
  ) {
    if (!selected) return;
    setBusy(true);
    try {
      await firebaseApi(`/api/events/${selected.id}/signups/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ attendance: status }),
      });
      setMessage(
        status === "attended"
          ? "Attendance confirmed and service hours awarded."
          : status === "absent"
            ? "Marked absent; no service hours awarded."
            : "Attendance reset to pending.",
      );
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update attendance",
      );
    } finally {
      setBusy(false);
    }
  }
  async function removeSignup(userId: string) {
    if (
      !selected ||
      !confirm(
        "Remove this volunteer from the event? Any event hours will no longer count.",
      )
    )
      return;
    setBusy(true);
    try {
      await firebaseApi(`/api/events/${selected.id}/signups/${userId}`, {
        method: "DELETE",
      });
      setMessage("Volunteer removed from the event.");
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to remove signup",
      );
    } finally {
      setBusy(false);
    }
  }
  async function removeEvent() {
    if (!selected || !confirm(`Delete ${selected.title} and its signup list?`))
      return;
    setBusy(true);
    try {
      await firebaseApi(`/api/events/${selected.id}`, { method: "DELETE" });
      setMessage("Event deleted.");
      setSelectedId("");
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete event",
      );
    } finally {
      setBusy(false);
    }
  }
  function exportRoster() {
    if (!selected) return;
    const rows = [
      [
        "Name",
        "Email",
        "Instrument",
        "Signup source",
        "Attendance",
        "Signed up at",
      ],
      ...signups.map((signup) => [
        signup.member_name,
        signup.member_email,
        signup.member_instrument ?? "",
        signup.source,
        signup.attendance_status,
        signup.created_at,
      ]),
    ];
    const csv = rows.map((row) => row.map(safeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selected.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}-signups.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const eventEnded = selected
    ? clock >= new Date(selected.ends_at).getTime()
    : false;
  return (
    <div className="event-management">
      <div className="event-admin-head">
        <div>
          <h2>Volunteer events</h2>
          <p>
            Edit every event, manage its signup list, and confirm attendance
            before hours are awarded.
          </p>
        </div>
        <button
          className="button coral"
          disabled={busy}
          onClick={() => {
            setCreating(!creating);
            setForm(blankEvent);
          }}
        >
          {creating ? "Cancel" : "+ New event"}
        </button>
      </div>
      {message && <div className="form-notice success">{message}</div>}
      {creating && (
        <section className="event-create-panel">
          <h3>Create an event</h3>
          <EventFields
            form={form}
            setForm={setForm}
            submitLabel="Create event"
            onSubmit={create}
          />
        </section>
      )}
      <div className="event-admin-layout">
        <aside className="event-admin-list">
          {events.map((event) => (
            <button
              key={event.id}
              className={selectedId === event.id ? "selected" : ""}
              onClick={() => {
                setSelectedId(event.id);
                setEditing(false);
                setMessage("");
              }}
            >
              <span>
                {new Date(event.starts_at).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <b>{event.title}</b>
              <small>
                {event.signup_count} signed up ·{" "}
                {event.signup_open ? event.status : "signup closed"}
              </small>
            </button>
          ))}
          {!events.length && <p>No events yet.</p>}
        </aside>
        {selected ? (
          <section className="event-admin-detail">
            <div className="event-detail-title">
              <div>
                <p>
                  {new Date(selected.starts_at).toLocaleString([], {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </p>
                <h2>{selected.title}</h2>
                <span>
                  {selected.location} ·{" "}
                  {(selected.service_minutes / 60).toFixed(1)} service hours ·{" "}
                  {selected.audience === "official_members"
                    ? "Official members only"
                    : "All website users"}
                </span>
              </div>
              <div>
                <button
                  className="outline-button"
                  onClick={() => {
                    setForm(fromEvent(selected));
                    setEditing(!editing);
                  }}
                >
                  {editing ? "Close editor" : "Edit details"}
                </button>
                {webmaster && (
                  <button
                    className="danger-link event-delete"
                    onClick={removeEvent}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            {editing && (
              <EventFields
                form={form}
                setForm={setForm}
                submitLabel="Save details"
                onSubmit={save}
              />
            )}{" "}
            {!editing && (
              <p className="event-description">{selected.description}</p>
            )}
            <div className="roster-head">
              <div>
                <h3>Signup list</h3>
                <p>
                  {signups.length} of {selected.capacity} places filled
                </p>
              </div>
              <button
                className="outline-button"
                disabled={!signups.length}
                onClick={exportRoster}
              >
                Export CSV ↓
              </button>
            </div>
            <div className="manual-signup">
              <select
                value={memberId}
                onChange={(event) => setMemberId(event.target.value)}
              >
                <option value="">Choose an eligible user…</option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} · {member.email}
                  </option>
                ))}
              </select>
              <button
                className="button ink"
                disabled={!memberId || busy}
                onClick={addVolunteer}
              >
                Add volunteer
              </button>
            </div>
            {!eventEnded && (
              <div className="attendance-note">
                Attendance controls unlock after{" "}
                {new Date(selected.ends_at).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                .
              </div>
            )}
            <div className="roster-table">
              <table>
                <thead>
                  <tr>
                    <th>Volunteer</th>
                    <th>Instrument</th>
                    <th>Signup</th>
                    <th>Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((signup) => (
                    <tr key={signup.id}>
                      <td>
                        <b>{signup.member_name}</b>
                        <span>{signup.member_email}</span>
                      </td>
                      <td>{signup.member_instrument || "—"}</td>
                      <td>
                        {signup.source === "admin"
                          ? "Added by admin"
                          : "Member signup"}
                      </td>
                      <td>
                        <em
                          className={`attendance-${signup.attendance_status}`}
                        >
                          {signup.attendance_status}
                        </em>
                      </td>
                      <td>
                        <div className="attendance-actions">
                          <button
                            disabled={!eventEnded || busy}
                            className={
                              signup.attendance_status === "attended"
                                ? "selected attended"
                                : "attended"
                            }
                            onClick={() =>
                              attendance(signup.user_id, "attended")
                            }
                          >
                            ✓ Attended
                          </button>
                          <button
                            disabled={!eventEnded || busy}
                            className={
                              signup.attendance_status === "absent"
                                ? "selected absent"
                                : "absent"
                            }
                            onClick={() => attendance(signup.user_id, "absent")}
                          >
                            × Absent
                          </button>
                          <button
                            disabled={busy}
                            className="remove"
                            onClick={() => removeSignup(signup.user_id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!signups.length && (
                    <tr>
                      <td colSpan={5}>No volunteers have signed up.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="event-admin-detail empty-row">
            Select an event to manage it.
          </section>
        )}
      </div>
    </div>
  );
}
