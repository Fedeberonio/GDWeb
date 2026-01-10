"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogCollections = void 0;
exports.listCategories = listCategories;
exports.listProducts = listProducts;
exports.listAllProducts = listAllProducts;
exports.getProductById = getProductById;
exports.saveProduct = saveProduct;
exports.listBoxes = listBoxes;
exports.listAllBoxes = listAllBoxes;
exports.getBoxById = getBoxById;
exports.saveBox = saveBox;
const firestore_1 = require("../../lib/firestore");
const COLLECTIONS = {
    categories: "catalog_categories",
    products: "catalog_products",
    boxes: "catalog_boxes",
};
async function listCategories() {
    const snapshot = await (0, firestore_1.getDb)().collection(COLLECTIONS.categories).orderBy("sortOrder").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function listProducts() {
    const snapshot = await (0, firestore_1.getDb)().collection(COLLECTIONS.products).where("status", "==", "active").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function listAllProducts() {
    const snapshot = await (0, firestore_1.getDb)().collection(COLLECTIONS.products).orderBy("name.es").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function getProductById(id) {
    console.log(`[getProductById] Searching for product with ID: "${id}" (length: ${id.length})`);
    const doc = await (0, firestore_1.getDb)().collection(COLLECTIONS.products).doc(id).get();
    if (!doc.exists) {
        console.warn(`[getProductById] Document not found for ID: "${id}"`);
        return null;
    }
    const data = doc.data();
    console.log(`[getProductById] Document found: ${data?.name?.es || "unknown"} (doc.id: "${doc.id}")`);
    return { id: doc.id, ...data };
}
async function saveProduct(product) {
    await (0, firestore_1.getDb)().collection(COLLECTIONS.products).doc(product.id).set(product, { merge: true });
}
async function listBoxes() {
    const snapshot = await (0, firestore_1.getDb)().collection(COLLECTIONS.boxes).where("isFeatured", "==", true).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function listAllBoxes() {
    const snapshot = await (0, firestore_1.getDb)().collection(COLLECTIONS.boxes).orderBy("name.es").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function getBoxById(id) {
    const doc = await (0, firestore_1.getDb)().collection(COLLECTIONS.boxes).doc(id).get();
    if (!doc.exists)
        return null;
    return { id: doc.id, ...doc.data() };
}
async function saveBox(box) {
    await (0, firestore_1.getDb)().collection(COLLECTIONS.boxes).doc(box.id).set(box, { merge: true });
}
exports.catalogCollections = COLLECTIONS;
//# sourceMappingURL=repository.js.map