"use client";

// Página de error global - Evitar prerenderizado completamente
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Evitar que Next.js intente prerenderizar esta página
export const generateStaticParams = () => [];

export default function GlobalError({ reset }: { reset: () => void }) {
  // Retornar null durante build para evitar prerenderizado
  if (typeof window === 'undefined') {
    return null;
  }

  // Solo renderizar en el cliente
  return (
    <div style={{margin:0,padding:0,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'#ffffff',fontFamily:'system-ui,-apple-system,sans-serif'}}>
      <div style={{textAlign:'center',padding:'24px'}}>
        <p style={{fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.3em',color:'#6c6c6c',margin:'0 0 12px 0'}}>Ups, algo salió mal</p>
        <h1 style={{fontSize:'24px',fontWeight:600,color:'#1a1a1a',margin:'0 0 24px 0'}}>No pudimos cargar esta página</h1>
        <button 
          type="button" 
          onClick={reset}
          style={{display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:'9999px',backgroundColor:'#2d5016',padding:'8px 16px',fontSize:'14px',fontWeight:600,color:'#ffffff',border:'none',cursor:'pointer'}}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
