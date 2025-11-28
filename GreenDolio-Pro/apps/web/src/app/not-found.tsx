// Página 404 - Sin layout para evitar styled-jsx durante prerenderizado
// Esta página NO usa el layout principal para evitar problemas con styled-jsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Retornar HTML puro sin JSX que active styled-jsx
export default function NotFound() {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <title>404 - Página no encontrada | Green Dolio</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning style={{ margin: 0, padding: 0 }}>
        <div
          style={{
            margin: 0,
            padding: 0,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <p
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.3em',
                color: '#6c6c6c',
                margin: '0 0 12px 0',
              }}
            >
              404
            </p>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#1a1a1a',
                margin: '0 0 12px 0',
              }}
            >
              No encontramos esta página
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: '#6c6c6c',
                margin: '0 0 24px 0',
              }}
            >
              Vuelve al inicio para seguir explorando.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '9999px',
                backgroundColor: '#2d5016',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
