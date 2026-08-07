import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships the Inspire With Music experience", async () => {
  const [page, site, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site/InspireSite.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /InspireSite/);
  assert.match(site, /Music in Action/);
  assert.match(site, /Volunteer Admin/);
  assert.match(site, /Webmaster/);
  assert.match(layout, /inspirewithmusic\.org/);
  assert.doesNotMatch(page + site + layout, /codex-preview|SkeletonPreview/);
});
