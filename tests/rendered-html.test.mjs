import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships the real Inspire With Music application", async () => {
  const [page, site, portals, auth, events, layout, globalCss, portalCss] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/InspireSite.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/Portals.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/events/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/portal.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /InspireSite/);
  assert.match(site, /Music in Action/);
  assert.match(portals, /\/api\/auth\/login/);
  assert.match(portals, /\/api\/events/);
  assert.match(portals, /\/api\/hours/);
  assert.match(portals, /\/api\/content/);
  assert.match(auth, /timingSafeEqual/);
  assert.match(auth, /httpOnly:\s*true/);
  assert.match(events, /requireUser\(\["volunteer_admin","webmaster"\]\)/);
  assert.match(layout, /inspirewithmusic\.org/);
  assert.match(site, /aria-controls="primary-navigation"/);
  assert.match(portals, /workspace-menu-open/);
  assert.match(globalCss, /@media\(max-width:480px\)/);
  assert.match(portalCss, /workspace-menu-button/);
  assert.doesNotMatch(page + site + portals + layout, /Preview mode: any email|codex-preview|SkeletonPreview/);
});
