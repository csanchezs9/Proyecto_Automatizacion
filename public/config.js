// Configuración de API para Next.js
const API_BASE_URL = '';  // En Next.js, las rutas son relativas

// Actualizar automáticamente las URLs de la API en los archivos HTML
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema cargado - API apuntando a Next.js');
    console.log('📡 API Base URL:', window.location.origin);
});
