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
        // Normalizar createdAt: puede ser Timestamp, Date, string o undefined
        let createdAt;
        if (request.createdAt instanceof firestore_1.Timestamp) {
            createdAt = request.createdAt.toDate().toISOString();
        }
        else if (request.createdAt instanceof Date) {
            createdAt = request.createdAt.toISOString();
        }
        else if (typeof request.createdAt === "string") {
            createdAt = request.createdAt;
        }
        else {
            createdAt = undefined;
        }
        // Normalizar status: debe ser uno de los valores válidos
        const status = typeof request.status === "string" && ["pending", "confirmed", "cancelled"].includes(request.status)
            ? request.status
            : "pending";
        const normalized = {
            ...request,
            createdAt,
            status,
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