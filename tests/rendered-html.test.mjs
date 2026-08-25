import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships the real Inspire With Music application", async () => {
  const [
    page,
    site,
    portals,
    adminEvents,
    visualEditor,
    firebase,
    rules,
    storageRules,
    defaults,
    layout,
    globalCss,
    portalCss,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/InspireSite.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/Portals.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/AdminEvents.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/site/VisualContentEditor.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/firebase.ts", import.meta.url), "utf8"),
    readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
    readFile(new URL("../storage.rules", import.meta.url), "utf8"),
    readFile(new URL("../lib/content-defaults.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/portal.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /InspireSite/);
  assert.match(site, /Music in Action/);
  assert.match(firebase, /inspirewithmusic123/);
  assert.match(firebase, /authDomain: "inspirewithmusic123\.firebaseapp\.com"/);
  assert.match(firebase, /signInWithEmailAndPassword/);
  assert.match(firebase, /signInWithPopup/);
  assert.doesNotMatch(firebase, /signInWithRedirect/);
  assert.doesNotMatch(firebase, /getIdToken\(true\)/);
  assert.match(firebase, /profileCache/);
  assert.match(
    firebase,
    /const \[hours, events, users, stories\] = await Promise\.all/,
  );
  assert.match(portals, /Sign in with Google/);
  assert.match(firebase, /runTransaction/);
  assert.match(firebase, /uploadBytes/);
  assert.match(rules, /volunteer_admin/);
  assert.match(rules, /email_verified/);
  assert.match(
    rules,
    /request\.auth\.token\.email == "inspirewithmusic\.org@gmail\.com"/,
  );
  assert.match(storageRules, /request\.resource\.contentType\.matches/);
  assert.match(defaults, /MUSIC BEYOND BORDERS/);
  assert.match(defaults, /impact\.music_shared/);
  assert.match(defaults, /gallery/);
  assert.match(site, /program-focus-hero/);
  assert.match(portals, /VisualContentEditor/);
  assert.match(portals, /AdminEvents/);
  assert.match(adminEvents, /Export CSV/);
  assert.match(adminEvents, /Attendance confirmed and service hours awarded/);
  assert.match(adminEvents, /Add volunteer/);
  assert.match(adminEvents, /Official members only/);
  assert.match(adminEvents, /End time must be after/);
  assert.match(portals, /View event details/);
  assert.match(portals, /To become an official Inspire With Music member/);
  assert.match(portals, /story-media/);
  assert.match(portals, /optimizeStoryImage/);
  assert.match(portals, /Story image/);
  assert.match(portals, /story-review-image/);
  assert.match(portals, /Save edits/);
  assert.match(portals, /Delete this story permanently/);
  assert.match(portals, /Media categories/);
  assert.match(portals, /Add category/);
  assert.match(portals, /Edit details/);
  assert.match(portals, /Delete/);
  assert.match(firebase, /media_categories/);
  assert.match(firebase, /categoryId/);
  assert.match(firebase, /safeStoryCover/);
  assert.match(portals, /Remove image/);
  assert.match(portals, /Replace image/);
  assert.match(portals, /Open uploaded image/);
  assert.match(firebase, /requireSession\(\["member"\]\)/);
  assert.match(firebase, /status === "rejected"/);
  assert.match(firebase, /membership_status/);
  assert.match(firebase, /This event is no longer open for signup/);
  assert.match(storageRules, /story-submissions/);
  assert.match(portals, /Event hours appear automatically/);
  assert.match(firebase, /attendance_status/);
  assert.match(firebase, /event_attendance/);
  assert.match(visualEditor, /VISUAL WEBSITE EDITOR/);
  assert.match(visualEditor, /IWM_CMS_DRAFT/);
  assert.match(visualEditor, /Upload a new image/);
  assert.match(visualEditor, /ProgramsInspector/);
  assert.match(site, /IWM_CMS_SELECT/);
  assert.match(defaults, /home\.story_image/);
  assert.match(defaults, /donate\.materials_image/);
  assert.match(defaults, /site\.tagline/);
  assert.match(site, /YOUTH IN SERVICE/);
  assert.doesNotMatch(site, /<span>0\{i \+ 1\}<\/span><b>\{item\.icon\}/);
  assert.doesNotMatch(portals, /Everything is/);
  assert.match(layout, /inspirewithmusic\.org/);
  assert.match(site, /aria-controls="primary-navigation"/);
  assert.match(portals, /workspace-menu-open/);
  assert.match(globalCss, /@media\(max-width:480px\)/);
  assert.match(portalCss, /workspace-menu-button/);
  assert.match(portalCss, /Comfortable dashboard type scale/);
  assert.match(portalCss, /\.table-card table\s*\{\s*font-size: 13px/);
  assert.match(portalCss, /\.workspace-form label[\s\S]*font-size: 11px/);
  assert.doesNotMatch(
    page + site + portals + firebase + layout,
    /Preview mode: any email|codex-preview|SkeletonPreview|sampleEvents|AWS|PostgreSQL|PGlite/,
  );
});
