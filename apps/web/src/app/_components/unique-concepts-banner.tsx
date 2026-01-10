"use client";

export function UniqueConceptsBanner() {
  const concepts = [
    {
      icon: "🌱",
      title: "Preparado el mismo día",
      description: "Todo se prepara el día de la entrega. Compromiso de frescura total.",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: "📅",
      title: "De temporada",
      description: "Solo productos de temporada. A la carta disponible para productos fuera de temporada.",
      color: "from-orange-500 to-amber-600",
    },
    {
      icon: "♻️",
      title: "Sin plásticos",
      description: "Empaques 100% retornables, biodegradables y reciclables.",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: "🏝️",
      title: "Único en la isla",
      description: "El único servicio de cajas retornables con productos frescos locales.",
      color: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {concepts.map((concept, index) => (
        <div
          key={index}
          className="group relative overflow-hidden rounded-2xl border-2 border-white/40 bg-gradient-to-br from-white to-[var(--gd-color-sprout)]/20 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 space-y-3">
            <div className="text-4xl">{concept.icon}</div>
            <h3 className="font-display text-lg font-bold text-[var(--gd-color-forest)]">
              {concept.title}
            </h3>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              {concept.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

