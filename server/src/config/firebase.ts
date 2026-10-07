import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let firebaseInitialized = false;

export const initFirebaseAdmin = (): void => {
  if (firebaseInitialized || admin.apps.length > 0) {
    firebaseInitialized = true;
    return;
  }

  try {
    // Check if JSON key file path is provided in environment variables
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountJson) {
      const parsedKey = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(parsedKey),
      });
      console.log('[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT_KEY');
      firebaseInitialized = true;
      return;
    }

    if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
      const parsedKey = JSON.parse(fs.readFileSync(path.resolve(serviceAccountPath), 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(parsedKey),
      });
      console.log('[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT_PATH');
      firebaseInitialized = true;
      return;
    }

    // Check individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('[Firebase Admin] Initialized with env credentials');
      firebaseInitialized = true;
      return;
    }

    // Default application credentials fallback
    admin.initializeApp();
    console.log('[Firebase Admin] Initialized with default credentials');
    firebaseInitialized = true;
  } catch (error) {
    console.warn('[Firebase Admin] Warning: Could not initialize Firebase Admin credentials automatically:', (error as Error).message);
    console.warn('[Firebase Admin] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_PATH in server/.env');
  }
};

export const verifyFirebaseToken = async (idToken: string): Promise<admin.auth.DecodedIdToken | null> => {
  try {
    initFirebaseAdmin();
    // If admin app is initialized, verify token
    if (admin.apps.length > 0) {
      return await admin.auth().verifyIdToken(idToken);
    }
  } catch (err) {
    console.error('[Firebase Auth] Verification failed:', (err as Error).message);
  }

  // Fallback for development/testing if token format is dev-uid
  if (process.env.NODE_ENV !== 'production' && idToken.startsWith('dev-token-')) {
    const uid = idToken.replace('dev-token-', '');
    return {
      iss: 'https://securetoken.google.com/dev',
      uid,
      aud: 'dev',
      auth_time: Math.floor(Date.now() / 1000),
      user_id: uid,
      sub: uid,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      email_verified: false,
      firebase: { identities: {}, sign_in_provider: 'custom' },
    } as unknown as admin.auth.DecodedIdToken;
  }

  return null;
};
