"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { defaultContentEntries, defaultContentMap } from "./content-defaults";
import type { EventRecord, EventSignup, Role, ServiceHourRecord, SessionUser, UserStatus } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyByxDBmDjou6bsrss1c1XJO42REPczazk8",
  // Keep OAuth on Firebase's provisioned helper domain. The public site still
  // runs at inspirewithmusic.org, while this callback is already authorized by
  // the Google client that Firebase created for this project.
  authDomain: "inspirewithmusic123.firebaseapp.com",
  projectId: "inspirewithmusic123",
  storageBucket: "inspirewithmusic123.firebasestorage.app",
  messagingSenderId: "560682527379",
  appId: "1:560682527379:web:ef4130b80c2d25b8a07b66",
};

const WEBMASTER_BOOTSTRAP_EMAIL = "inspirewithmusic.org@gmail.com";
const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export const firebaseStorage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt:"select_account"});
const profileCache = new Map<string, SessionUser>();
const profileLoads = new Map<string, Promise<SessionUser>>();
let seedScheduled = false;

if (typeof window !== "undefined") void setPersistence(firebaseAuth, browserLocalPersistence);

type Json = Record<string, unknown>;
type FirebaseApiOptions = RequestInit & { body?: BodyInit | null };

function now() { return new Date().toISOString(); }
function asJson(options?: FirebaseApiOptions): Json {
  if (!options?.body || options.body instanceof FormData) return {};
  return JSON.parse(String(options.body)) as Json;
}
function withId<T>(id: string, data: DocumentData) { return { id, ...data } as T; }
function sortNewest<T extends { created_at?: string }>(items: T[]) { return items.sort((a,b)=>(b.created_at??"").localeCompare(a.created_at??"")); }

function friendlyError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as {code:unknown}).code) : "";
  const messages: Record<string,string> = {
    "auth/email-already-in-use": "An account already exists for this email.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked Google sign-in. Please allow pop-ups and try again.",
    "auth/account-exists-with-different-credential": "An account already exists for this email. Sign in with its original method first.",
    "auth/weak-password": "Choose a stronger password with at least 10 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "permission-denied": "You do not have permission to perform this action.",
    "storage/unauthorized": "Only webmasters can upload website media.",
  };
  if (messages[code]) return new Error(messages[code]);
  return error instanceof Error ? error : new Error("The request could not be completed.");
}

async function authUser(): Promise<User|null> {
  if (firebaseAuth.currentUser) return firebaseAuth.currentUser;
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, user => { unsubscribe(); resolve(user); });
  });
}

function sessionFrom(user: User, data: DocumentData): SessionUser {
  return {
    id: user.uid,
    email: user.email ?? String(data.email ?? ""),
    name: String(data.name ?? user.displayName ?? "Member"),
    phone: String(data.phone ?? ""),
    instrument: String(data.instrument ?? ""),
    role: (data.role ?? "member") as Role,
    status: (data.status ?? "active") as UserStatus,
  };
}

async function ensureProfile(user: User, initial?: {name?:string;instrument?:string}) {
  const cached = profileCache.get(user.uid);
  if (cached) return cached;
  const pending = profileLoads.get(user.uid);
  if (pending) return pending;

  const load = (async () => {
    const profileRef = doc(firestore, "users", user.uid);
    const snapshot = await getDoc(profileRef);
    if (snapshot.exists()) return sessionFrom(user, snapshot.data());
    const isBootstrap = user.email?.toLowerCase() === WEBMASTER_BOOTSTRAP_EMAIL;
    if (isBootstrap && !user.emailVerified) throw new Error("Verify the email sent to inspirewithmusic.org@gmail.com, then sign in again to activate the webmaster account.");
    const profile = {
      email: user.email ?? "",
      name: initial?.name?.trim() || user.email?.split("@")[0] || "Member",
      phone: "",
      instrument: initial?.instrument?.trim() || "",
      role: isBootstrap ? "webmaster" : "member",
      status: "active",
      created_at: now(),
      updated_at: now(),
    };
    await setDoc(profileRef, profile);
    if (isBootstrap) scheduleFirebaseSeed();
    return sessionFrom(user, profile);
  })();
  profileLoads.set(user.uid, load);
  try {
    const session = await load;
    profileCache.set(user.uid, session);
    return session;
  } finally {
    profileLoads.delete(user.uid);
  }
}

async function finishGoogleLogin(user: User) {
  return ensureProfile(user,{name:user.displayName??""});
}

export async function completeGoogleRedirectLogin() {
  try {
    const result = await getRedirectResult(firebaseAuth);
    return result ? await finishGoogleLogin(result.user) : null;
  } catch (error) { throw friendlyError(error); }
}

export async function loginWithGoogle() {
  try {
    const credential = await signInWithPopup(firebaseAuth,googleProvider);
    return await finishGoogleLogin(credential.user);
  } catch (error) { throw friendlyError(error); }
}

async function requireSession(roles?: Role[]) {
  const user = await authUser();
  if (!user) throw new Error("Please sign in to continue.");
  const session = await ensureProfile(user);
  if (session.status !== "active") { await signOut(firebaseAuth); throw new Error("This account is not active."); }
  if (roles && !roles.includes(session.role)) throw new Error("You do not have permission to perform this action.");
  return session;
}

async function ensureFirebaseSeed() {
  await requireSession(["webmaster"]);
  const contentSnapshot = await getDocs(collection(firestore,"content"));
  const existing = new Set(contentSnapshot.docs.map(item=>item.id));
  const settingsSnapshot = await getDoc(doc(firestore,"settings","site"));
  const batch = writeBatch(firestore);
  for (const entry of defaultContentEntries) if (!existing.has(entry.key)) batch.set(doc(firestore,"content",entry.key), {...entry,updated_at:now()});
  if (!settingsSnapshot.exists()) batch.set(doc(firestore,"settings","site"), {project_id:firebaseConfig.projectId,storage_bucket:firebaseConfig.storageBucket,from_email:"hello@inspirewithmusic.org",updated_at:now()});
  await batch.commit();
}

function scheduleFirebaseSeed() {
  if (seedScheduled || typeof window === "undefined") return;
  seedScheduled = true;
  window.setTimeout(() => {
    void ensureFirebaseSeed().catch(() => { seedScheduled = false; });
  }, 1500);
}

export async function getPublicContent() {
  try {
    const snapshot = await getDocs(collection(firestore,"content"));
    return {...defaultContentMap,...Object.fromEntries(snapshot.docs.map(item=>[item.id,String(item.data().value??"")]))};
  } catch { return defaultContentMap; }
}

export async function getPublicStories() {
  try {
    const snapshot = await getDocs(query(collection(firestore,"stories"),where("status","==","published")));
    return sortNewest(snapshot.docs.map(item=>withId<{id:string;title:string;excerpt:string;cover_url:string;author_name:string;published_at:string;created_at:string}>(item.id,item.data())));
  } catch { return []; }
}

export async function submitContact(input: Json) {
  await addDoc(collection(firestore,"contact_messages"), {...input,status:"new",created_at:now()});
}

export async function subscribeNewsletter(email: string) {
  await addDoc(collection(firestore,"newsletter_subscribers"), {email:email.trim().toLowerCase(),status:"active",created_at:now()});
}

async function contentResponse() {
  const snapshot = await getDocs(collection(firestore,"content"));
  const remote = new Map(snapshot.docs.map(item=>[item.id,item.data()]));
  const entries = defaultContentEntries.map(entry=>remote.has(entry.key)?{...entry,...remote.get(entry.key),key:entry.key}:entry);
  return {entries,content:Object.fromEntries(entries.map(entry=>[entry.key,entry.value]))};
}

async function eventResponse() {
  const snapshot = await getDocs(collection(firestore,"events"));
  const user = await authUser();
  const events = await Promise.all(snapshot.docs.map(async item => {
    const data = withId<EventRecord>(item.id,item.data());
    if (!user) return data;
    const signup = await getDoc(doc(firestore,"events",item.id,"signups",user.uid));
    return {...data,is_signed_up:signup.exists()};
  }));
  return {events:events.sort((a,b)=>a.starts_at.localeCompare(b.starts_at))};
}

async function hoursResponse() {
  const session = await requireSession();
  const source = session.role === "member"
    ? query(collection(firestore,"service_hours"),where("user_id","==",session.id))
    : collection(firestore,"service_hours");
  const snapshot = await getDocs(source);
  return {hours:sortNewest(snapshot.docs.map(item=>withId<ServiceHourRecord & {created_at:string}>(item.id,item.data())))};
}

export async function firebaseApi<T>(url: string, options?: FirebaseApiOptions): Promise<T> {
  const method = options?.method?.toUpperCase() ?? "GET";
  const input = asJson(options);
  try {
    if (url === "/api/auth/session") {
      const user = await authUser();
      return {user:user?await ensureProfile(user):null} as T;
    }
    if (url === "/api/auth/login" && method === "POST") {
      const credential = await signInWithEmailAndPassword(firebaseAuth,String(input.email??""),String(input.password??""));
      const session = await ensureProfile(credential.user);
      return {user:session} as T;
    }
    if (url === "/api/auth/signup" && method === "POST") {
      const email = String(input.email??"").trim().toLowerCase();
      const credential = await createUserWithEmailAndPassword(firebaseAuth,email,String(input.password??""));
      if (email === WEBMASTER_BOOTSTRAP_EMAIL) {
        await sendEmailVerification(credential.user);
        await signOut(firebaseAuth);
        return {user:null,verificationRequired:true} as T;
      }
      const session = await ensureProfile(credential.user,{name:String(input.name??""),instrument:String(input.instrument??"")});
      return {user:session} as T;
    }
    if (url === "/api/auth/logout" && method === "POST") { profileCache.clear(); profileLoads.clear(); await signOut(firebaseAuth); return {ok:true} as T; }

    if (url === "/api/content" && method === "GET") return await contentResponse() as T;
    if (url === "/api/content" && method === "PUT") {
      await requireSession(["webmaster"]);
      const batch = writeBatch(firestore);
      for (const change of (input.entries as Array<{key:string;value:string}>)) {
        const definition = defaultContentEntries.find(entry=>entry.key===change.key);
        if (!definition) continue;
        batch.set(doc(firestore,"content",change.key),{...definition,value:String(change.value),updated_at:now()});
      }
      await batch.commit(); return {ok:true} as T;
    }

    if (url === "/api/events" && method === "GET") return await eventResponse() as T;
    if (url === "/api/events" && method === "POST") {
      const session = await requireSession(["volunteer_admin","webmaster"]);
      if(new Date(String(input.endsAt)).getTime()<=new Date(String(input.startsAt)).getTime())throw new Error("Event end time must be after its start time.");
      if(Number(input.capacity??0)<1||Number(input.serviceMinutes??0)<1)throw new Error("Capacity and service minutes must be positive.");
      const created = await addDoc(collection(firestore,"events"),{title:String(input.title??""),description:String(input.description??""),location:String(input.location??""),starts_at:String(input.startsAt??""),ends_at:String(input.endsAt??""),capacity:Number(input.capacity??20),service_minutes:Number(input.serviceMinutes??0),status:String(input.status??"open"),signup_count:0,created_by:session.id,created_at:now(),updated_at:now()});
      return {id:created.id} as T;
    }
    const signupMatch = url.match(/^\/api\/events\/([^/]+)\/signup$/);
    if (signupMatch) {
      const session = await requireSession(["member"]); const eventId=signupMatch[1];
      const eventRef=doc(firestore,"events",eventId); const signupRef=doc(firestore,"events",eventId,"signups",session.id);
      await runTransaction(firestore,async transaction=>{const [eventSnap,signupSnap]=await Promise.all([transaction.get(eventRef),transaction.get(signupRef)]);if(!eventSnap.exists())throw new Error("Event not found.");const event=eventSnap.data();const count=Number(event.signup_count??0);if(method==="POST"){if(signupSnap.exists())return;if(event.status!=="open")throw new Error("This event is not open for signup.");if(count>=Number(event.capacity))throw new Error("This event is full.");transaction.set(signupRef,{user_id:session.id,member_name:session.name,member_email:session.email,member_instrument:session.instrument??"",source:"member",attendance_status:"pending",created_at:now(),updated_at:now()});transaction.update(eventRef,{signup_count:count+1,updated_at:now()});}else{if(!signupSnap.exists())return;if(event.status!=="open"||Date.now()>=new Date(String(event.starts_at)).getTime())throw new Error("Online cancellation is closed. Please contact an administrator.");transaction.delete(signupRef);transaction.update(eventRef,{signup_count:Math.max(0,count-1),updated_at:now()});}});
      return {ok:true} as T;
    }
    const signupListMatch=url.match(/^\/api\/events\/([^/]+)\/signups$/);
    if(signupListMatch){
      await requireSession(["volunteer_admin","webmaster"]);const eventId=signupListMatch[1];
      if(method==="GET"){const [signupSnapshot,userSnapshot]=await Promise.all([getDocs(collection(firestore,"events",eventId,"signups")),getDocs(collection(firestore,"users"))]);return {signups:signupSnapshot.docs.map(item=>withId<EventSignup>(item.id,item.data())).sort((a,b)=>a.member_name.localeCompare(b.member_name)),members:userSnapshot.docs.map(item=>withId<SessionUser>(item.id,item.data())).filter(item=>item.status==="active"&&item.role==="member").sort((a,b)=>a.name.localeCompare(b.name))} as T;}
      if(method==="POST"){const userId=String(input.userId??"");const [memberSnap,eventSnap]=await Promise.all([getDoc(doc(firestore,"users",userId)),getDoc(doc(firestore,"events",eventId))]);if(!memberSnap.exists()||!eventSnap.exists())throw new Error("Member or event not found.");const member=memberSnap.data();const eventRef=eventSnap.ref;const signupRef=doc(firestore,"events",eventId,"signups",userId);await runTransaction(firestore,async transaction=>{const [currentEvent,currentSignup]=await Promise.all([transaction.get(eventRef),transaction.get(signupRef)]);if(currentSignup.exists())return;if(!currentEvent.exists())throw new Error("Event not found.");const event=currentEvent.data();const count=Number(event.signup_count??0);if(count>=Number(event.capacity))throw new Error("This event is full. Increase capacity before adding another volunteer.");transaction.set(signupRef,{user_id:userId,member_name:String(member.name??"Member"),member_email:String(member.email??""),member_instrument:String(member.instrument??""),source:"admin",attendance_status:"pending",created_at:now(),updated_at:now()});transaction.update(eventRef,{signup_count:count+1,updated_at:now()});});return {ok:true} as T;}
    }
    const signupAdminMatch=url.match(/^\/api\/events\/([^/]+)\/signups\/([^/]+)$/);
    if(signupAdminMatch){
      const reviewer=await requireSession(["volunteer_admin","webmaster"]);const [,eventId,userId]=signupAdminMatch;const eventRef=doc(firestore,"events",eventId);const signupRef=doc(firestore,"events",eventId,"signups",userId);const hourRef=doc(firestore,"service_hours",`${eventId}_${userId}`);
      if(method==="PATCH"){const attendance=String(input.attendance);if(!["pending","attended","absent"].includes(attendance))throw new Error("Choose a valid attendance status.");await runTransaction(firestore,async transaction=>{const [eventSnap,signupSnap,hourSnap]=await Promise.all([transaction.get(eventRef),transaction.get(signupRef),transaction.get(hourRef)]);if(!eventSnap.exists()||!signupSnap.exists())throw new Error("Event signup not found.");const event=eventSnap.data();if(Date.now()<new Date(String(event.ends_at)).getTime())throw new Error("Attendance can only be confirmed after the event ends.");const signup=signupSnap.data();transaction.update(signupRef,{attendance_status:attendance,attendance_confirmed_by:reviewer.id,attendance_confirmed_at:now(),updated_at:now()});if(attendance==="attended"){const minutes=Number(event.service_minutes??0);if(minutes<=0)throw new Error("Set positive service minutes on the event before awarding attendance.");transaction.set(hourRef,{user_id:userId,event_id:eventId,activity:String(event.title??"Volunteer event"),service_date:String(event.starts_at??"").slice(0,10),minutes,notes:`Attendance confirmed for ${String(event.title??"event")}`,status:"verified",member_name:String(signup.member_name??"Member"),member_email:String(signup.member_email??""),source:"event_attendance",verified_by:reviewer.id,verified_at:now(),updated_at:now(),created_at:hourSnap.exists()?String(hourSnap.data().created_at??now()):now()});}else if(hourSnap.exists()){transaction.update(hourRef,{status:"rejected",notes:attendance==="absent"?"Marked absent by administrator":"Attendance confirmation reset",verified_by:reviewer.id,verified_at:now(),updated_at:now()});}});return {ok:true} as T;}
      if(method==="DELETE"){await runTransaction(firestore,async transaction=>{const [eventSnap,signupSnap,hourSnap]=await Promise.all([transaction.get(eventRef),transaction.get(signupRef),transaction.get(hourRef)]);if(!signupSnap.exists())return;transaction.delete(signupRef);if(eventSnap.exists())transaction.update(eventRef,{signup_count:Math.max(0,Number(eventSnap.data().signup_count??0)-1),updated_at:now()});if(hourSnap.exists())transaction.update(hourRef,{status:"rejected",notes:"Signup removed by administrator",verified_by:reviewer.id,verified_at:now(),updated_at:now()});});return {ok:true} as T;}
    }
    const eventMatch = url.match(/^\/api\/events\/([^/]+)$/);
    if (eventMatch) {
      const session=await requireSession(["volunteer_admin","webmaster"]); const eventRef=doc(firestore,"events",eventMatch[1]);
      if(method==="PATCH"){const existing=await getDoc(eventRef);if(!existing.exists())throw new Error("Event not found.");const current=existing.data();const startsAt=input.startsAt!==undefined?String(input.startsAt):String(current.starts_at);const endsAt=input.endsAt!==undefined?String(input.endsAt):String(current.ends_at);const capacity=input.capacity!==undefined?Number(input.capacity):Number(current.capacity);const serviceMinutes=input.serviceMinutes!==undefined?Number(input.serviceMinutes):Number(current.service_minutes);if(new Date(endsAt).getTime()<=new Date(startsAt).getTime())throw new Error("Event end time must be after its start time.");if(capacity<Number(current.signup_count??0))throw new Error("Capacity cannot be lower than the current signup count.");if(capacity<1||serviceMinutes<1)throw new Error("Capacity and service minutes must be positive.");const change:Json={updated_at:now()};if(input.title!==undefined)change.title=String(input.title);if(input.description!==undefined)change.description=String(input.description);if(input.location!==undefined)change.location=String(input.location);if(input.startsAt!==undefined)change.starts_at=startsAt;if(input.endsAt!==undefined)change.ends_at=endsAt;if(input.capacity!==undefined)change.capacity=capacity;if(input.serviceMinutes!==undefined)change.service_minutes=serviceMinutes;if(input.status!==undefined)change.status=String(input.status);await updateDoc(eventRef,change);return {ok:true} as T;}
      if(method==="DELETE"){if(session.role!=="webmaster")throw new Error("Only the Webmaster can delete events.");const signups=await getDocs(collection(firestore,"events",eventMatch[1],"signups"));const batch=writeBatch(firestore);signups.docs.forEach(item=>batch.delete(item.ref));batch.delete(eventRef);await batch.commit();return {ok:true} as T;}
    }

    if (url === "/api/hours" && method === "GET") return await hoursResponse() as T;
    if (url === "/api/hours" && method === "POST") {
      const session=await requireSession(["member"]);const created=await addDoc(collection(firestore,"service_hours"),{user_id:session.id,event_id:null,activity:String(input.activity??""),service_date:String(input.serviceDate??""),minutes:Number(input.minutes??0),notes:String(input.notes??""),status:"pending",member_name:session.name,member_email:session.email,source:"member_submission",created_at:now(),updated_at:now()});return {id:created.id} as T;
    }
    const hourMatch=url.match(/^\/api\/hours\/([^/]+)$/);
    if(hourMatch&&method==="PATCH"){const reviewer=await requireSession(["webmaster"]);await updateDoc(doc(firestore,"service_hours",hourMatch[1]),{status:String(input.status),verified_by:reviewer.id,verified_at:now(),updated_at:now()});return {ok:true} as T;}

    if(url==="/api/profile"&&method==="PATCH"){const session=await requireSession();const updated={...session,name:String(input.name??session.name),phone:String(input.phone??""),instrument:String(input.instrument??"")};await updateDoc(doc(firestore,"users",session.id),{name:updated.name,phone:updated.phone,instrument:updated.instrument,updated_at:now()});profileCache.set(session.id,updated);return {ok:true} as T;}
    if(url==="/api/users"&&method==="GET"){
      await requireSession(["webmaster"]);const [usersSnapshot,hoursSnapshot]=await Promise.all([getDocs(collection(firestore,"users")),getDocs(query(collection(firestore,"service_hours"),where("status","==","verified")))]);const totals=new Map<string,number>();hoursSnapshot.docs.forEach(item=>totals.set(String(item.data().user_id),(totals.get(String(item.data().user_id))??0)+Number(item.data().minutes??0)));return {users:usersSnapshot.docs.map(item=>({...withId<SessionUser&{created_at:string}>(item.id,item.data()),verified_minutes:totals.get(item.id)??0}))} as T;
    }
    const userMatch=url.match(/^\/api\/users\/([^/]+)$/);
    if(userMatch&&method==="PATCH"){await requireSession(["webmaster"]);const change:Json={updated_at:now()};if(input.status)change.status=input.status;if(input.role)change.role=input.role;await updateDoc(doc(firestore,"users",userMatch[1]),change);return {ok:true} as T;}

    if(url==="/api/stories"&&method==="GET"){
      const session=await requireSession();let source;if(session.role==="webmaster")source=collection(firestore,"stories");else if(session.role==="member")source=query(collection(firestore,"stories"),where("author_id","==",session.id));else source=query(collection(firestore,"stories"),where("status","==","published"));const snapshot=await getDocs(source);return {stories:sortNewest(snapshot.docs.map(item=>withId<{id:string;created_at:string}&Json>(item.id,item.data())))} as T;
    }
    if(url==="/api/stories"&&method==="POST"){const session=await requireSession(["member"]);const created=await addDoc(collection(firestore,"stories"),{author_id:session.id,author_name:session.name,title:String(input.title??""),excerpt:String(input.excerpt??""),body:String(input.body??""),cover_url:String(input.coverUrl??""),status:"submitted",created_at:now(),updated_at:now(),published_at:""});return {id:created.id} as T;}
    const storyMatch=url.match(/^\/api\/stories\/([^/]+)$/);
    if(storyMatch&&method==="PATCH"){const reviewer=await requireSession(["webmaster"]);const status=String(input.status);await updateDoc(doc(firestore,"stories",storyMatch[1]),{status,reviewer_id:reviewer.id,published_at:status==="published"?now():"",updated_at:now()});return {ok:true} as T;}

    if(url==="/api/media"&&method==="GET"){await requireSession(["webmaster"]);const snapshot=await getDocs(collection(firestore,"media_assets"));return {assets:sortNewest(snapshot.docs.map(item=>withId<{id:string;created_at:string}&Json>(item.id,item.data())))} as T;}
    if(url==="/api/media"&&method==="POST"&&options?.body instanceof FormData){const session=await requireSession(["webmaster"]);const file=options.body.get("file");if(!(file instanceof File))throw new Error("Choose an image to upload.");if(file.size>10*1024*1024)throw new Error("Images must be smaller than 10 MB.");const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");const storageRef=ref(firebaseStorage,`media/${crypto.randomUUID()}-${safe}`);await uploadBytes(storageRef,file,{contentType:file.type});const publicUrl=await getDownloadURL(storageRef);const created=await addDoc(collection(firestore,"media_assets"),{filename:file.name,public_url:publicUrl,storage_path:storageRef.fullPath,mime_type:file.type,byte_size:file.size,alt_text:String(options.body.get("altText")??""),uploaded_by:session.id,created_at:now()});return {id:created.id,public_url:publicUrl} as T;}

    if(url==="/api/messages"&&method==="GET"){await requireSession(["webmaster"]);const snapshot=await getDocs(collection(firestore,"contact_messages"));return {messages:sortNewest(snapshot.docs.map(item=>withId<{id:string;created_at:string}&Json>(item.id,item.data())))} as T;}
    if(url==="/api/settings"&&method==="GET"){await requireSession(["webmaster"]);const snapshot=await getDoc(doc(firestore,"settings","site"));return {settings:snapshot.data()??{},database:{provider:"Cloud Firestore",connected:true},storage:{provider:"Cloud Storage for Firebase"}} as T;}
    if(url==="/api/settings"&&method==="PUT"){await requireSession(["webmaster"]);await setDoc(doc(firestore,"settings","site"),{...(input.settings as Json),updated_at:now()},{merge:true});return {ok:true} as T;}

    if(url==="/api/dashboard"){
      const session=await requireSession();
      const hoursQuery=session.role==="member"?query(collection(firestore,"service_hours"),where("user_id","==",session.id)):collection(firestore,"service_hours");
      if(session.role==="member"){
        const hours=await getDocs(hoursQuery);const verified=hours.docs.filter(item=>item.data().status==="verified").reduce((sum,item)=>sum+Number(item.data().minutes??0),0);const pending=hours.docs.filter(item=>item.data().status==="pending").reduce((sum,item)=>sum+Number(item.data().minutes??0),0);return {user:session,totals:{verified_minutes:verified,pending_minutes:pending}} as T;
      }
      if(session.role==="volunteer_admin"){
        const [hours,events]=await Promise.all([getDocs(hoursQuery),getDocs(collection(firestore,"events"))]);const verified=hours.docs.filter(item=>item.data().status==="verified").reduce((sum,item)=>sum+Number(item.data().minutes??0),0);return {user:session,stats:{members:0,verified_minutes:verified,events:events.size,stories_pending:0,hours_pending:hours.docs.filter(item=>item.data().status==="pending").length}} as T;
      }
      const [hours,events,users,stories]=await Promise.all([getDocs(hoursQuery),getDocs(collection(firestore,"events")),getDocs(collection(firestore,"users")),getDocs(collection(firestore,"stories"))]);const verified=hours.docs.filter(item=>item.data().status==="verified").reduce((sum,item)=>sum+Number(item.data().minutes??0),0);return {user:session,stats:{members:users.docs.filter(item=>item.data().status==="active").length,verified_minutes:verified,events:events.size,stories_pending:stories.docs.filter(item=>item.data().status==="submitted").length,hours_pending:hours.docs.filter(item=>item.data().status==="pending").length}} as T;
    }
    throw new Error(`Unsupported Firebase operation: ${method} ${url}`);
  } catch (error) { throw friendlyError(error); }
}
