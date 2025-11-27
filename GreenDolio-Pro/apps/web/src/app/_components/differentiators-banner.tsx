"use client";

export function DifferentiatorsBanner() {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-[var(--gd-color-forest)] via-[var(--gd-color-leaf)] to-[var(--gd-color-forest)] text-white shadow-lg border-b-2 border-[var(--gd-color-leaf)]/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span>Primera empresa sin generar basura</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/30" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🚚</span>
            <span>Delivery gratis L/M/V</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/30" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🌿</span>
            <span>Productores locales exclusivos</span>
          </div>
          <div className="hidden md:block w-px h-6 bg-white/30" />
          <div className="flex items-center gap-2">
            <span className="text-lg">♻️</span>
            <span>Packaging retornable con descuento</span>
          </div>
        </div>
      </div>
    </div>
  );
}

