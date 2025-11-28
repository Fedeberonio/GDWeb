// Página 404 - Evitar prerenderizado completamente
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Evitar que Next.js intente generar esta página estáticamente
export const generateStaticParams = async () => {
  return [];
};

export default function NotFound() {
  // Retornar HTML simple sin JSX que active styled-jsx
  if (typeof window === 'undefined') {
    // Durante SSR, retornar null para evitar prerenderizado
    return null;
  }
  
  // En el cliente, renderizar normalmente
  return (
    <div style={{
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.3em',
          color: '#6c6c6c',
          margin: '0 0 12px 0'
        }}>404</p>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#1a1a1a',
          margin: '0 0 12px 0'
        }}>No encontramos esta página</h1>
        <p style={{
          fontSize: '14px',
          color: '#6c6c6c',
          margin: '0 0 24px 0'
        }}>Vuelve al inicio para seguir explorando.</p>
        <a href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          backgroundColor: '#2d5016',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#ffffff',
          textDecoration: 'none'
        }}>Ir al inicio</a>
      </div>
    </div>
  );
}

