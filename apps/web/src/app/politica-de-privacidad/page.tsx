import Link from "next/link";

export default function PoliticaDePrivacidadPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-[var(--color-foreground)]">
      <h1 className="font-display text-4xl mb-6">Política de Privacidad</h1>
      <p className="mb-4 text-[var(--color-muted)]">
        En Green Dolio protegemos tus datos personales y los usamos únicamente para procesar pedidos, coordinar entregas
        y mejorar tu experiencia de compra.
      </p>
      <p className="mb-4 text-[var(--color-muted)]">
        Si deseas actualizar o eliminar tus datos, contáctanos por WhatsApp o correo y te ayudamos de inmediato.
      </p>
      <Link href="/" className="text-[var(--gd-color-forest)] font-semibold hover:underline">
        Volver al inicio
      </Link>
    </main>
  );
}

