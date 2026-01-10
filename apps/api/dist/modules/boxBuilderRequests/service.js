"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBuilderRequests = listBuilderRequests;
exports.setBuilderRequestStatus = setBuilderRequestStatus;
// @ts-nocheck
const firestore_1 = require("firebase-admin/firestore");
const schemas_1 = require("./schemas");
const repository_1 = require("./repository");
async function listBuilderRequests(limit = 100) {
    const requests = await (0, repository_1.listRequests)(limit);
    return requests.map((request) => {
        const createdAt = request.createdAt instanceof firestore_1.Timestamp ? request.createdAt.toDate().toISOString() : request.createdAt;
        const normalized = {
            ...request,
            createdAt: typeof createdAt === "string" ? createdAt : undefined,
            status: request.status ?? "pending",
        };
        return schemas_1.boxBuilderRequestSchema.parse(normalized);
    });
}
async function setBuilderRequestStatus(id, status) {
    const parsedStatus = schemas_1.requestStatusSchema.parse(status);
    const updated = await (0, repository_1.updateRequestStatus)(id, parsedStatus);
    if (!updated)
        return null;
    return updated;
}
// @ts-nocheck
//# sourceMappingURL=service.js.map