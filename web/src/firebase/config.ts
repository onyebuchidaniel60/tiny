import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

export const isEmulatorMode = String(env.VITE_FUNCTIONS_EMULATOR).toLowerCase() === 'true';
export const demoEmail = env.VITE_DEMO_EMAIL || 'judge@tiny-demo.example';
export const demoPassword = env.VITE_DEMO_PASSWORD || 'TinyDemo2026!';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;
let appCheck: AppCheck | null = null;

if (isFirebaseConfigured) {
  app = initializeApp({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });

  db = getFirestore(app);
  functions = getFunctions(app, 'africa-south1');

  if (isEmulatorMode) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  }

  const debugToken = env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN as string | undefined;
  const recaptchaKey = (env.VITE_RECAPTCHA_SITE_KEY as string | undefined) || 'debug-only-site-key';
  if (debugToken || env.VITE_RECAPTCHA_SITE_KEY) {
    if (debugToken) {
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: string }).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.warn('App Check initialization failed; AI will use curated fallback.', error);
    }
  }
}

// Auth is created lazily so the offline demo never waits for Firebase Auth or
// its hidden iframe. Sign-in and Firebase mode still use the same instance.
export function getFirebaseAuth(): Auth | null {
  if (!app) return null;
  if (!auth) {
    auth = getAuth(app);
    if (isEmulatorMode) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
  }
  return auth;
}

export { app, db, functions, appCheck };
