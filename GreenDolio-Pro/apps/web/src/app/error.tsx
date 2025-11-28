"use client";

// Página de error global - HTML puro para evitar styled-jsx durante prerenderizado
// Usa dangerouslySetInnerHTML para evitar que Next.js procese JSX que active styled-jsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function GlobalError({ reset }: { reset: () => void }) {
  // Usar useEffect para manejar el click del botón sin JSX que active styled-jsx
  if (typeof window !== 'undefined') {
    const handleReset = () => {
      const button = document.getElementById('error-reset-button');
      if (button) {
        button.addEventListener('click', () => {
          reset();
        });
      }
    };
    setTimeout(handleReset, 0);
  }

  const bodyContent = `
    <div style="margin:0;padding:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background-color:#ffffff;font-family:system-ui,-apple-system,sans-serif">
      <div style="text-align:center;padding:24px">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:0.3em;color:#6c6c6c;margin:0 0 12px 0">Ups, algo salió mal</p>
        <h1 style="font-size:24px;font-weight:600;color:#1a1a1a;margin:0 0 24px 0">No pudimos cargar esta página</h1>
        <button id="error-reset-button" type="button" style="display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;background-color:#2d5016;padding:8px 16px;font-size:14px;font-weight:600;color:#ffffff;border:none;cursor:pointer">Reintentar</button>
      </div>
    </div>
    <script>
      (function() {
        var button = document.getElementById('error-reset-button');
        if (button) {
          button.addEventListener('click', function() {
            window.location.reload();
          });
        }
      })();
    </script>
  `;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error | Green Dolio</title>
      </head>
      <body suppressHydrationWarning dangerouslySetInnerHTML={{ __html: bodyContent }} />
    </html>
  );
}
