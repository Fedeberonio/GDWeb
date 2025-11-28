// Página 404 - HTML puro para evitar styled-jsx durante prerenderizado
// Usa dangerouslySetInnerHTML para evitar que Next.js procese JSX que active styled-jsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function NotFound() {
  const bodyContent = `
    <div style="margin:0;padding:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background-color:#ffffff;font-family:system-ui,-apple-system,sans-serif">
      <div style="text-align:center;padding:24px">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.3em;color:#6c6c6c;margin:0 0 12px 0">404</p>
        <h1 style="font-size:24px;font-weight:600;color:#1a1a1a;margin:0 0 12px 0">No encontramos esta página</h1>
        <p style="font-size:14px;color:#6c6c6c;margin:0 0 24px 0">Vuelve al inicio para seguir explorando.</p>
        <a href="/" style="display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;background-color:#2d5016;padding:8px 16px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">Ir al inicio</a>
      </div>
    </div>
  `;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>404 - Página no encontrada | Green Dolio</title>
      </head>
      <body suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </html>
  );
}
