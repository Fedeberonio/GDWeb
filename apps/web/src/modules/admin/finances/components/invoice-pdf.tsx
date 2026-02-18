/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
import React from "react";
import type { ComponentType, ReactNode } from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Order } from "@/modules/orders/types";

// Helper to fix potential type issues with ReactPDF.Document
const PdfDoc = Document as unknown as ComponentType<{ children?: ReactNode }>;

// Brand Colors
// Brand Colors (Base)
const COLORS = {
    forest: "#1a472a",
    leaf: "#2d5a3c",
    light: "#f0fdf4",
    text: "#374151",
    textMuted: "#6b7280",
    border: "#e5e7eb",
};

const THEMES = {
    invoice: {
        primary: "#15803d", // Strong Green (green-700)
        secondary: "#166534", // green-800
        headerText: "#ffffff",
        accent: "#f0fdf4", // green-50
        text: "#374151"
    },
    purchase_order: {
        primary: "#86efac", // Pale Green (green-300)
        secondary: "#4ade80", // green-400
        headerText: "#14532d", // Dark green text for contrast
        accent: "#f0fdf4",
        text: "#374151"
    }
};

const BANK_ACCOUNTS = {
    qik: {
        bank: "Banco QIK",
        account: "(DOP) 1006256917 /C.A./",
    },
    popular: {
        bank: "Banco POPULAR",
        account: "(DOP) 819823501 /Cta.Cte./",
    },
};

// PDF Styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: COLORS.text,
        backgroundColor: "#ffffff",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.forest,
        paddingBottom: 15,
    },
    logo: {
        width: 120,
        height: "auto",
        marginBottom: 5,
    },
    headerInfo: {
        alignItems: "flex-end",
    },
    documentTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.forest,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 5,
    },
    documentNumber: {
        fontSize: 12,
        color: COLORS.leaf,
        fontWeight: "bold",
    },
    documentDate: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.forest,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.leaf,
        paddingBottom: 4,
        marginBottom: 10,
        textTransform: "uppercase",
    },
    row: {
        flexDirection: "row",
        marginBottom: 4,
    },
    label: {
        width: 80,
        fontWeight: "bold",
        color: COLORS.leaf,
        fontSize: 9,
    },
    value: {
        flex: 1,
        fontSize: 10,
    },
    table: {
        marginTop: 10,
        borderRadius: 4,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: COLORS.forest,
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    tableHeaderCell: {
        color: "#ffffff",
        fontSize: 9,
        fontWeight: "bold",
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 6,
        paddingHorizontal: 5,
    },
    tableRowAlt: {
        backgroundColor: COLORS.light,
    },
    tableCell: {
        fontSize: 9,
        textAlign: "center",
        justifyContent: "center",
    },
    // Column Widths
    colProduct: { flex: 3, textAlign: "left", paddingLeft: 5 },
    colQty: { width: 40 },
    colPrice: { width: 80, textAlign: "right" },
    colTotal: { width: 80, textAlign: "right", paddingRight: 5 },

    totalsSection: {
        marginTop: 15,
        alignItems: "flex-end",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 5,
        width: 200,
    },
    totalLabel: {
        width: 100,
        textAlign: "right",
        paddingRight: 10,
        color: COLORS.textMuted,
        fontWeight: "bold",
    },
    totalValue: {
        width: 100,
        textAlign: "right",
        fontWeight: "bold",
        color: COLORS.text,
    },
    grandTotal: {
        fontSize: 14,
        color: COLORS.forest,
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 2,
        borderTopColor: COLORS.leaf,
    },
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 10,
    },
    bankInfo: {
        fontSize: 9,
        color: COLORS.textMuted,
        marginBottom: 20,
    },
    bankTitle: {
        fontWeight: "bold",
        color: COLORS.forest,
        marginBottom: 4,
    },
    thankYou: {
        textAlign: "center",
        fontSize: 10,
        color: COLORS.forest,
        fontWeight: "bold",
        fontStyle: "italic",
    },
});

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
    }).format(amount);
}

export function OrderDocumentPDF({ order, type = "invoice" }: { order: Order; type?: "purchase_order" | "invoice" }) {
    const subtotal = order.totals.subtotal.amount;
    const deliveryFee = order.totals.deliveryFee?.amount || 0;
    const paymentFee = order.totals.paymentFee?.amount || 0;
    const discount = order.totals.discounts?.amount || 0;
    const returnDiscount = order.returnsPackaging?.returned ? (order.returnsPackaging.discountAmount || 0) : 0;
    const otherDiscount = Math.max(0, discount - returnDiscount);
    const tip = order.totals.tip?.amount || order.tip?.amount || 0;
    const total = order.totals.total.amount;

    const theme = THEMES[type] || THEMES.invoice;

    const title = type === "invoice" ? "FACTURA" : "ORDEN DE COMPRA";
    const documentId = type === "invoice"
        ? `Factura #: ${order.id}`
        : `Orden #: ${order.id}`;

    // Dynamic Styles
    const dynamicStyles = {
        headerRow: {
            borderBottomColor: theme.primary,
        },
        documentTitle: {
            color: theme.primary,
        },
        documentNumber: {
            color: theme.secondary,
        },
        sectionTitle: {
            color: theme.primary,
            borderBottomColor: theme.secondary,
        },
        label: {
            color: theme.secondary,
        },
        tableHeader: {
            backgroundColor: theme.primary,
        },
        tableHeaderCell: {
            color: theme.headerText,
        },
        totalLabel: {
            color: theme.text, // Keep logic simple or use muted
        },
        grandTotal: {
            color: theme.primary,
            borderTopColor: theme.secondary,
        },
        grandTotalValue: {
            color: theme.primary,
        },
        thankYou: {
            color: theme.primary,
        }
    };

    return (
        <PdfDoc>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={[styles.headerRow, dynamicStyles.headerRow]}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image
                        src="/assets/images/logo/favicon.png"
                        style={styles.logo}
                    />
                    <View style={styles.headerInfo}>
                        <Text style={[styles.documentTitle, dynamicStyles.documentTitle]}>{title}</Text>
                        <Text style={[styles.documentNumber, dynamicStyles.documentNumber]}>{documentId}</Text>
                        <Text style={styles.documentDate}>
                            Fecha: {new Date(order.createdAt).toLocaleDateString("es-DO")}
                        </Text>
                    </View>
                </View>

                {/* Información del Cliente */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Información del Cliente</Text>
                    <View style={styles.row}>
                        <Text style={[styles.label, dynamicStyles.label]}>Cliente:</Text>
                        <Text style={styles.value}>{order.delivery.address.contactName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.label, dynamicStyles.label]}>Teléfono:</Text>
                        <Text style={styles.value}>{order.delivery.address.phone}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={[styles.label, dynamicStyles.label]}>Dirección:</Text>
                        <Text style={styles.value}>
                            {order.delivery.address.label}, {order.delivery.address.city}, {order.delivery.address.zone}
                        </Text>
                    </View>
                </View>

                {/* Detalles del Pedido - Tabla */}
                <View style={styles.table}>
                    <View style={[styles.tableHeader, dynamicStyles.tableHeader]}>
                        <Text style={[styles.tableHeaderCell, styles.colProduct, dynamicStyles.tableHeaderCell]}>DESCRIPCIÓN</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty, dynamicStyles.tableHeaderCell]}>CANT.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPrice, dynamicStyles.tableHeaderCell]}>PRECIO</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal, dynamicStyles.tableHeaderCell]}>TOTAL</Text>
                    </View>
                    {order.items.map((item, index) => (
                        <View key={index} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                            <Text style={[styles.tableCell, styles.colProduct]}>
                                {item.name.es} {item.metadata?.variant ? `(${item.metadata.variant})` : ""}
                            </Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice.amount)}</Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>
                                {formatCurrency(item.unitPrice.amount * item.quantity)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Totales */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
                    </View>
                    {deliveryFee > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Envío:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(deliveryFee)}</Text>
                        </View>
                    )}
                    {paymentFee > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Cargo pago digital:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(paymentFee)}</Text>
                        </View>
                    )}
                    {returnDiscount > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Desc. devolución envases:</Text>
                            <Text style={styles.totalValue}>-{formatCurrency(returnDiscount)}</Text>
                        </View>
                    )}
                    {otherDiscount > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Descuento:</Text>
                            <Text style={styles.totalValue}>-{formatCurrency(otherDiscount)}</Text>
                        </View>
                    )}
                    {tip > 0 && (
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Propina:</Text>
                            <Text style={styles.totalValue}>{formatCurrency(tip)}</Text>
                        </View>
                    )}
                    <View style={[styles.totalRow, styles.grandTotal, dynamicStyles.grandTotal]}>
                        <Text style={[styles.totalLabel, dynamicStyles.grandTotalValue]}>TOTAL:</Text>
                        <Text style={[styles.totalValue, dynamicStyles.grandTotalValue]}>{formatCurrency(total)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    {/* Solo mostrar datos bancarios si es Factura */}
                    {type === "invoice" && (
                        <View style={styles.bankInfo}>
                            <Text style={[styles.bankTitle, { color: theme.primary }]}>Datos Bancarios para Transferencia:</Text>
                            <Text>{BANK_ACCOUNTS.popular.bank}: {BANK_ACCOUNTS.popular.account}</Text>
                            <Text>{BANK_ACCOUNTS.qik.bank}: {BANK_ACCOUNTS.qik.account}</Text>
                            <Text>Beneficiario: Federico Beron</Text>
                        </View>
                    )}

                    <Text style={[styles.thankYou, dynamicStyles.thankYou]}>
                        ¡Gracias por preferir productos frescos de GreenDolio!
                    </Text>
                </View>
            </Page>
        </PdfDoc>
    );
}

// Keep existing exports for backward compatibility if needed, but alias them
export const InvoicePDF = ({ order }: { order: Order }) => <OrderDocumentPDF order={order} type="invoice" />;
