import Image from "next/image";

const steps = [
  {
    number: "01",
    title: "Elige tu Caja",
    description: "Selecciona tamaño (3 días, 1 semana, 2 semanas) y variedad (Mix, Fruity, Veggie)",
    icons: [
      "/assets/icons/how_it_works/01_choose_box_sizes.png",
      "/assets/icons/how_it_works/02_choose_variety.png",
    ],
  },
  {
    number: "02",
    title: "Agrega Productos",
    description: "Suma jugos naturales, productos caseros, huevos, miel y más",
    icons: ["/assets/icons/how_it_works/04_add_products.png"],
  },
  {
    number: "03",
    title: "Personaliza",
    description: "Dinos qué te gusta y qué prefieres evitar",
    icons: ["/assets/icons/how_it_works/03_personalize_preferences.png"],
  },
  {
    number: "04",
    title: "Confirmamos y Preparamos",
    description: "Recibe confirmación y armamos tu caja el mismo día de entrega",
    icons: ["/assets/icons/how_it_works/05_confirm_and_prepare.png"],
  },
  {
    number: "05",
    title: "Recibe en tu Puerta",
    description: "Delivery gratuito lunes, miércoles y viernes",
    icons: ["/assets/icons/how_it_works/06_delivery.png"],
  },
];

export default function ComoFuncionaPage() {
  return (
    <main className="min-h-screen bg-[#F5F1E8] text-[#2D5016]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-[#2D5016]/70">Green Dolio</p>
          <h1 className="mt-3 text-4xl font-semibold text-[#2D5016] md:text-5xl">
            ¿Cómo funciona?
          </h1>
          <p className="mt-4 text-base text-[#2D5016]/80 md:text-lg">
            Tu experiencia de la huerta a tu puerta en cinco pasos simples.
          </p>
        </header>

        <div className="space-y-10">
          {steps.map((step) => (
            <section
              key={step.number}
              className="flex flex-col gap-6 rounded-3xl border border-[#2D5016]/10 bg-white/70 p-6 shadow-sm md:flex-row md:items-start"
            >
              <div className="flex items-start gap-4 md:w-1/3">
                <span className="text-4xl font-semibold text-[#2D5016] md:text-5xl">{step.number}</span>
                <div>
                  <h2 className="text-xl font-semibold text-[#2D5016] md:text-2xl">{step.title}</h2>
                  <p className="mt-2 text-sm text-[#2D5016]/70 md:text-base">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-4">
                {step.icons.map((iconSrc, index) => (
                  <div
                    key={`${step.number}-${iconSrc}`}
                    className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#2D5016]/10"
                  >
                    <Image
                      src={iconSrc}
                      alt={`${step.title} icon ${index + 1}`}
                      width={64}
                      height={64}
                      className="h-14 w-14 object-contain"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
