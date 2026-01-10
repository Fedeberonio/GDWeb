"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.getProducts = getProducts;
exports.getBoxes = getBoxes;
exports.listProductsForAdmin = listProductsForAdmin;
exports.listBoxesForAdmin = listBoxesForAdmin;
exports.listCatalogHistoryEntries = listCatalogHistoryEntries;
exports.updateProductById = updateProductById;
exports.updateBoxById = updateBoxById;
exports.createProduct = createProduct;
const zod_1 = require("zod");
const mock_data_1 = require("./mock-data");
const repository_1 = require("./repository");
const schemas_1 = require("./schemas");
const history_1 = require("./history");
const slugify_1 = __importDefault(require("slugify"));
const useFirestore = process.env.NODE_ENV !== "test";
async function getCategories() {
    if (!useFirestore) {
        return mock_data_1.productCategories.map((category) => schemas_1.productCategorySchema.parse(category));
    }
    const categories = await (0, repository_1.listCategories)();
    return categories.map((category) => schemas_1.productCategorySchema.parse(category));
}
async function getProducts() {
    if (!useFirestore) {
        return [];
    }
    const products = await (0, repository_1.listProducts)();
    return products.map((product) => schemas_1.productSchema.parse(product));
}
async function getBoxes() {
    if (!useFirestore) {
        return mock_data_1.boxes.map((box) => schemas_1.boxSchema.parse(box));
    }
    const boxes = await (0, repository_1.listBoxes)();
    return boxes.map((box) => schemas_1.boxSchema.parse(box));
}
const nutritionUpdateSchema = zod_1.z
    .object({
    vegan: zod_1.z.boolean().optional(),
    glutenFree: zod_1.z.boolean().optional(),
    organic: zod_1.z.boolean().optional(),
})
    .partial();
const logisticsUpdateSchema = zod_1.z
    .object({
    weightKg: zod_1.z.number().nonnegative().optional(),
    dimensionsCm: zod_1.z
        .object({
        length: zod_1.z.number().nonnegative(),
        width: zod_1.z.number().nonnegative(),
        height: zod_1.z.number().nonnegative(),
    })
        .optional(),
    storage: schemas_1.localizedStringSchema.partial().optional(),
})
    .partial();
const productUpdateSchema = zod_1.z
    .object({
    name: schemas_1.localizedStringSchema.partial().optional(),
    description: schemas_1.localizedStringSchema.partial().optional(),
    unit: schemas_1.localizedStringSchema.partial().optional(),
    price: schemas_1.priceSchema.partial().optional(),
    status: schemas_1.productSchema.shape.status.optional(),
    image: zod_1.z.union([zod_1.z.string().min(1), zod_1.z.literal(""), zod_1.z.undefined()]).transform((val) => (val === "" ? undefined : val)),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    isFeatured: zod_1.z.boolean().optional(),
    nutrition: nutritionUpdateSchema.optional(),
    logistics: logisticsUpdateSchema.optional(),
    categoryId: zod_1.z.string().min(1).optional(),
})
    .partial();
const boxUpdateSchema = zod_1.z
    .object({
    name: schemas_1.localizedStringSchema.partial().optional(),
    description: schemas_1.localizedStringSchema.partial().optional(),
    price: schemas_1.priceSchema.partial().optional(),
    heroImage: zod_1.z.string().min(1).optional(),
    isFeatured: zod_1.z.boolean().optional(),
    durationDays: zod_1.z.number().int().positive().optional(),
    variants: zod_1.z.array(schemas_1.boxVariantSchema).optional(),
})
    .partial();
function mergeLocalized(base, update) {
    if (!update)
        return base;
    return { ...(base ?? {}), ...update };
}
function mergeProduct(existing, updates) {
    const merged = {
        ...existing,
        name: updates.name ? mergeLocalized(existing.name, updates.name) : existing.name,
        description: updates.description ? mergeLocalized(existing.description, updates.description) : existing.description,
        unit: updates.unit ? mergeLocalized(existing.unit, updates.unit) : existing.unit,
        price: updates.price ? { ...existing.price, ...updates.price } : existing.price,
        tags: updates.tags !== undefined ? updates.tags : existing.tags,
        image: updates.image !== undefined ? updates.image : existing.image,
        status: updates.status !== undefined ? updates.status : existing.status,
        isFeatured: updates.isFeatured !== undefined ? updates.isFeatured : existing.isFeatured,
        categoryId: updates.categoryId !== undefined ? updates.categoryId : existing.categoryId,
        nutrition: updates.nutrition
            ? {
                ...(existing.nutrition ?? {}),
                ...updates.nutrition,
            }
            : existing.nutrition,
        logistics: updates.logistics
            ? {
                ...(existing.logistics ?? {}),
                ...updates.logistics,
                storage: updates.logistics.storage
                    ? mergeLocalized(existing.logistics?.storage, updates.logistics.storage)
                    : existing.logistics?.storage,
            }
            : existing.logistics,
    };
    return schemas_1.productSchema.parse(merged);
}
function mergeBox(existing, updates) {
    const merged = {
        ...existing,
        ...updates,
        name: updates.name ? mergeLocalized(existing.name, updates.name) : existing.name,
        description: updates.description
            ? mergeLocalized(existing.description, updates.description)
            : existing.description,
        price: updates.price ? { ...existing.price, ...updates.price } : existing.price,
        heroImage: updates.heroImage ?? existing.heroImage,
        variants: updates.variants ?? existing.variants,
    };
    return schemas_1.boxSchema.parse(merged);
}
async function listProductsForAdmin() {
    const products = await (0, repository_1.listAllProducts)();
    return products.map((product) => schemas_1.productSchema.parse(product));
}
async function listBoxesForAdmin() {
    const boxes = await (0, repository_1.listAllBoxes)();
    return boxes.map((box) => schemas_1.boxSchema.parse(box));
}
async function listCatalogHistoryEntries(limit = 100) {
    const entries = await (0, history_1.listCatalogHistory)(limit);
    return entries.map((entry) => {
        const parser = entry.entityType === "product" ? schemas_1.productSchema : schemas_1.boxSchema;
        return {
            ...entry,
            before: parser.parse(entry.before),
            after: parser.parse(entry.after),
        };
    });
}
async function updateProductById(id, payload, context = {}) {
    console.log(`[updateProductById] Looking for product with ID: ${id}`);
    const existing = await (0, repository_1.getProductById)(id);
    if (!existing) {
        console.warn(`[updateProductById] Product not found when updating`, { id });
        return null;
    }
    console.log(`[updateProductById] Product found: ${existing.name.es} (ID: ${existing.id})`);
    const parsedExisting = schemas_1.productSchema.parse(existing);
    const updates = productUpdateSchema.parse(payload);
    const merged = mergeProduct(parsedExisting, updates);
    await (0, repository_1.saveProduct)(merged);
    await (0, history_1.recordCatalogChange)("product", parsedExisting, merged, context);
    return merged;
}
async function updateBoxById(id, payload, context = {}) {
    const existing = await (0, repository_1.getBoxById)(id);
    if (!existing) {
        return null;
    }
    const parsedExisting = schemas_1.boxSchema.parse(existing);
    const updates = boxUpdateSchema.parse(payload);
    const merged = mergeBox(parsedExisting, updates);
    await (0, repository_1.saveBox)(merged);
    await (0, history_1.recordCatalogChange)("box", parsedExisting, merged, context);
    return merged;
}
const productCreationSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1).optional(),
    id: zod_1.z.string().min(1).optional(),
    name: schemas_1.localizedStringSchema,
    categoryId: zod_1.z.string().min(1),
    price: schemas_1.priceSchema,
    status: schemas_1.productSchema.shape.status.optional(),
    description: schemas_1.localizedStringSchema.partial().optional(),
    unit: schemas_1.localizedStringSchema.partial().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    image: zod_1.z.string().min(1).optional(),
    isFeatured: zod_1.z.boolean().optional(),
});
async function createProduct(payload, context = {}) {
    const parsed = productCreationSchema.parse(payload);
    const generatedSlug = (0, slugify_1.default)(parsed.name.es, { lower: true, strict: true });
    const slug = parsed.slug?.trim() || generatedSlug;
    const id = parsed.id?.trim() || slug;
    const productPayload = {
        id,
        slug,
        name: parsed.name,
        categoryId: parsed.categoryId,
        price: parsed.price,
        status: parsed.status ?? "active",
        description: parsed.description,
        unit: parsed.unit,
        tags: parsed.tags ?? [],
        isFeatured: parsed.isFeatured ?? false,
        image: parsed.image,
        sku: parsed.slug,
    };
    const product = schemas_1.productSchema.parse(productPayload);
    await (0, repository_1.saveProduct)(product);
    await (0, history_1.recordCatalogChange)("product", product, product, context);
    return product;
}
// @ts-nocheck
//# sourceMappingURL=service.js.map