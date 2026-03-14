import { getFirestore } from "firebase-admin/firestore";

import { initializeFirebaseAdmin } from "../firebaseAdmin";

export function getDb() {
  const app = initializeFirebaseAdmin();
  return getFirestore(app);
}
