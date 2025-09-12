const PDFService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

// Datos de ejemplo para demostración
const PRODUCTOS_DEMO = [
  {
    id: 1,
    nombre: "Laptop Gaming RGB",
    descripcion: "Laptop de alta gama para gaming con iluminación RGB personalizable",
    precio: 1299.99,
    imagen_url: "https://example.com/laptop-gaming.jpg",
    creado_en: new Date('2024-01-15T10:00:00Z')
  },
  {
    id: 2,
    nombre: "Mouse Inalámbrico Pro",
    descripcion: "Mouse ergonómico de precisión para profesionales",
    precio: 79.99,
    imagen_url: "https://example.com/mouse-pro.jpg",
    creado_en: new Date('2024-01-16T14:30:00Z')
  },
  {
    id: 3,
    nombre: "Teclado Mecánico RGB",
    descripcion: "Teclado mecánico con switches Cherry MX y retroiluminación RGB",
    precio: 149.99,
    imagen_url: "https://example.com/teclado-mecanico.jpg",
    creado_en: new Date('2024-01-17T09:15:00Z')
  },
  {
    id: 4,
    nombre: "Monitor 4K Ultra",
    descripcion: "Monitor 27 pulgadas 4K con HDR y 144Hz para gaming profesional",
    precio: 599.99,
    imagen_url: "https://example.com/monitor-4k.jpg",
    creado_en: new Date('2024-01-18T16:45:00Z')
  },
  {
    id: 5,
    nombre: "Auriculares Gaming 7.1",
    descripcion: "Auriculares con sonido surround 7.1 y micrófono retráctil",
    precio: 89.99,
    imagen_url: "https://example.com/auriculares-gaming.jpg",
    creado_en: new Date('2024-01-19T11:20:00Z')
  }
];

class ProductController {
  // Obtener todos los productos disponibles
  static async getAllProducts(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: 'Productos obtenidos exitosamente (MODO DEMO)',
        data: PRODUCTOS_DEMO,
        count: PRODUCTOS_DEMO.length,
        note: 'Estos son datos de demostración. Para usar datos reales, configure PostgreSQL.'
      });
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener producto por ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const productId = parseInt(id);
      
      const producto = PRODUCTOS_DEMO.find(p => p.id === productId);
      
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Producto encontrado exitosamente (MODO DEMO)',
        data: producto,
        note: 'Estos son datos de demostración. Para usar datos reales, configure PostgreSQL.'
      });
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de productos
  static async getProductStats(req, res) {
    try {
      const totalProductos = PRODUCTOS_DEMO.length;
      const precioPromedio = PRODUCTOS_DEMO.reduce((sum, p) => sum + p.precio, 0) / totalProductos;
      const productoMasCaro = PRODUCTOS_DEMO.reduce((max, p) => p.precio > max.precio ? p : max);
      const productoMasBarato = PRODUCTOS_DEMO.reduce((min, p) => p.precio < min.precio ? p : min);
      
      const stats = {
        total_productos: totalProductos,
        precio_promedio: Math.round(precioPromedio * 100) / 100,
        producto_mas_caro: {
          nombre: productoMasCaro.nombre,
          precio: productoMasCaro.precio
        },
        producto_mas_barato: {
          nombre: productoMasBarato.nombre,
          precio: productoMasBarato.precio
        },
        total_valor_inventario: Math.round(PRODUCTOS_DEMO.reduce((sum, p) => sum + p.precio, 0) * 100) / 100
      };
      
      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente (MODO DEMO)',
        data: stats,
        note: 'Estos son datos de demostración. Para usar datos reales, configure PostgreSQL.'
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Generar PDF con catálogo de productos
  static async generateProductPDF(req, res) {
    try {
      console.log('🔄 Iniciando generación de PDF...');
      
      const pdfBuffer = await PDFService.generateProductCatalog(PRODUCTOS_DEMO);
      
      const filename = `catalogo_productos_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log('✅ PDF generado exitosamente');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF',
        error: error.message
      });
    }
  }

  // Generar PDF detallado de productos
  static async generateDetailedProductPDF(req, res) {
    try {
      console.log('🔄 Iniciando generación de PDF detallado...');
      
      const pdfBuffer = await PDFService.generateDetailedProductCatalog(PRODUCTOS_DEMO);
      
      const filename = `catalogo_detallado_${new Date().toISOString().split('T')[0]}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log('✅ PDF detallado generado exitosamente');
      res.send(pdfBuffer);
    } catch (error) {
      console.error('❌ Error al generar PDF detallado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF detallado',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;