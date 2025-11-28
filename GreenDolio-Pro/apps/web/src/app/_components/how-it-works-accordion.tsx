"use client";

import { useState } from "react";
import Link from "next/link";

const STEPS = [
  {
    step: "1",
    icon: "📦",
    title: "Elige tu caja",
    description: "3 días, 7 días o 14 días. Cada una viene pre-armada con productos frescos.",
    color: "from-[var(--gd-color-leaf)]/40 to-[var(--gd-color-sprout)]/40",
  },
  {
    step: "2",
    icon: "🎨",
    title: "Personaliza",
    description: "Acepta la caja tal cual o haz cambios de productos.",
    color: "from-[var(--gd-color-sky)]/40 to-[var(--gd-color-sprout)]/40",
  },
  {
    step: "3",
    icon: "➕",
    title: "Agrega otros productos",
    description: "Complementa tu pedido con ensaladas, jugos o productos frescos.",
    color: "from-[var(--gd-color-avocado)]/40 to-[var(--gd-color-leaf)]/40",
  },
  {
    step: "4",
    icon: "✅",
    title: "Confirma tu pedido",
    description: "Te contactamos por WhatsApp para confirmar y coordinar la entrega.",
    color: "from-[var(--gd-color-leaf)]/40 to-[var(--gd-color-avocado)]/40",
  },
  {
    step: "5",
    icon: "🚚",
    title: "Recibe fresco",
    description: "Delivery gratis L/M/V. Productos seleccionados el mismo día.",
    color: "from-[var(--gd-color-sky)]/40 to-[var(--gd-color-leaf)]/40",
  },
] as const;

export function HowItWorksAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-[var(--gd-color-leaf)]/20 bg-white/80 p-6 shadow-soft md:p-8 transition">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gd-color-leaf)]/20 to-[var(--gd-color-sprout)]/30 px-4 py-1.5 border-2 border-[var(--gd-color-leaf)]/30 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-[var(--gd-color-forest)]">
            <span className="text-sm">⭐</span>
            Cajas pre-armadas · Cómo funciona
          </div>
          <h3 className="font-display text-xl bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent sm:text-2xl">
            Elige tu caja y personalízala en cinco pasos
          </h3>
          <p className="text-xs leading-relaxed text-[var(--gd-color-forest)] md:text-sm max-w-2xl">
            Cada caja viene pre-armada con productos frescos seleccionados el mismo día. Puedes aceptarla tal cual o hacer cambios.
            <strong className="text-[var(--gd-color-leaf)]"> Pero de todas maneras, excedido el peso o cantidad, no te preocupes: podés pedir lo que quieras y transformar tu pedido a la &quot;carta&quot;.</strong>
          </p>
          <button
            type="button"
            className="rounded-full border border-[var(--gd-color-leaf)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gd-color-forest)] transition hover:bg-[var(--gd-color-leaf)]/10"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
          >
            {isOpen ? "Ocultar pasos" : "Ver pasos"}
          </button>

          {/* CTA principal - Movido desde Hero */}
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center pt-2">
            <Link
              href="/armar"
              className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--gd-color-forest)] bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-[var(--gd-color-leaf)] hover:via-[var(--gd-color-avocado)] hover:to-[var(--gd-color-leaf)] hover:scale-105 hover:shadow-xl hover:-translate-y-0.5"
            >
              <span className="text-base group-hover:rotate-12 transition-transform">✨</span>
              <span>Arma tu caja ahora</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="#catalogo"
              className="inline-flex items-center justify-center rounded-full border-2 border-[var(--gd-color-leaf)] bg-white/95 px-6 py-2.5 text-sm font-bold text-[var(--gd-color-forest)] backdrop-blur-sm transition-all duration-300 hover:border-[var(--gd-color-forest)] hover:bg-[var(--gd-color-sprout)]/80 hover:scale-105 hover:shadow-lg hover:-translate-y-0.5"
            >
              Ver todos los productos
            </Link>
          </div>
        </div>

        {isOpen && (
          <div className="grid gap-4 md:grid-cols-5">
            {STEPS.map((item) => (
              <div
                key={item.step}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--gd-color-leaf)]/30 bg-[var(--gd-color-sky)]/5 p-3 text-center transition"
              >
                <div className="relative">
                  <div className={`rounded-full bg-gradient-to-br ${item.color} p-3 border-2 border-[var(--gd-color-leaf)]/50 shadow-sm`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gd-color-forest)] text-[0.65rem] font-bold text-white shadow-md border-2 border-white">
                    {item.step}
                  </div>
                </div>
                <h4 className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-[var(--gd-color-forest)]">
                  {item.title}
                </h4>
                <p className="text-[0.65rem] leading-tight text-[var(--color-muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
