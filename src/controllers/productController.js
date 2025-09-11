const { pool } = require('../config/database');
const PDFService = require('../services/pdfService');
const path = require('path');
const fs = require('fs');

class ProductController {
  // Obtener todos los productos disponibles
  static async getAllProducts(req, res) {
    try {
      const query = `
        SELECT id, nombre, descripcion, precio, imagen_url, creado_en 
        FROM productos 
        ORDER BY id ASC
      `;
      
      const result = await pool.query(query);
      
      res.status(200).json({
        success: true,
        message: 'Productos obtenidos exitosamente',
        data: result.rows,
        count: result.rows.length
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
      
      const query = `
        SELECT id, nombre, descripcion, precio, imagen_url, creado_en 
        FROM productos 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado o no disponible'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Producto obtenido exitosamente',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Generar PDF con todos los productos
  static async generateProductsPDF(req, res) {
    try {
      const query = `
        SELECT id, nombre, descripcion, precio, imagen_url, creado_en 
        FROM productos 
        ORDER BY id ASC
      `;
      
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron productos disponibles'
        });
      }

      // Generar nombre único para el archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `productos-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '../../uploads', fileName);

      // Asegurar que el directorio existe
      const uploadsDir = path.dirname(outputPath);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generar el PDF
      await PDFService.generateProductsPDF(result.rows, outputPath);

      // Enviar el archivo como respuesta
      res.download(outputPath, fileName, (err) => {
        if (err) {
          console.error('Error al enviar el archivo:', err);
          return res.status(500).json({
            success: false,
            message: 'Error al generar el PDF'
          });
        }

        // Eliminar el archivo después de enviarlo (opcional)
        setTimeout(() => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        }, 5000); // Eliminar después de 5 segundos
      });

    } catch (error) {
      console.error('Error al generar PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF',
        error: error.message
      });
    }
  }

  // Generar PDF detallado con todos los productos
  static async generateDetailedPDF(req, res) {
    try {
      const query = `
        SELECT id, nombre, descripcion, precio, imagen_url, creado_en 
        FROM productos 
        ORDER BY id ASC
      `;
      
      const result = await pool.query(query);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron productos disponibles'
        });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `productos-detallado-${timestamp}.pdf`;
      const outputPath = path.join(__dirname, '../../uploads', fileName);

      const uploadsDir = path.dirname(outputPath);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      await PDFService.generateDetailedPDF(result.rows, outputPath);

      res.download(outputPath, fileName, (err) => {
        if (err) {
          console.error('Error al enviar el archivo:', err);
          return res.status(500).json({
            success: false,
            message: 'Error al generar el PDF detallado'
          });
        }

        setTimeout(() => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        }, 5000);
      });

    } catch (error) {
      console.error('Error al generar PDF detallado:', error);
      res.status(500).json({
        success: false,
        message: 'Error al generar el PDF detallado',
        error: error.message
      });
    }
  }

  // Obtener estadísticas de productos
  static async getProductStats(req, res) {
    try {
      const queries = {
        total: 'SELECT COUNT(*) as total FROM productos',
        avgPrice: 'SELECT AVG(precio) as promedio FROM productos',
        maxPrice: 'SELECT MAX(precio) as maximo FROM productos',
        minPrice: 'SELECT MIN(precio) as minimo FROM productos'
      };

      const results = await Promise.all(
        Object.values(queries).map(query => pool.query(query))
      );

      const stats = {
        total_productos: parseInt(results[0].rows[0].total),
        precio_promedio: parseFloat(results[1].rows[0].promedio || 0).toFixed(2),
        precio_maximo: parseFloat(results[2].rows[0].maximo || 0).toFixed(2),
        precio_minimo: parseFloat(results[3].rows[0].minimo || 0).toFixed(2)
      };

      res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;
