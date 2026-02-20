import Link from "next/link";

export default function PoliticaDeDevolucionesPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-[var(--color-foreground)]">
      <h1 className="font-display text-4xl mb-6">Política de Devoluciones</h1>
      <p className="mb-4 text-[var(--color-muted)]">
        Si un producto llega en mal estado, repórtalo por WhatsApp el mismo día de entrega para gestionarlo de forma prioritaria.
      </p>
      <p className="mb-4 text-[var(--color-muted)]">
        Las devoluciones de envases retornables aplican al beneficio indicado en checkout según las condiciones vigentes.
      </p>
      <Link href="/" className="text-[var(--gd-color-forest)] font-semibold hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}

