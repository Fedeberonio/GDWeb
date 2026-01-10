"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirebaseAdmin = initializeFirebaseAdmin;
exports.getAdminAuth = getAdminAuth;
exports.getAdminStorageBucket = getAdminStorageBucket;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const storage_1 = require("firebase-admin/storage");
const env_1 = require("./config/env");
let appInstance;
function initializeFirebaseAdmin() {
    if (appInstance)
        return appInstance;
    const env = (0, env_1.getEnv)();
    const existingApp = (0, app_1.getApps)()[0];
    appInstance =
        existingApp ??
            (0, app_1.initializeApp)({
                credential: (0, app_1.cert)({
                    projectId: env.FIREBASE_PROJECT_ID,
                    clientEmail: env.FIREBASE_CLIENT_EMAIL,
                    privateKey: env.FIREBASE_PRIVATE_KEY,
                }),
                storageBucket: env.FIREBASE_STORAGE_BUCKET,
            });
    return appInstance;
}
function getAdminAuth() {
    return (0, auth_1.getAuth)(initializeFirebaseAdmin());
}
function getAdminStorageBucket() {
    return (0, storage_1.getStorage)(initializeFirebaseAdmin()).bucket();
}
//# sourceMappingURL=firebaseAdmin.js.map