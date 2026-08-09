import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-inspirewithmusic",
    firestore: { rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8") },
  });
  await environment.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db,"users","member-1"),{email:"member@example.com",name:"Member",role:"member",status:"active"});
    await setDoc(doc(db,"users","admin-1"),{email:"admin@example.com",name:"Admin",role:"volunteer_admin",status:"active"});
    await setDoc(doc(db,"users","webmaster-1"),{email:"webmaster@example.com",name:"Webmaster",role:"webmaster",status:"active"});
    await setDoc(doc(db,"content","home.hero_title"),{value:"Music in Action"});
  });
});

after(async () => { await environment?.cleanup(); });

test("public content is readable but only a webmaster can edit it", async () => {
  const publicDb = environment.unauthenticatedContext().firestore();
  assert.equal((await assertSucceeds(getDoc(doc(publicDb,"content","home.hero_title")))).data().value,"Music in Action");
  const memberDb = environment.authenticatedContext("member-1",{email:"member@example.com"}).firestore();
  await assertFails(setDoc(doc(memberDb,"content","home.hero_title"),{value:"Changed"}));
  const webmasterDb = environment.authenticatedContext("webmaster-1",{email:"webmaster@example.com"}).firestore();
  await assertSucceeds(setDoc(doc(webmasterDb,"content","home.hero_title"),{value:"Published"}));
});

test("member, volunteer admin, and webmaster capabilities are separated", async () => {
  const memberDb = environment.authenticatedContext("member-1",{email:"member@example.com"}).firestore();
  await assertSucceeds(setDoc(doc(memberDb,"service_hours","hour-1"),{user_id:"member-1",status:"pending",minutes:90}));
  await assertFails(setDoc(doc(memberDb,"events","event-member"),{title:"Not allowed"}));
  const adminDb = environment.authenticatedContext("admin-1",{email:"admin@example.com"}).firestore();
  await assertSucceeds(setDoc(doc(adminDb,"events","event-admin"),{title:"Community Performance",status:"open",capacity:20,signup_count:0}));
  await assertFails(setDoc(doc(adminDb,"content","about.mission"),{value:"Not allowed"}));
});

test("only the verified organization email can bootstrap a webmaster", async () => {
  const verified = environment.authenticatedContext("bootstrap-ok",{email:"inspirewithmusic.org@gmail.com",email_verified:true}).firestore();
  await assertSucceeds(setDoc(doc(verified,"users","bootstrap-ok"),{email:"inspirewithmusic.org@gmail.com",name:"Organization Webmaster",role:"webmaster",status:"active"}));
  const unverified = environment.authenticatedContext("bootstrap-no",{email:"inspirewithmusic.org@gmail.com",email_verified:false}).firestore();
  await assertFails(setDoc(doc(unverified,"users","bootstrap-no"),{email:"inspirewithmusic.org@gmail.com",name:"Unverified",role:"webmaster",status:"active"}));
});
