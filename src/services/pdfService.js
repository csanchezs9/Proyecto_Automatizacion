const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  static generateProductsPDF(products, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        
        // Stream del archivo
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Título del documento
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .text('CATÁLOGO DE PRODUCTOS', { align: 'center' })
           .moveDown(2);

        // Fecha de generación
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' })
           .moveDown(2);

        // Encabezados de tabla
        const startX = 50;
        let currentY = doc.y;
        
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .text('ID', startX, currentY, { width: 40 })
           .text('NOMBRE', startX + 45, currentY, { width: 120 })
           .text('DESCRIPCIÓN', startX + 170, currentY, { width: 150 })
           .text('PRECIO', startX + 325, currentY, { width: 80 })
           .text('IMAGEN', startX + 410, currentY, { width: 100 });

        // Línea separadora
        currentY += 15;
        doc.moveTo(startX, currentY)
           .lineTo(550, currentY)
           .stroke();

        currentY += 10;

        // Datos de productos
        products.forEach((product, index) => {
          // Verificar si necesitamos una nueva página
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          doc.font('Helvetica')
             .fontSize(9)
             .text(product.id.toString(), startX, currentY, { width: 40 })
             .text(product.nombre || 'N/A', startX + 45, currentY, { width: 120 })
             .text(product.descripcion || 'Sin descripción', startX + 170, currentY, { width: 150 })
             .text(`$${product.precio || '0.00'}`, startX + 325, currentY, { width: 80 })
             .text(product.imagen_url || 'Sin imagen', startX + 410, currentY, { width: 100 });

          currentY += 20;

          // Línea separadora cada 5 productos
          if ((index + 1) % 5 === 0) {
            doc.moveTo(startX, currentY)
               .lineTo(550, currentY)
               .strokeOpacity(0.3)
               .stroke()
               .strokeOpacity(1);
            currentY += 10;
          }
        });

        // Resumen final
        doc.moveDown(2)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`Total de productos: ${products.length}`, { align: 'center' });

        // Finalizar el documento
        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  static async generateDetailedPDF(products, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Título
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('CATÁLOGO DETALLADO DE PRODUCTOS', { align: 'center' })
           .moveDown(1);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' })
           .moveDown(2);

        // Productos detallados
        products.forEach((product, index) => {
          // Nueva página para cada producto (excepto el primero)
          if (index > 0) {
            doc.addPage();
          }

          // Título del producto
          doc.fontSize(18)
             .font('Helvetica-Bold')
             .text(`${product.nombre || 'Producto sin nombre'}`, { align: 'left' })
             .moveDown(1);

          // Información del producto
          doc.fontSize(12)
             .font('Helvetica')
             .text(`ID: ${product.id}`)
             .text(`Precio: $${product.precio || '0.00'}`)
             .text(`Imagen: ${product.imagen_url || 'No disponible'}`)
             .moveDown(1);

          // Descripción
          doc.font('Helvetica-Bold')
             .text('Descripción:')
             .font('Helvetica')
             .text(product.descripcion || 'Sin descripción disponible', { 
               width: 500,
               align: 'justify'
             })
             .moveDown(2);

          // Separador
          doc.moveTo(50, doc.y)
             .lineTo(550, doc.y)
             .stroke();
        });

        doc.end();

        stream.on('finish', () => {
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService;
