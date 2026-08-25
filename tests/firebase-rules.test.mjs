import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-inspirewithmusic",
    firestore: {
      rules: await readFile(
        new URL("../firestore.rules", import.meta.url),
        "utf8",
      ),
    },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "member-1"), {
      email: "member@example.com",
      name: "Member",
      role: "member",
      status: "active",
      membership_status: "website_user",
    });
    await setDoc(doc(db, "users", "website-1"), {
      email: "website@example.com",
      name: "Website User",
      role: "website_user",
      status: "active",
      membership_status: "website_user",
    });
    await setDoc(doc(db, "users", "official-1"), {
      email: "official@example.com",
      name: "Official",
      role: "member",
      status: "active",
      membership_status: "official_member",
    });
    await setDoc(doc(db, "users", "admin-1"), {
      email: "admin@example.com",
      name: "Admin",
      role: "volunteer_admin",
      status: "active",
      membership_status: "official_member",
    });
    await setDoc(doc(db, "users", "webmaster-1"), {
      email: "inspirewithmusic.org@gmail.com",
      name: "Webmaster",
      role: "webmaster",
      status: "active",
      membership_status: "official_member",
    });
    await setDoc(doc(db, "content", "home.hero_title"), {
      value: "Music in Action",
    });
    await setDoc(doc(db, "service_hours", "hour-existing"), {
      user_id: "member-1",
      event_id: null,
      status: "pending",
      minutes: 60,
      activity: "Workshop",
    });
    await setDoc(doc(db, "events", "event-existing"), {
      title: "Existing event",
      status: "open",
      audience: "all_users",
      capacity: 20,
      signup_count: 0,
      service_minutes: 120,
      starts_at_timestamp: Timestamp.fromDate(new Date("2030-01-01T00:00:00Z")),
      ends_at_timestamp: Timestamp.fromDate(new Date("2030-01-01T02:00:00Z")),
      ends_at: "2030-01-01T02:00:00.000Z",
    });
  });
});

after(async () => {
  await environment?.cleanup();
});

test("public content is readable but only a webmaster can edit it", async () => {
  const publicDb = environment.unauthenticatedContext().firestore();
  assert.equal(
    (
      await assertSucceeds(getDoc(doc(publicDb, "content", "home.hero_title")))
    ).data().value,
    "Music in Action",
  );
  const memberDb = environment
    .authenticatedContext("member-1", { email: "member@example.com" })
    .firestore();
  await assertFails(
    setDoc(doc(memberDb, "content", "home.hero_title"), { value: "Changed" }),
  );
  const webmasterDb = environment
    .authenticatedContext("webmaster-1", {
      email: "inspirewithmusic.org@gmail.com",
      email_verified: true,
    })
    .firestore();
  await assertSucceeds(
    setDoc(doc(webmasterDb, "content", "home.hero_title"), {
      value: "Published",
    }),
  );
});

test("member, volunteer admin, and webmaster capabilities are separated", async () => {
  const memberDb = environment
    .authenticatedContext("member-1", { email: "member@example.com" })
    .firestore();
  await assertSucceeds(
    setDoc(doc(memberDb, "service_hours", "hour-1"), {
      user_id: "member-1",
      event_id: null,
      status: "pending",
      minutes: 90,
    }),
  );
  await assertFails(
    setDoc(doc(memberDb, "events", "event-member"), { title: "Not allowed" }),
  );
  const adminDb = environment
    .authenticatedContext("admin-1", { email: "admin@example.com" })
    .firestore();
  await assertSucceeds(
    setDoc(doc(adminDb, "events", "event-admin"), {
      title: "Community Performance",
      status: "open",
      audience: "all_users",
      capacity: 20,
      signup_count: 0,
      starts_at_timestamp: Timestamp.fromDate(new Date("2031-01-01T00:00:00Z")),
      ends_at_timestamp: Timestamp.fromDate(new Date("2031-01-01T02:00:00Z")),
    }),
  );
  await assertSucceeds(getDoc(doc(adminDb, "service_hours", "hour-existing")));
  await assertSucceeds(
    setDoc(doc(adminDb, "events", "event-existing", "signups", "member-1"), {
      user_id: "member-1",
      member_name: "Member",
      attendance_status: "pending",
    }),
  );
  await assertSucceeds(
    setDoc(doc(adminDb, "service_hours", "event-existing_member-1"), {
      user_id: "member-1",
      event_id: "event-existing",
      source: "event_attendance",
      status: "verified",
      minutes: 120,
      activity: "Existing event",
    }),
  );
  await assertSucceeds(
    updateDoc(doc(adminDb, "events", "event-existing"), { status: "closed" }),
  );
  await assertFails(deleteDoc(doc(adminDb, "events", "event-existing")));
  await assertSucceeds(getDoc(doc(adminDb, "users", "member-1")));
  await assertFails(
    setDoc(doc(adminDb, "content", "about.mission"), { value: "Not allowed" }),
  );
  const webmasterDb = environment
    .authenticatedContext("webmaster-1", {
      email: "inspirewithmusic.org@gmail.com",
      email_verified: true,
    })
    .firestore();
  await assertSucceeds(
    updateDoc(doc(webmasterDb, "service_hours", "hour-existing"), {
      status: "verified",
      verified_by: "webmaster-1",
      verified_at: "now",
      updated_at: "now",
    }),
  );
  await assertSucceeds(
    updateDoc(doc(webmasterDb, "events", "event-existing"), {
      status: "closed",
    }),
  );
  await assertSucceeds(
    updateDoc(doc(webmasterDb, "users", "member-1"), {
      role: "volunteer_admin",
    }),
  );
  await assertFails(
    updateDoc(doc(webmasterDb, "users", "member-1"), { role: "webmaster" }),
  );
});

test("only the verified organization email can bootstrap a webmaster", async () => {
  const verified = environment
    .authenticatedContext("bootstrap-ok", {
      email: "inspirewithmusic.org@gmail.com",
      email_verified: true,
    })
    .firestore();
  await assertSucceeds(
    setDoc(doc(verified, "users", "bootstrap-ok"), {
      email: "inspirewithmusic.org@gmail.com",
      name: "Organization Webmaster",
      role: "webmaster",
      status: "active",
      membership_status: "official_member",
    }),
  );
  await assertFails(
    updateDoc(doc(verified, "users", "bootstrap-ok"), { role: "member" }),
  );
  const unverified = environment
    .authenticatedContext("bootstrap-no", {
      email: "inspirewithmusic.org@gmail.com",
      email_verified: false,
    })
    .firestore();
  await assertFails(
    setDoc(doc(unverified, "users", "bootstrap-no"), {
      email: "inspirewithmusic.org@gmail.com",
      name: "Unverified",
      role: "webmaster",
      status: "active",
      membership_status: "official_member",
    }),
  );
});

test("website users cannot create stories, while approved members can", async () => {
  const websiteUserDb = environment
    .authenticatedContext("website-1", { email: "website@example.com" })
    .firestore();
  await assertFails(
    setDoc(doc(websiteUserDb, "stories", "website-story"), {
      author_id: "website-1",
      status: "submitted",
      title: "No access",
    }),
  );
  const memberDb = environment
    .authenticatedContext("official-1", { email: "official@example.com" })
    .firestore();
  await assertSucceeds(
    setDoc(doc(memberDb, "stories", "member-story"), {
      author_id: "official-1",
      status: "submitted",
      title: "A story",
    }),
  );
});
