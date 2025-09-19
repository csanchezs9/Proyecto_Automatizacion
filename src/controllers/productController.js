const { pool } = require('../config/database');
const PDFService = require('../services/pdfService');
const ImageUploadService = require('../services/imageUploadService');
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

      // Retornar información del archivo generado
      res.status(200).json({
        success: true,
        message: 'PDF generado exitosamente',
        data: {
          filename: fileName,
          downloadUrl: `/api/products/download/${fileName}`,
          timestamp: new Date().toISOString(),
          totalProducts: result.rows.length
        }
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

  // Crear nuevo producto
  static async createProduct(req, res) {
    try {
      const { nombre, descripcion, precio, imagen_url } = req.body;
      let finalImageUrl = imagen_url || null;

      // Validaciones básicas
      if (!nombre || !descripcion || precio === undefined) {
        console.log('❌ Validación fallida: campos obligatorios');
        return res.status(400).json({
          success: false,
          message: 'Nombre, descripción y precio son campos obligatorios'
        });
      }

      if (precio < 0) {
        console.log('❌ Validación fallida: precio negativo');
        return res.status(400).json({
          success: false,
          message: 'El precio debe ser mayor o igual a 0'
        });
      }

      // Manejar subida de imagen si se proporciona un archivo
      if (req.files && req.files.imagen) {
        try {
          const imageUploadService = new ImageUploadService();
          const uploadResult = await imageUploadService.processUploadedFile(req.files.imagen);
          
          if (!uploadResult.success) {
            return res.status(400).json({
              success: false,
              message: 'Error al subir imagen',
              error: uploadResult.error
            });
          }
          
          finalImageUrl = uploadResult.url;
          
        } catch (imageError) {
          console.error('Error al procesar imagen:', imageError);
          return res.status(500).json({
            success: false,
            message: 'Error al procesar la imagen',
            error: imageError.message
          });
        }
      }

      // Insertar producto en la base de datos con la URL de imagen final
      const query = `
        INSERT INTO productos (nombre, descripcion, precio, imagen_url, creado_en) 
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
        RETURNING id, nombre, descripcion, precio, imagen_url, creado_en
      `;
      
      const result = await pool.query(query, [nombre, descripcion, precio, finalImageUrl]);
      
      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: result.rows[0],
        imageUploaded: finalImageUrl !== imagen_url
      });
      
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Eliminar producto
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      
      // Primero verificar si el producto existe y obtener la URL de imagen
      const checkQuery = 'SELECT id, nombre, imagen_url FROM productos WHERE id = $1';
      const checkResult = await pool.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const producto = checkResult.rows[0];
      let imageDeleted = false;

      // Intentar eliminar imagen de Supabase Storage si existe
      if (producto.imagen_url) {
        try {
          const imageUploadService = new ImageUploadService();
          const filePath = imageUploadService.extractFilePathFromUrl(producto.imagen_url);
          
          if (filePath) {
            const deleteImageResult = await imageUploadService.deleteImage(filePath);
            imageDeleted = deleteImageResult.success;
            
            if (!deleteImageResult.success) {
              console.warn('No se pudo eliminar la imagen:', deleteImageResult.error);
            }
          }
        } catch (imageError) {
          console.warn('Error al eliminar imagen (continuando con eliminación del producto):', imageError.message);
        }
      }

      // Eliminar el producto de la base de datos
      const deleteQuery = 'DELETE FROM productos WHERE id = $1 RETURNING id, nombre, imagen_url';
      const deleteResult = await pool.query(deleteQuery, [id]);
      
      res.status(200).json({
        success: true,
        message: 'Producto eliminado exitosamente',
        data: {
          id: deleteResult.rows[0].id,
          nombre: deleteResult.rows[0].nombre,
          imageDeleted: imageDeleted
        }
      });
    } catch (error) {
      console.error('Error al eliminar producto:', error);
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

  // Descargar archivo PDF generado
  static async downloadPDF(req, res) {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../../uploads', filename);

      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      // Enviar el archivo para descarga
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error('Error al descargar archivo:', err);
          return res.status(500).json({
            success: false,
            message: 'Error al descargar el archivo'
          });
        }

        // Eliminar el archivo después de descargarlo
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 10000); // Eliminar después de 10 segundos
      });

    } catch (error) {
      console.error('Error en descarga:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Probar conexión con Supabase Storage
  static async testStorageConnection(req, res) {
    try {
      console.log('🧪 Probando conexión con Supabase Storage...');
      
      const ImageUploadService = require('../services/imageUploadService');
      const imageService = new ImageUploadService();
      
      // Probar listando archivos del bucket
      const listResult = await imageService.listImages();
      
      res.status(200).json({
        success: true,
        message: 'Conexión con Supabase Storage exitosa',
        data: {
          bucketName: imageService.bucketName,
          filesCount: listResult.success ? listResult.files.length : 0,
          listResult: listResult
        }
      });
      
    } catch (error) {
      console.error('❌ Error al probar Storage:', error);
      res.status(500).json({
        success: false,
        message: 'Error al conectar con Supabase Storage',
        error: error.message
      });
    }
  }
}

module.exports = ProductController;
