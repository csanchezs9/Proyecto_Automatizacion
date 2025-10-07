'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirigir a la interfaz original HTML
    window.location.href = '/index.html';
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
      color: '#fff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Redirigiendo a la interfaz original...</h1>
        <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
          Si no se redirige automáticamente, <a href="/index.html" style={{ color: '#00d4ff' }}>haz clic aquí</a>
        </p>
      </div>
    </div>
  );
}
