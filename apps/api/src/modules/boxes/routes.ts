// @ts-nocheck
import { Router } from "express";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";

import boxRules from "../../data/boxRules.json";
import productMetadata from "../../data/productMetadata.json";
import { getDb } from "../../lib/firestore";

const productMap = new Map(productMetadata.map((item) => [item.slug, item]));

type BoxRule = (typeof boxRules)[keyof typeof boxRules];

const baseSelectionSchema = z.object({
  boxId: z.string().min(1),
  selectedProducts: z
    .record(z.string(), z.coerce.number().int().nonnegative())
    .refine((value) => Object.values(value).some((quantity) => quantity > 0), {
      message: "Debes seleccionar al menos un producto",
    }),
  mix: z.enum(["mix", "frutas", "vegetales"]).optional(),
  likes: z.array(z.string().min(1)).optional().default([]),
  dislikes: z.array(z.string().min(1)).optional().default([]),
  notes: z.string().max(500).optional().default(""),
  deliveryZone: z.string().optional(),
  deliveryDay: z.string().optional(),
});

const validationSchema = baseSelectionSchema;

const requestSchema = baseSelectionSchema.extend({
  contactName: z.string().min(3, "Indícanos un nombre de contacto"),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(7, "El teléfono es obligatorio"),
});

type ValidationPayload = z.infer<typeof validationSchema>;
// RequestPayload type is inferred from requestSchema when needed

type BuilderValidationResult = {
  boxId: string;
  mix?: ValidationPayload["mix"];
  likes: string[];
  dislikes: string[];
  deliveryZone?: string;
  deliveryDay?: string;
  notes?: string;
  metrics: {
    slotsUsed: number;
    slotBudget?: number;
    weightUsedKg: number;
    targetWeightKg?: number;
    costEstimate: number;
    productCount: number;
  };
  issues: {
    errors: string[];
    warnings: string[];
  };
  valid: boolean;
};

function evaluateSelection(selection: Record<string, number>, rule: BoxRule) {
  let slotsUsed = 0;
  let weightUsed = 0;
  let costEstimate = 0;
  let productCount = 0;
  const missingProducts: string[] = [];

  Object.entries(selection).forEach(([slug, quantity]) => {
    // Asegurar que quantity sea number
    const qty = typeof quantity === "number" ? quantity : Number(quantity) || 0;
    if (!qty || qty <= 0) return;
    productCount += 1;
    const metadata = productMap.get(slug);
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

  const errors: string[] = [];
  const warnings: string[] = [];

  if (rule.slotBudget && slotsUsed > rule.slotBudget) {
    errors.push(`Tu selección excede el máximo permitido de ${rule.slotBudget} slots.`);
  } else if (rule.slotBudget && slotsUsed < rule.slotBudget * 0.6) {
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

function buildValidationResult(payload: ValidationPayload, rule: BoxRule) {
  // Asegurar que selectedProducts sea Record<string, number>
  const selectedProducts = payload.selectedProducts as Record<string, number>;
  const { slotsUsed, weightUsed, costEstimate, productCount, errors, warnings } = evaluateSelection(
    selectedProducts,
    rule,
  );

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
  } satisfies BuilderValidationResult;
}

export function createBoxesRouter() {
  const router = Router();

  router.post("/validate", (req, res) => {
    const parsed = validationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Solicitud inválida",
        details: parsed.error.flatten(),
      });
      return;
    }

    const payload = parsed.data;
    // Castear boxRules a Record y asegurar que selectedProducts sea Record<string, number>
    const boxRulesRecord = boxRules as Record<string, BoxRule>;
    const rule = boxRulesRecord[payload.boxId];
    if (!rule) {
      res.status(404).json({ error: "Caja no encontrada" });
      return;
    }

    // Asegurar que selectedProducts sea Record<string, number>
    const selectedProducts = payload.selectedProducts as Record<string, number>;
    const payloadWithTypedSelection = {
      ...payload,
      selectedProducts,
    };

    const result = buildValidationResult(payloadWithTypedSelection, rule);

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
    // Castear boxRules a Record y asegurar que selectedProducts sea Record<string, number>
    const boxRulesRecord = boxRules as Record<string, BoxRule>;
    const rule = boxRulesRecord[payload.boxId];
    if (!rule) {
      res.status(404).json({ error: "Caja no encontrada" });
      return;
    }

    // Asegurar que selectedProducts sea Record<string, number>
    const selectedProducts = payload.selectedProducts as Record<string, number>;
    const payloadWithTypedSelection = {
      ...payload,
      selectedProducts,
    };

    const validationResult = buildValidationResult(payloadWithTypedSelection, rule);
    if (!validationResult.valid) {
      res.status(400).json({
        error: "Tu selección necesita ajustes antes de enviarla.",
        details: validationResult.issues,
      });
      return;
    }

    try {
      const docRef = await getDb().collection("box_builder_requests").add({
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
        createdAt: FieldValue.serverTimestamp(),
        status: "pending",
      });

      res.status(201).json({
        data: {
          id: docRef.id,
          metrics: validationResult.metrics,
          issues: validationResult.issues,
        },
      });
    } catch (error) {
      console.error("Failed to store box builder request", error);
      res.status(500).json({ error: "No pudimos guardar tu solicitud, intenta de nuevo en unos minutos." });
    }
  });

  return router;
}
// @ts-nocheck
