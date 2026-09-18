import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const PROJECT_ID = "inspirewithmusic123";

function adminApp(): App {
  if (getApps().length) return getApp();
  return process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)), projectId: PROJECT_ID })
    : initializeApp({ projectId: PROJECT_ID });
}

export async function verifyGoogleIdToken(idToken: string) {
  const decoded = await getAuth(adminApp()).verifyIdToken(idToken);
  if (!decoded.email || !decoded.email_verified) throw new Error("Google account has no verified email");
  return { email: decoded.email.toLowerCase(), name: (decoded.name as string) || decoded.email.split("@")[0] };
}
