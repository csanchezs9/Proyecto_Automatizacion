const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const Jimp = require('jimp');

class PDFService {
  // Función para descargar y comprimir imagen desde Supabase Storage
  static async downloadAndCompressImage(url) {
    try {
      if (!url || url === 'Sin imagen' || url.trim() === '') {
        return null;
      }

      // Construir URL pública de Supabase Storage si es necesario
      let finalUrl = url.trim();
      
      // Si ya es una URL completa, usarla directamente
      if (!finalUrl.startsWith('http')) {
        // Es solo el nombre del archivo, construir URL completa
        finalUrl = `https://xdhymmzmxbaxxmregzuh.supabase.co/storage/v1/object/public/imagenes/${finalUrl}`;
      } else if (finalUrl.includes('supabase.co') && !finalUrl.includes('/storage/v1/object/public/')) {
        // Convertir URL de Supabase a formato público
        const fileName = finalUrl.split('/').pop() || finalUrl;
        finalUrl = `https://xdhymmzmxbaxxmregzuh.supabase.co/storage/v1/object/public/imagenes/${fileName}`;
      }

      console.log(`🔍 Descargando: ${finalUrl}`);

      // Descargar imagen con mejor manejo de errores y configuración optimizada
      const response = await new Promise((resolve, reject) => {
        const request = https.get(finalUrl, {
          timeout: 15000, // Más tiempo para imágenes de mayor calidad
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/jpeg,image/png,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Accept-Encoding': 'gzip, deflate'
          }
        }, (response) => {
          console.log(`📡 Status ${response.statusCode} para ${finalUrl}`);
          
          // Manejar redirecciones
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            console.log('🔄 Redirección a:', redirectUrl);
            request.destroy();
            resolve(PDFService.downloadAndCompressImage(redirectUrl));
            return;
          }
          
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            return;
          }

          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log(`✅ Descargado: ${buffer.length} bytes`);
            resolve(buffer);
          });
          response.on('error', reject);
        });

        request.on('error', (err) => {
          console.error(`❌ Error de red para ${finalUrl}:`, err.message);
          reject(err);
        });
        
        request.setTimeout(10000, () => {
          console.warn(`⏰ Timeout para ${finalUrl}`);
          request.destroy();
          reject(new Error('Timeout de descarga'));
        });
      });

      // Verificar que es una imagen válida y comprimir
      if (!Buffer.isBuffer(response) || response.length === 0) {
        throw new Error('Respuesta vacía o inválida');
      }

      try {
        const image = await Jimp.read(response);
        
        // Mejorar la calidad significativamente para el nuevo layout 3x3
        const compressedBuffer = await image
          .resize(200, 200)    // Tamaño mucho más grande para mejor calidad
          .quality(85)         // Calidad alta para imágenes nítidas
          .getBufferAsync(Jimp.MIME_JPEG);

        console.log(`🎯 Comprimido: ${compressedBuffer.length} bytes (alta calidad)`);
        return compressedBuffer;
      } catch (jimpError) {
        // Si Jimp falla, devolver la imagen original sin comprimir
        console.warn(`⚠️ Jimp falló, usando imagen original: ${jimpError.message}`);
        return response;
      }

    } catch (error) {
      console.warn(`❌ Falló descarga de ${url}: ${error.message}`);
      return null;
    }
  }

  // Descargar imágenes en lotes optimizados
  static async downloadImagesInBatches(products, batchSize = 5) {
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`📦 Procesando ${products.length} productos en lotes de ${batchSize}`);
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`📥 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}`);
      
      const batchPromises = batch.map(async (product) => {
        try {
          const imageBuffer = await PDFService.downloadAndCompressImage(product.imagen_url);
          if (imageBuffer) {
            successCount++;
            return { productId: product.id, imageBuffer };
          } else {
            errorCount++;
            return { productId: product.id, imageBuffer: null };
          }
        } catch (error) {
          errorCount++;
          console.warn(`⚠️ Error en producto ${product.id}:`, error.message);
          return { productId: product.id, imageBuffer: null };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      // Procesar resultados del lote
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          errorCount++;
          console.warn('⚠️ Error en lote:', result.reason);
        }
      });
      
      // Pausa entre lotes para no sobrecargar Supabase
      if (i + batchSize < products.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`📊 Descarga completada: ${successCount} exitosas, ${errorCount} fallidas`);
    return results;
  }


  static async generateProductsPDF(products, outputPath) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🚀 Generando catálogo PDF profesional...');
        const startTime = Date.now();

        // Configuración profesional del documento con márgenes amplios
        const doc = new PDFDocument({ 
          margin: 60,  // Márgenes amplios y simétricos
          compress: true,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: 'Catálogo de Productos',
            Author: 'Sistema de Automatización',
            Subject: 'Catálogo de Productos Profesional',
            Keywords: 'catálogo, productos, PDF, minimalista'
          }
        });
        
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Descargar y comprimir todas las imágenes en lotes de alta calidad
        console.log('📥 Descargando imágenes en alta calidad...');
        const imageResults = await PDFService.downloadImagesInBatches(products, 4);
        const imageMap = new Map();
        imageResults.forEach(result => {
          if (result.imageBuffer) {
            imageMap.set(result.productId, result.imageBuffer);
          }
        });

        console.log(`📄 Generando contenido con ${imageMap.size} imágenes de alta calidad`);

        // Configuración del layout minimalista optimizado para 3 columnas
        const pageConfig = {
          width: 595.28,      // Ancho A4 en puntos
          height: 841.89,     // Alto A4 en puntos
          margin: 60,         // Márgenes amplios y simétricos
          headerHeight: 90,   // Espacio generoso para header moderno
          footerHeight: 50,   // Espacio para footer elegante
        };

        const gridConfig = {
          cols: 3,            // 3 columnas perfectamente alineadas
          rows: 3,            // 3 filas por página 
          productsPerPage: 9, // 3x3 = 9 productos por página
          cardWidth: 150,     // Ancho optimizado para mejor proporción
          cardHeight: 180,    // Alto optimizado para contenido
          imageSize: 110,     // Imagen bien proporcionada
          spacing: 20,        // Espaciado generoso y consistente
        };

        // Calcular posiciones del grid
        const availableWidth = pageConfig.width - (pageConfig.margin * 2);
        const availableHeight = pageConfig.height - pageConfig.headerHeight - pageConfig.footerHeight - (pageConfig.margin * 2);
        
        const totalSpacingX = (gridConfig.cols - 1) * gridConfig.spacing;
        const totalSpacingY = (gridConfig.rows - 1) * gridConfig.spacing;
        
        gridConfig.cardWidth = (availableWidth - totalSpacingX) / gridConfig.cols;
        gridConfig.cardHeight = (availableHeight - totalSpacingY) / gridConfig.rows;

        let currentPage = 1;
        
        // Generar páginas del catálogo
        for (let pageStart = 0; pageStart < products.length; pageStart += gridConfig.productsPerPage) {
          // Nueva página si no es la primera
          if (pageStart > 0) {
            doc.addPage();
            currentPage++;
          }

          // Renderizar header profesional
          PDFService.renderHeader(doc, pageConfig, currentPage, Math.ceil(products.length / gridConfig.productsPerPage));

          // Calcular productos para esta página
          const pageProducts = products.slice(pageStart, pageStart + gridConfig.productsPerPage);
          
          console.log(`📄 Procesando página ${currentPage} con ${pageProducts.length} productos`);

          // Renderizar grid de productos
          PDFService.renderProductsGrid(doc, pageProducts, pageConfig, gridConfig, imageMap);

          // Renderizar footer
          PDFService.renderFooter(doc, pageConfig, currentPage, Math.ceil(products.length / gridConfig.productsPerPage));
        }

        const endTime = Date.now();
        console.log(`✅ Catálogo PDF profesional generado en ${endTime - startTime}ms`);

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

  // Función para renderizar tarjeta de producto compacta con imagen pre-descargada
  static async renderProductCard(doc, product, x, y, width, height, imageSize, preloadedImage = null) {
    try {
      // Marco del producto más sutil
      doc.rect(x, y, width, height)
         .fillOpacity(0.02)
         .fill('#f0f0f0')
         .fillOpacity(1)
         .stroke('#e0e0e0');

      // Imagen centrada en la parte superior
      const imageX = x + (width - imageSize) / 2;
      const imageY = y + 2;

      // Usar imagen pre-descargada o descargar si no existe
      if (preloadedImage) {
        try {
          doc.image(preloadedImage, imageX, imageY, {
            width: imageSize,
            height: imageSize,
            fit: [imageSize, imageSize]
          });
          console.log(`✅ Imagen renderizada para producto ${product.id}`);
        } catch (imageError) {
          console.warn(`⚠️ Error renderizando imagen para producto ${product.id}:`, imageError.message);
          PDFService.renderPlaceholder(doc, imageX, imageY, imageSize);
        }
      } else if (product.imagen_url && product.imagen_url !== 'Sin imagen') {
        // Intentar descargar imagen si no está pre-cargada
        console.log(`🖼️ Descargando imagen para producto ${product.id}: ${product.imagen_url}`);
        const compressedImage = await PDFService.downloadAndCompressImage(product.imagen_url);
        
        if (compressedImage) {
          try {
            doc.image(compressedImage, imageX, imageY, {
              width: imageSize,
              height: imageSize,
              fit: [imageSize, imageSize]
            });
            console.log(`✅ Imagen descargada y renderizada para producto ${product.id}`);
          } catch (imageError) {
            console.warn(`⚠️ Error renderizando imagen descargada para producto ${product.id}:`, imageError.message);
            PDFService.renderPlaceholder(doc, imageX, imageY, imageSize);
          }
        } else {
          PDFService.renderPlaceholder(doc, imageX, imageY, imageSize);
        }
      } else {
        PDFService.renderPlaceholder(doc, imageX, imageY, imageSize);
      }

      // Información del producto debajo de la imagen (más compacta)
      const textY = imageY + imageSize + 2;
      
      // Nombre del producto
      doc.fontSize(7)
         .font('Helvetica-Bold')
         .fillColor('#333')
         .text(product.nombre || 'N/A', x + 2, textY, { 
           width: width - 4, 
           align: 'center',
           ellipsis: true
         });

      // Precio
      doc.fontSize(6)
         .font('Helvetica')
         .fillColor('#666')
         .text(`$${product.precio || '0'}`, x + 2, textY + 10, { 
           width: width - 4, 
           align: 'center'
         });

      // ID del producto
      doc.fontSize(5)
         .fillColor('#999')
         .text(`ID: ${product.id}`, x + 2, textY + 19, { 
           width: width - 4, 
           align: 'center'
         })
         .fillColor('black');

    } catch (error) {
      console.error(`❌ Error renderizando producto ${product.id}:`, error);
    }
  }

  // Función auxiliar para renderizar placeholder
  static renderPlaceholder(doc, imageX, imageY, imageSize) {
    doc.rect(imageX, imageY, imageSize, imageSize)
       .fillAndStroke('#f8f8f8', '#ddd');
    doc.fontSize(6)
       .fillColor('#999')
       .text('Sin\nImagen', imageX + 10, imageY + imageSize/2 - 6, { 
         width: imageSize - 20, 
         align: 'center' 
       });
  }

  // Renderizar header minimalista y moderno
  static renderHeader(doc, pageConfig, currentPage, totalPages) {
    const headerY = pageConfig.margin;
    
    // Título principal centrado, moderno y elegante
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text('CATÁLOGO DE PRODUCTOS', 
             pageConfig.margin, 
             headerY + 25, 
             { 
               width: pageConfig.width - (pageConfig.margin * 2), 
               align: 'center' 
             });
    
    // Fecha alineada a la derecha en gris claro
    const dateText = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long', 
      year: 'numeric'
    });
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#757575')
       .text(dateText, 
             pageConfig.width - pageConfig.margin - 120, 
             headerY + 58, 
             { 
               width: 120, 
               align: 'right' 
             });
    
    // Línea divisoria sutil y elegante
    doc.moveTo(pageConfig.margin + 60, headerY + pageConfig.headerHeight - 10)
       .lineTo(pageConfig.width - pageConfig.margin - 60, headerY + pageConfig.headerHeight - 10)
       .strokeColor('#e5e5e5')
       .lineWidth(0.5)
       .stroke();
    
    // Reset color para contenido siguiente
    doc.fillColor('#000000');
  }

  // Renderizar grid de productos perfectamente alineado
  static renderProductsGrid(doc, products, pageConfig, gridConfig, imageMap) {
    const startY = pageConfig.margin + pageConfig.headerHeight + 15;
    
    // Calcular espacio disponible y centrar el grid
    const availableWidth = pageConfig.width - (pageConfig.margin * 2);
    const totalGridWidth = (gridConfig.cardWidth * gridConfig.cols) + (gridConfig.spacing * (gridConfig.cols - 1));
    const offsetX = (availableWidth - totalGridWidth) / 2;
    
    for (let i = 0; i < products.length && i < gridConfig.productsPerPage; i++) {
      const product = products[i];
      const row = Math.floor(i / gridConfig.cols);
      const col = i % gridConfig.cols;
      
      // Posición X perfectamente centrada y alineada
      const x = pageConfig.margin + offsetX + (col * (gridConfig.cardWidth + gridConfig.spacing));
      const y = startY + (row * (gridConfig.cardHeight + gridConfig.spacing));
      
      PDFService.renderProductCardProfessional(doc, product, x, y, gridConfig, imageMap.get(product.id));
    }
  }

  // Renderizar tarjeta de producto minimalista y moderna
  static renderProductCardProfessional(doc, product, x, y, gridConfig, preloadedImage = null) {
    try {
      // Sombra suave simulada (shadow effect)
      doc.rect(x + 3, y + 3, gridConfig.cardWidth, gridConfig.cardHeight)
         .fillOpacity(0.08)
         .fill('#000000')
         .fillOpacity(1);
      
      // Card principal con fondo blanco limpio
      doc.roundedRect(x, y, gridConfig.cardWidth, gridConfig.cardHeight, 8)  // Esquinas redondeadas
         .fillAndStroke('#ffffff', '#f0f0f0')
         .lineWidth(0.5);

      // Área de imagen con fondo blanco y padding
      const imageSize = gridConfig.imageSize;
      const imagePadding = 15;
      const imageX = x + (gridConfig.cardWidth - imageSize) / 2;
      const imageY = y + imagePadding;

      // Fondo blanco detrás de la imagen para transparencias
      doc.rect(imageX - 2, imageY - 2, imageSize + 4, imageSize + 4)
         .fill('#ffffff');

      // Renderizar imagen o placeholder
      if (preloadedImage) {
        try {
          doc.image(preloadedImage, imageX, imageY, { 
            width: imageSize, 
            height: imageSize,
            fit: [imageSize, imageSize],
            align: 'center',
            valign: 'center'
          });
        } catch (imgErr) {
          console.warn(`⚠️ Error al insertar imagen para ${product.id}:`, imgErr.message);
          PDFService.renderPlaceholderProfessional(doc, imageX, imageY, imageSize);
        }
      } else {
        PDFService.renderPlaceholderProfessional(doc, imageX, imageY, imageSize);
      }

      // Información del producto con jerarquía clara
      const textStartY = imageY + imageSize + 12;
      
      // Nombre del producto - tipografía sans-serif moderna
      const productName = (product.nombre || 'Sin nombre').substring(0, 45);
      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor('#000000')
         .text(productName, x + 8, textStartY, { 
           width: gridConfig.cardWidth - 16, 
           align: 'center',
           ellipsis: true
         });

      // Precio - color verde elegante según especificación
      const price = product.precio ? `$${parseFloat(product.precio).toLocaleString('es-ES')}` : '$0';
      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor('#2E7D32')  // Verde elegante como especificado
         .text(price, x + 8, textStartY + 18, { 
           width: gridConfig.cardWidth - 16, 
           align: 'center'
         });

      // ID y fecha en gris suave
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#757575')  // Gris suave como especificado
         .text(`ID: ${product.id}`, x + 8, textStartY + 38, { 
           width: (gridConfig.cardWidth - 16) / 2, 
           align: 'left'
         });

      // Fecha de creación alineada a la derecha
      if (product.creado_en) {
        const fecha = new Date(product.creado_en).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit' 
        });
        doc.text(fecha, x + (gridConfig.cardWidth / 2) + 4, textStartY + 38, { 
          width: (gridConfig.cardWidth - 16) / 2, 
          align: 'right'
        });
      }

      // Reset color
      doc.fillColor('#000000');

    } catch (error) {
      console.error(`❌ Error renderizando producto ${product.id}:`, error);
    }
  }

  // Renderizar footer minimalista y elegante
  static renderFooter(doc, pageConfig, currentPage, totalPages) {
    const footerY = pageConfig.height - pageConfig.footerHeight - pageConfig.margin + 10;
    
    // Línea separadora superior muy sutil y centrada
    const lineWidth = 200;
    const lineX = (pageConfig.width - lineWidth) / 2;
    doc.moveTo(lineX, footerY)
       .lineTo(lineX + lineWidth, footerY)
       .strokeColor('#f0f0f0')
       .lineWidth(0.5)
       .stroke();
    
    // Texto "Catálogo generado automáticamente" centrado y elegante
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#757575')
       .text('Catálogo generado automáticamente', 
             pageConfig.margin, 
             footerY + 15, 
             { 
               width: pageConfig.width - (pageConfig.margin * 2), 
               align: 'center' 
             });
    
    // Numeración de páginas alineada a la derecha
    const pageText = `Página ${currentPage} de ${totalPages}`;
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#757575')
       .text(pageText, 
             pageConfig.width - pageConfig.margin - 80, 
             footerY + 15, 
             { 
               width: 80, 
               align: 'right' 
             });
    
    // Reset color
    doc.fillColor('#000000');
  }

  // Placeholder minimalista y elegante para productos sin imagen
  static renderPlaceholderProfessional(doc, imageX, imageY, imageSize) {
    // Fondo blanco con borde muy sutil
    doc.roundedRect(imageX, imageY, imageSize, imageSize, 4)
       .fillAndStroke('#ffffff', '#f5f5f5')
       .lineWidth(0.5);
    
    // Círculo central minimalista
    const circleSize = imageSize * 0.4;
    const circleX = imageX + (imageSize - circleSize) / 2;
    const circleY = imageY + (imageSize - circleSize) / 2;
    
    doc.circle(circleX + circleSize/2, circleY + circleSize/2, circleSize/3)
       .fillAndStroke('#f8f8f8', '#e8e8e8')
       .lineWidth(1);
    
    // Ícono moderno centrado
    doc.fontSize(circleSize * 0.3)
       .fillColor('#bdbdbd')
       .text('�', circleX + circleSize*0.25, circleY + circleSize*0.25, { 
         width: circleSize*0.5, 
         align: 'center' 
       });
    
    // Texto discreto en la parte inferior
    doc.fontSize(7)
       .font('Helvetica')
       .fillColor('#e0e0e0')
       .text('Sin imagen', imageX + 5, imageY + imageSize - 15, { 
         width: imageSize - 10, 
         align: 'center' 
       });
  }

}

module.exports = PDFService;
