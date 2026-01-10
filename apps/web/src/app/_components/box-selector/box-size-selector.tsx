"use client";

import type { Box } from "@/modules/catalog/types";

type BoxSizeSelectorProps = {
  boxes: Box[];
  onSelectSize: (box: Box) => void;
};

export function BoxSizeSelector({ boxes, onSelectSize }: BoxSizeSelectorProps) {
  // Ordenar cajas por días (3, 7, 14)
  const sortedBoxes = [...boxes].sort((a, b) => (a.durationDays || 0) - (b.durationDays || 0));

  return (
    <section className="box-size-selector space-y-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-[var(--gd-color-forest)] mb-2">
          ¿Cuántos días quieres abastecer?
        </h2>
        <p className="text-sm text-[var(--color-muted)]">
          Elige el tamaño perfecto para tus necesidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedBoxes.map((box) => {
          const days = box.durationDays || 0;
          const displayName = box.name.es;
          const price = box.price.amount;

          return (
            <div
              key={box.id}
              className="size-card group relative flex flex-col rounded-3xl border-2 border-[var(--gd-color-leaf)]/50 bg-gradient-to-br from-white via-[var(--gd-color-sprout)]/20 to-white p-8 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-[var(--gd-color-leaf)] cursor-pointer"
              onClick={() => onSelectSize(box)}
            >
              {/* Efecto de brillo sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--gd-color-leaf)]/0 via-transparent to-[var(--gd-color-sky)]/0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-3xl" />
              
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="text-6xl mb-2">📦</div>
                
                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-bold text-[var(--gd-color-forest)]">
                    {days} DÍAS
                  </h3>
                  <p className="text-sm font-semibold text-[var(--gd-color-leaf)] uppercase tracking-wide">
                    {displayName}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--gd-color-leaf)]/30 w-full">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-muted)] mb-1">
                    Desde
                  </p>
                  <p className="font-display text-4xl font-bold bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] bg-clip-text text-transparent">
                    RD${price.toLocaleString("es-DO", { minimumFractionDigits: 0 })}
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full mt-4 rounded-2xl bg-gradient-to-r from-[var(--gd-color-forest)] to-[var(--gd-color-leaf)] px-6 py-3 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  Elegir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

