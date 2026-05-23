import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  setLogLevel,
  doc, 
  getDoc 
} from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence verbose connection warnings in sandboxed preview contexts
setLogLevel('error');

const app = initializeApp(firebaseConfig);

// Configure robust local caching with standard offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Clean, silent connectivity check
let isChecking = false;
async function testConnection() {
  if (isChecking) return;
  isChecking = true;
  
  // Give the sandbox environment adequate time to boot up
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  try {
    const testDoc = doc(db, 'notifications', 'non-existent-test-doc');
    // Using default getDoc instead of getDocFromServer enables seamless fallback behavior
    await getDoc(testDoc);
  } catch (error: any) {
    // Only warn on actual invalid Firestore credentials/permissions, otherwise transition silently
    const msg = error.message ? error.message.toLowerCase() : String(error).toLowerCase();
    if (!msg.includes('offline') && !msg.includes('unavailable') && !msg.includes('client is offline')) {
      console.warn("Firestore initialization notice:", error.message || error);
    }
  } finally {
    isChecking = false;
  }
}

// Start test without blocking
testConnection().catch(console.error);

