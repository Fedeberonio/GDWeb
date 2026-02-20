import Link from "next/link";

export default function TerminosDeUsoPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-[var(--color-foreground)]">
      <h1 className="font-display text-4xl mb-6">Términos de Uso</h1>
      <p className="mb-4 text-[var(--color-muted)]">
        Al utilizar Green Dolio aceptas nuestras condiciones de compra, disponibilidad de productos y políticas de entrega.
      </p>
      <p className="mb-4 text-[var(--color-muted)]">
        Los precios y disponibilidad pueden variar por temporada. Confirmaremos cada pedido por WhatsApp antes de despacho.
      </p>
      <Link href="/" className="text-[var(--gd-color-forest)] font-semibold hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}

