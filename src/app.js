const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false  // Deshabilitar CSP para desarrollo
}));
app.use(cors());
app.use(morgan('combined'));

// Middlewares para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas principales
app.use('/api/products', productRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'API de Catálogo de Productos',
    version: '1.0.0',
    endpoints: {
      'GET /api/products': 'Obtener todos los productos disponibles',
      'GET /api/products/:id': 'Obtener producto por ID',
      'GET /api/products/stats': 'Obtener estadísticas de productos',
      'GET /api/products/pdf': 'Generar PDF con catálogo de productos',
      'GET /api/products/pdf/detailed': 'Generar PDF detallado de productos'
    },
    timestamp: new Date().toISOString()
  });
});

// Ruta para verificar salud de la API
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware global para manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    SERVIDOR INICIADO                        ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Servidor ejecutándose en: http://localhost:${PORT.toString().padEnd(4)}          ║
║  📱 API Base URL: http://localhost:${PORT.toString().padEnd(4)}/api             ║
║  📊 Health Check: http://localhost:${PORT.toString().padEnd(4)}/health          ║
║  📄 Documentación: http://localhost:${PORT.toString().padEnd(4)}/               ║
║                                                              ║
║  📋 Endpoints principales:                                   ║
║    • GET /api/products - Listar productos                   ║
║    • GET /api/products/:id - Producto por ID                ║
║    • GET /api/products/pdf - Generar PDF                    ║
║    • GET /api/products/stats - Estadísticas                 ║
║                                                              ║
║  🛑 Para detener: Ctrl + C                                  ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error.message);
    process.exit(1);
  }
};

// Manejar cierre graceful del servidor
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

startServer();

module.exports = app;
