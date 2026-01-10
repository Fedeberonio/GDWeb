"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("../firebaseAdmin");
function getDb() {
    const app = (0, firebaseAdmin_1.initializeFirebaseAdmin)();
    return (0, firestore_1.getFirestore)(app);
}
//# sourceMappingURL=firestore.js.map