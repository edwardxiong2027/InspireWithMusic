"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByxDBmDjou6bsrss1c1XJO42REPczazk8",
  authDomain: "inspirewithmusic123.firebaseapp.com",
  projectId: "inspirewithmusic123",
  storageBucket: "inspirewithmusic123.firebasestorage.app",
  messagingSenderId: "560682527379",
  appId: "1:560682527379:web:ef4130b80c2d25b8a07b66",
};

function firebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export async function signInWithGoogle() {
  const auth = getAuth(firebaseApp());
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user.getIdToken();
}
