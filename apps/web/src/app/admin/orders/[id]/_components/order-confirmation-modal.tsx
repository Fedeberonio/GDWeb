"use client";

import { useState, useEffect } from "react";
import { X, Check, Save } from "lucide-react";
import type { Order, OrderDelivery } from "@/modules/orders/types";
import {
    buildOrderConfirmationMessage,
    type OrderTotalsSummary,
    type ProductLabelMap,
} from "@/modules/orders/whatsapp-message";

type OrderDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: ConfirmationData) => Promise<void>;
    order: Order;
    loading?: boolean;
    mode: 'confirm' | 'edit';
    totals?: OrderTotalsSummary;
    productLabelMap?: ProductLabelMap;
};

export type ConfirmationData = {
    customerName: string;
    customerPhone: string;
    language: "es" | "en";
    delivery: OrderDelivery;
    timeWindow: {
        start: string;
        end: string;
    };
};

export function OrderDetailsModal({
    isOpen,
    onClose,
    onConfirm,
    order,
    loading = false,
    mode = 'confirm',
    totals,
    productLabelMap,
}: OrderDetailsModalProps) {
    // Local state for form fields
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [language, setLanguage] = useState<"es" | "en">("es");

    const [addressLabel, setAddressLabel] = useState("");
    const [city, setCity] = useState("");
    const [zone, setZone] = useState("");
    const [deliveryNotes, setDeliveryNotes] = useState("");

    const [timeStart, setTimeStart] = useState("");
    const [timeEnd, setTimeEnd] = useState("");

    // Initialize checks
    useEffect(() => {
        if (isOpen && order) {
            setCustomerName(order.delivery.address.contactName || "");
            setCustomerPhone(order.delivery.address.phone || "");
            setAddressLabel(order.delivery.address.label || "");
            setCity(order.delivery.address.city || "");
            setZone(order.delivery.address.zone || "");
            setDeliveryNotes(order.delivery.notes || "");

            // Try to parse existing window if available
            if (order.delivery.window?.slot) {
                // Simple heuristic for existing slots like "10:00 - 12:00"
                const parts = order.delivery.window.slot.split("-");
                if (parts.length === 2) {
                    setTimeStart(parts[0].trim());
                    setTimeEnd(parts[1].trim());
                }
            }
        }
    }, [isOpen, order]);

    const buildDelivery = (): OrderDelivery => ({
        ...order.delivery,
        address: {
            ...order.delivery.address,
            contactName: customerName,
            phone: customerPhone,
            label: addressLabel,
            city,
            zone,
        },
        notes: deliveryNotes,
        window: {
            day: order.delivery.window?.day || "Hoy",
            slot: `${timeStart} - ${timeEnd}`,
        },
    });

    const handleSubmit = async () => {
        const data: ConfirmationData = {
            customerName,
            customerPhone,
            language,
            delivery: buildDelivery(),
            timeWindow: {
                start: timeStart,
                end: timeEnd,
            },
        };
        await onConfirm(data);
    };

    const getPreviewMessage = () =>
        buildOrderConfirmationMessage({
            order,
            language,
            customerName,
            customerPhone,
            delivery: buildDelivery(),
            timeWindow: { start: timeStart, end: timeEnd },
            totals,
            productLabelMap,
        });

    // Render nothing if not open (or could use CSS visibility/opacity for animation)
    if (!isOpen) return null;

    const isConfirmMode = mode === 'confirm';
    const title = isConfirmMode ? "Confirmar Pedido" : "Editar Detalles del Pedido";
    const confirmButtonText = isConfirmMode ? "Confirmar y Enviar" : "Guardar Cambios";
    const ConfirmIcon = isConfirmMode ? Check : Save;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--gd-color-forest)]">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">

                    {/* Section: Customer & Language */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--gd-color-text-muted)] uppercase tracking-wide">Cliente</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Nombre</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                />
                            </div>
                            {isConfirmMode && (
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Idioma Mensaje</label>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value as "es" | "en")}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                    >
                                        <option value="es">Español</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            )}
                            {!isConfirmMode && (
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Teléfono</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                    />
                                </div>
                            )}
                        </div>
                        {isConfirmMode && (
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Teléfono</label>
                                <input
                                    type="text"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                />
                            </div>
                        )}
                    </div>

                    {/* Section: Delivery Address */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--gd-color-text-muted)] uppercase tracking-wide">Dirección de Entrega</h3>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Dirección completa</label>
                                <input
                                    type="text"
                                    value={addressLabel}
                                    onChange={(e) => setAddressLabel(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Ciudad</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Zona</label>
                                    <input
                                        type="text"
                                        value={zone}
                                        onChange={(e) => setZone(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Notas de entrega</label>
                                <textarea
                                    value={deliveryNotes}
                                    onChange={(e) => setDeliveryNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section: Time Window */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--gd-color-text-muted)] uppercase tracking-wide">Ventana de Entrega</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Hora Inicio</label>
                                <input
                                    type="time"
                                    value={timeStart}
                                    onChange={(e) => setTimeStart(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Hora Fin</label>
                                <input
                                    type="time"
                                    value={timeEnd}
                                    onChange={(e) => setTimeEnd(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gd-color-leaf)]/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Message (Only in Confirm Mode) */}
                    {isConfirmMode && (
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                            <p className="text-xs font-semibold text-green-700 mb-1">Vista previa del mensaje:</p>
                            <p className="text-xs text-green-800 italic leading-relaxed whitespace-pre-wrap">
                                {getPreviewMessage()}
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-[var(--gd-color-forest)] text-white font-medium text-sm hover:bg-[var(--gd-color-leaf)] transition-colors flex items-center gap-2 shadow-sm"
                    >
                        {loading ? "Procesando..." : (
                            <>
                                <ConfirmIcon className="h-4 w-4" />
                                {confirmButtonText}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
