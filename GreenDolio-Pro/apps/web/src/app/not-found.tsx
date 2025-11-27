// Página de error sin layout para evitar styled-jsx durante prerenderizado
// Usar export const dynamic para forzar renderizado dinámico
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function NotFound() {
  // Retornar HTML simple sin JSX que active styled-jsx
  return (
    <html lang="es">
      <head>
        <title>404 - Página no encontrada | Green Dolio</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div id="not-found-root"></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var root = document.getElementById('not-found-root');
                if (!root) return;
                root.innerHTML = '<div style="margin:0;padding:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background-color:#ffffff;font-family:system-ui,-apple-system,sans-serif"><div style="text-align:center;padding:24px"><p style="font-size:12px;text-transform:uppercase;letter-spacing:0.3em;color:#6c6c6c;margin:0 0 12px 0">404</p><h1 style="font-size:24px;font-weight:600;color:#1a1a1a;margin:0 0 12px 0">No encontramos esta página</h1><p style="font-size:14px;color:#6c6c6c;margin:0 0 24px 0">Vuelve al inicio para seguir explorando.</p><a href="/" style="display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;background-color:#2d5016;padding:8px 16px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none">Ir al inicio</a></div></div>';
              })();
            `,
          }}
        />
        <noscript>
          <div style={{ margin: 0, padding: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            <div style={{ textAlign: "center", padding: "24px" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.3em", color: "#6c6c6c", margin: "0 0 12px 0" }}>404</p>
              <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 12px 0" }}>No encontramos esta página</h1>
              <p style={{ fontSize: "14px", color: "#6c6c6c", margin: "0 0 24px 0" }}>Vuelve al inicio para seguir explorando.</p>
              <a href="/" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "9999px", backgroundColor: "#2d5016", padding: "8px 16px", fontSize: "14px", fontWeight: 600, color: "#ffffff", textDecoration: "none" }}>
                Ir al inicio
              </a>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  );
}
