"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoxesRouter = createBoxesRouter;
// @ts-nocheck
const express_1 = require("express");
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
const firestore_2 = require("../../lib/firestore");
const service_1 = require("../catalog/service");
const baseSelectionSchema = zod_1.z.object({
    boxId: zod_1.z.string().min(1),
    selectedProducts: zod_1.z
        .record(zod_1.z.string(), zod_1.z.coerce.number().int().nonnegative())
        .refine((value) => Object.values(value).some((quantity) => quantity > 0), {
        message: "Debes seleccionar al menos un producto",
    }),
    mix: zod_1.z.enum(["mix", "frutas", "vegetales"]).optional(),
    likes: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    dislikes: zod_1.z.array(zod_1.z.string().min(1)).optional().default([]),
    notes: zod_1.z.string().max(500).optional().default(""),
    deliveryZone: zod_1.z.string().optional(),
    deliveryDay: zod_1.z.string().optional(),
});
const validationSchema = baseSelectionSchema;
const requestSchema = baseSelectionSchema.extend({
    contactName: zod_1.z.string().min(3, "Indícanos un nombre de contacto"),
    contactEmail: zod_1.z.string().email().optional(),
    contactPhone: zod_1.z.string().min(7, "El teléfono es obligatorio"),
});
function evaluateSelection(selection, rule, productMetaMap) {
    let slotsUsed = 0;
    let weightUsed = 0;
    let costEstimate = 0;
    let productCount = 0;
    const missingProducts = [];
    Object.entries(selection).forEach(([slug, quantity]) => {
        // Asegurar que quantity sea number
        const qty = typeof quantity === "number" ? quantity : Number(quantity) || 0;
        if (!qty || qty <= 0)
            return;
        productCount += 1;
        const metadata = productMetaMap[slug];
        if (!metadata) {
            missingProducts.push(slug);
            return;
        }
        const slotValue = metadata.slotValue ?? 1;
        const weight = metadata.weightKg ?? 0.5;
        const cost = metadata.wholesaleCost ?? 0;
        slotsUsed += slotValue * qty;
        weightUsed += weight * qty;
        costEstimate += cost * qty;
    });
    const errors = [];
    const warnings = [];
    if (rule.slotBudget && slotsUsed > rule.slotBudget) {
        errors.push(`Tu selección excede el máximo permitido de ${rule.slotBudget} slots.`);
    }
    else if (rule.slotBudget && slotsUsed < rule.slotBudget * 0.6) {
        warnings.push("Aún tienes espacio disponible para añadir más productos.");
    }
    if (rule.targetWeightKg && weightUsed > rule.targetWeightKg * 1.2) {
        warnings.push("El peso estimado supera el recomendado; revisa los productos más pesados.");
    }
    if (missingProducts.length > 0) {
        warnings.push(`No encontramos metadata para: ${missingProducts.join(", ")}`);
    }
    return {
        slotsUsed,
        weightUsed,
        costEstimate,
        productCount,
        errors,
        warnings,
    };
}
function buildValidationResult(payload, rule, productMetaMap) {
    // Asegurar que selectedProducts sea Record<string, number>
    const selectedProducts = payload.selectedProducts;
    const { slotsUsed, weightUsed, costEstimate, productCount, errors, warnings } = evaluateSelection(selectedProducts, rule, productMetaMap);
    return {
        boxId: payload.boxId,
        mix: payload.mix,
        likes: payload.likes ?? [],
        dislikes: payload.dislikes ?? [],
        deliveryZone: payload.deliveryZone,
        deliveryDay: payload.deliveryDay,
        notes: payload.notes,
        metrics: {
            slotsUsed,
            slotBudget: rule.slotBudget,
            weightUsedKg: Number(weightUsed.toFixed(2)),
            targetWeightKg: rule.targetWeightKg,
            costEstimate: Number(costEstimate.toFixed(2)),
            productCount,
        },
        issues: {
            errors,
            warnings,
        },
        valid: errors.length === 0,
    };
}
function createBoxesRouter() {
    const router = (0, express_1.Router)();
    router.post("/validate", async (req, res) => {
        const parsed = validationSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Solicitud inválida",
                details: parsed.error.flatten(),
            });
            return;
        }
        const payload = parsed.data;
        const boxRulesRecord = await (0, service_1.getBoxRulesMap)();
        const productMetaMap = await (0, service_1.getProductMetaMap)();
        const rule = boxRulesRecord[payload.boxId];
        if (!rule) {
            res.status(404).json({ error: "Caja no encontrada" });
            return;
        }
        // Asegurar que selectedProducts sea Record<string, number>
        const selectedProducts = payload.selectedProducts;
        const payloadWithTypedSelection = {
            ...payload,
            selectedProducts,
        };
        const result = buildValidationResult(payloadWithTypedSelection, rule, productMetaMap);
        res.json({ data: result });
    });
    router.post("/requests", async (req, res) => {
        const parsed = requestSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({
                error: "Solicitud inválida",
                details: parsed.error.flatten(),
            });
            return;
        }
        const payload = parsed.data;
        const boxRulesRecord = await (0, service_1.getBoxRulesMap)();
        const productMetaMap = await (0, service_1.getProductMetaMap)();
        const rule = boxRulesRecord[payload.boxId];
        if (!rule) {
            res.status(404).json({ error: "Caja no encontrada" });
            return;
        }
        // Asegurar que selectedProducts sea Record<string, number>
        const selectedProducts = payload.selectedProducts;
        const payloadWithTypedSelection = {
            ...payload,
            selectedProducts,
        };
        const validationResult = buildValidationResult(payloadWithTypedSelection, rule, productMetaMap);
        if (!validationResult.valid) {
            res.status(400).json({
                error: "Tu selección necesita ajustes antes de enviarla.",
                details: validationResult.issues,
            });
            return;
        }
        try {
            const docRef = await (0, firestore_2.getDb)().collection("box_builder_requests").add({
                contactName: payload.contactName,
                contactEmail: payload.contactEmail ?? null,
                contactPhone: payload.contactPhone,
                deliveryZone: payload.deliveryZone ?? null,
                deliveryDay: payload.deliveryDay ?? null,
                mix: payload.mix ?? null,
                likes: payload.likes ?? [],
                dislikes: payload.dislikes ?? [],
                notes: payload.notes ?? "",
                selection: selectedProducts,
                metrics: validationResult.metrics,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                status: "pending",
            });
            res.status(201).json({
                data: {
                    id: docRef.id,
                    metrics: validationResult.metrics,
                    issues: validationResult.issues,
                },
            });
        }
        catch (error) {
            console.error("Failed to store box builder request", error);
            res.status(500).json({ error: "No pudimos guardar tu solicitud, intenta de nuevo en unos minutos." });
        }
    });
    return router;
}
// @ts-nocheck
//# sourceMappingURL=routes.js.map