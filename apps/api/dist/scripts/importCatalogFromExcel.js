"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xlsx_1 = require("xlsx");
const firestore_1 = require("../lib/firestore");
const repository_1 = require("../modules/catalog/repository");
const schemas_1 = require("../modules/catalog/schemas");
dotenv_1.default.config();
const YES_VALUES = new Set(["si", "sí", "yes", "true", "1"]);
function toBoolean(value) {
    if (typeof value === "boolean")
        return value;
    if (typeof value === "number")
        return value !== 0;
    if (typeof value === "string") {
        return YES_VALUES.has(value.trim().toLowerCase());
    }
    return false;
}
function toNumber(value) {
    if (typeof value === "number")
        return value;
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value.replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
        return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
}
function slugify(value) {
    return value
        .normalize("NFD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
function parseWeightKg(value) {
    if (!value)
        return undefined;
    const kgMatch = value.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|kilogram)/i);
    if (kgMatch) {
        return Number.parseFloat(kgMatch[1]);
    }
    const lbMatch = value.match(/([0-9]+(?:\.[0-9]+)?)\s*(lb|libras?)/i);
    if (lbMatch) {
        const pounds = Number.parseFloat(lbMatch[1]);
        return Number.isNaN(pounds) ? undefined : Number.parseFloat((pounds * 0.453592).toFixed(3));
    }
    return undefined;
}
function parseDurationDays(name) {
    if (!name)
        return undefined;
    const days = name.match(/(\d+)\s*d[ií]as/i);
    if (days)
        return Number.parseInt(days[1], 10);
    const weeks = name.match(/(\d+)\s*semanas?/i);
    if (weeks)
        return Number.parseInt(weeks[1], 10) * 7;
    return undefined;
}
function splitTags(value) {
    if (!value)
        return [];
    return value
        .split(/[,;]+/)
        .map((tag) => tag.trim())
        .filter(Boolean);
}
function isBabyProduct(name, sku) {
    const source = `${name ?? ""} ${sku ?? ""}`.toLowerCase();
    return source.includes("baby");
}
function readExcelRows(filePath) {
    const workbook = (0, xlsx_1.readFile)(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx_1.utils.sheet_to_json(sheet, { defval: null });
}
const BOX_VARIANTS = [
    {
        id: "mix",
        slug: "mix",
        name: { es: "Mix", en: "Mix" },
        description: { es: "Selección balanceada de frutas y vegetales", en: "Balanced selection of fruits and veggies" },
        highlights: [],
        referenceContents: [],
    },
    {
        id: "fruity",
        slug: "fruity",
        name: { es: "Fruity", en: "Fruity" },
        description: { es: "Ideal para smoothies y desayunos", en: "Perfect for smoothies and breakfasts" },
        highlights: [],
        referenceContents: [],
    },
    {
        id: "veggie",
        slug: "veggie",
        name: { es: "Veggie", en: "Veggie" },
        description: { es: "Vegetales listos para meal prep", en: "Meal-prep ready vegetables" },
        highlights: [],
        referenceContents: [],
    },
];
function buildCatalog(rows) {
    const categoriesMap = new Map();
    const products = [];
    const boxes = [];
    rows.forEach((row) => {
        const sku = row.SKU?.toString().trim();
        const name = row.Nombre_Producto?.toString().trim();
        const categoryName = row.Categoria?.toString().trim();
        if (!sku || !name || !categoryName)
            return;
        const categoryId = slugify(categoryName);
        if (!categoriesMap.has(categoryId)) {
            const categoryPayload = {
                id: categoryId,
                slug: categoryId,
                name: { es: categoryName, en: categoryName },
                sortOrder: categoriesMap.size,
                status: toBoolean(row.Activo) ? "active" : "inactive",
                ...(row.Subcategoria ? { description: { es: row.Subcategoria, en: row.Subcategoria } } : {}),
            };
            categoriesMap.set(categoryId, schemas_1.productCategorySchema.parse(categoryPayload));
        }
        if (categoryId === "cajas") {
            const boxPayload = {
                id: sku,
                slug: slugify(name),
                name: { es: name, en: name },
                price: {
                    amount: toNumber(row.Precio_DOP) ?? 0,
                    currency: "DOP",
                },
                durationDays: parseDurationDays(name),
                isFeatured: toBoolean(row.Destacado_Web),
                variants: BOX_VARIANTS,
                ...(row.Descripcion_Corta ? { description: { es: row.Descripcion_Corta, en: row.Descripcion_Corta } } : {}),
                ...(row.URL_Imagen ? { heroImage: row.URL_Imagen } : {}),
            };
            const box = schemas_1.boxSchema.parse(boxPayload);
            boxes.push(box);
            return;
        }
        const weightKg = parseWeightKg(row.Peso_Aproximado || row.Peso_En_Libras || undefined);
        const storage = row.Almacenamiento ? { es: row.Almacenamiento, en: row.Almacenamiento } : undefined;
        const vegan = row.Apto_Vegano != null ? toBoolean(row.Apto_Vegano) : undefined;
        const glutenFree = row.Libre_Gluten != null ? toBoolean(row.Libre_Gluten) : undefined;
        const organic = row.Organico != null ? toBoolean(row.Organico) : undefined;
        const tags = [
            ...splitTags(row.Tags),
            ...(isBabyProduct(name, sku) ? ["baby-only"] : []),
        ];
        const nutrition = [vegan, glutenFree, organic].some((value) => value !== undefined)
            ? {
                ...(vegan !== undefined ? { vegan } : {}),
                ...(glutenFree !== undefined ? { glutenFree } : {}),
                ...(organic !== undefined ? { organic } : {}),
            }
            : undefined;
        const logistics = weightKg || storage
            ? {
                ...(weightKg !== undefined ? { weightKg } : {}),
                ...(storage ? { storage } : {}),
            }
            : undefined;
        const productPayload = {
            id: sku,
            slug: slugify(name),
            sku,
            name: { es: name, en: name },
            categoryId,
            price: {
                amount: toNumber(row.Precio_DOP) ?? 0,
                currency: "DOP",
            },
            status: toBoolean(row.Activo) ? "active" : "inactive",
            tags,
            isFeatured: toBoolean(row.Destacado_Web),
            ...(row.Descripcion_Corta ? { description: { es: row.Descripcion_Corta, en: row.Descripcion_Corta } } : {}),
            ...(row.Unidad_Venta ? { unit: { es: row.Unidad_Venta, en: row.Unidad_Venta } } : {}),
            ...(row.URL_Imagen ? { image: row.URL_Imagen } : {}),
            ...(nutrition ? { nutrition } : {}),
            ...(logistics ? { logistics } : {}),
        };
        const product = schemas_1.productSchema.parse(productPayload);
        products.push(product);
    });
    const categories = Array.from(categoriesMap.values());
    return {
        categories,
        boxes,
        products,
    };
}
async function clearCollection(collectionName) {
    const db = (0, firestore_1.getDb)();
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty)
        return;
    const chunks = [];
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 400) {
        chunks.push(docs.slice(i, i + 400));
    }
    for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
    }
}
async function writeCollection(collectionName, records) {
    if (!records.length)
        return;
    const db = (0, firestore_1.getDb)();
    for (let i = 0; i < records.length; i += 400) {
        const batch = db.batch();
        const slice = records.slice(i, i + 400);
        slice.forEach((record) => {
            const ref = db.collection(collectionName).doc(record.id);
            batch.set(ref, record, { merge: true });
        });
        await batch.commit();
    }
}
async function run() {
    const fileArg = process.argv[2];
    const newDefaultPath = path_1.default.resolve(__dirname, "../../../../data/GreenDolio_Maestro_COMPLETO_25nov.xlsx");
    const legacyPath = path_1.default.resolve(__dirname, "../../../../data/GreenDolio_Documento_maestro_Precios_06nov.xlsx");
    const chosenDefault = fs_1.default.existsSync(newDefaultPath) ? newDefaultPath : legacyPath;
    const excelPath = fileArg ? path_1.default.resolve(process.cwd(), fileArg) : chosenDefault;
    if (!fs_1.default.existsSync(excelPath)) {
        throw new Error(`No se encontró el archivo Excel en ${excelPath}`);
    }
    console.log(`Importando catálogo desde: ${excelPath}`);
    const rows = readExcelRows(excelPath);
    const catalog = buildCatalog(rows);
    console.log(`Registros detectados -> Categorías: ${catalog.categories.length}, Productos: ${catalog.products.length}, Cajas: ${catalog.boxes.length}`);
    // Se limpia cada colección antes de reescribir para mantener consistencia
    await clearCollection(repository_1.catalogCollections.categories);
    await clearCollection(repository_1.catalogCollections.products);
    await clearCollection(repository_1.catalogCollections.boxes);
    await writeCollection(repository_1.catalogCollections.categories, catalog.categories);
    await writeCollection(repository_1.catalogCollections.products, catalog.products);
    await writeCollection(repository_1.catalogCollections.boxes, catalog.boxes);
    console.log("Catálogo importado correctamente ✅");
}
run().catch((error) => {
    console.error("Error al importar catálogo", error);
    process.exit(1);
});
// @ts-nocheck
//# sourceMappingURL=importCatalogFromExcel.js.map