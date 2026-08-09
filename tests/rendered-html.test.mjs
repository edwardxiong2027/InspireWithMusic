import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships the real Inspire With Music application", async () => {
  const [page, site, portals, visualEditor, firebase, rules, storageRules, defaults, layout, globalCss, portalCss] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/InspireSite.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/Portals.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/VisualContentEditor.tsx", import.meta.url), "utf8"),
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
  assert.match(firebase, /Promise\.all\(\[getDocs\(hoursQuery\),getDocs\(collection\(firestore,"events"\)\),getDocs\(collection\(firestore,"users"\)\),getDocs\(collection\(firestore,"stories"\)\)\]\)/);
  assert.match(portals, /Sign in with Google/);
  assert.match(firebase, /runTransaction/);
  assert.match(firebase, /uploadBytes/);
  assert.match(rules, /volunteer_admin/);
  assert.match(rules, /email_verified/);
  assert.match(rules, /request\.auth\.token\.email == "inspirewithmusic\.org@gmail\.com"/);
  assert.match(storageRules, /request\.resource\.contentType\.matches/);
  assert.match(defaults, /MUSIC BEYOND BORDERS/);
  assert.match(defaults, /impact\.music_shared/);
  assert.match(defaults, /gallery/);
  assert.match(site, /program-focus-hero/);
  assert.match(portals, /VisualContentEditor/);
  assert.match(visualEditor, /VISUAL WEBSITE EDITOR/);
  assert.match(visualEditor, /IWM_CMS_DRAFT/);
  assert.match(visualEditor, /Upload a new image/);
  assert.match(visualEditor, /ProgramsInspector/);
  assert.match(site, /IWM_CMS_SELECT/);
  assert.match(defaults, /home\.story_image/);
  assert.match(defaults, /donate\.materials_image/);
  assert.doesNotMatch(portals, /Everything is/);
  assert.match(layout, /inspirewithmusic\.org/);
  assert.match(site, /aria-controls="primary-navigation"/);
  assert.match(portals, /workspace-menu-open/);
  assert.match(globalCss, /@media\(max-width:480px\)/);
  assert.match(portalCss, /workspace-menu-button/);
  assert.match(portalCss, /Comfortable dashboard type scale/);
  assert.match(portalCss, /\.table-card table\{font-size:13px/);
  assert.match(portalCss, /\.workspace-form label.*font-size:11px/);
  assert.doesNotMatch(page + site + portals + firebase + layout, /Preview mode: any email|codex-preview|SkeletonPreview|sampleEvents|AWS|PostgreSQL|PGlite/);
});
