"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const firestore_1 = require("../lib/firestore");
const mock_data_1 = require("../modules/catalog/mock-data");
const repository_1 = require("../modules/catalog/repository");
const schemas_1 = require("../modules/catalog/schemas");
dotenv_1.default.config();
async function seedCatalog() {
    const db = (0, firestore_1.getDb)();
    const categoryBatch = db.batch();
    mock_data_1.productCategories.forEach((category) => {
        const parsed = schemas_1.productCategorySchema.parse(category);
        const ref = db.collection(repository_1.catalogCollections.categories).doc(parsed.id);
        categoryBatch.set(ref, parsed, { merge: true });
    });
    await categoryBatch.commit();
    const boxBatch = db.batch();
    mock_data_1.boxes.forEach((box) => {
        const parsed = schemas_1.boxSchema.parse(box);
        const ref = db.collection(repository_1.catalogCollections.boxes).doc(parsed.id);
        boxBatch.set(ref, parsed, { merge: true });
    });
    await boxBatch.commit();
    console.log("Catalog seed completed");
}
seedCatalog().catch((error) => {
    console.error("Failed to seed catalog", error);
    process.exit(1);
});
// @ts-nocheck
//# sourceMappingURL=seedCatalog.js.map