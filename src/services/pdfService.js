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
      
      // Logging detallado para debugging
      console.log(`🔍 URL original: "${finalUrl}"`);
      
      // Si ya es una URL completa, usarla directamente
      if (!finalUrl.startsWith('http')) {
        // Es solo el nombre del archivo, construir URL completa
        // Limpiar el nombre del archivo de caracteres problemáticos
        const cleanFileName = finalUrl.replace(/[^a-zA-Z0-9.-]/g, '_');
        finalUrl = `https://xdhymmzmxbaxxmregzuh.supabase.co/storage/v1/object/public/imagenes/${cleanFileName}`;
        console.log(`🔧 URL construida desde nombre: ${finalUrl}`);
      } else if (finalUrl.includes('supabase.co') && !finalUrl.includes('/storage/v1/object/public/')) {
        // Convertir URL de Supabase a formato público
        const fileName = finalUrl.split('/').pop() || finalUrl;
        const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        finalUrl = `https://xdhymmzmxbaxxmregzuh.supabase.co/storage/v1/object/public/imagenes/${cleanFileName}`;
        console.log(`🔧 URL convertida de Supabase: ${finalUrl}`);
      }

      // Encoding especial para caracteres problemáticos
      try {
        const urlParts = finalUrl.split('/');
        const fileName = urlParts.pop();
        const encodedFileName = encodeURIComponent(fileName).replace(/%2E/g, '.');
        finalUrl = urlParts.join('/') + '/' + encodedFileName;
        console.log(`🔗 URL final encodificada: ${finalUrl}`);
      } catch (encodeError) {
        console.warn(`⚠️ Error encodificando URL: ${encodeError.message}`);
      }

      console.log(`🔍 Descargando: ${finalUrl}`);

      // Descargar imagen con mejor manejo de errores y configuración optimizada
      const response = await new Promise((resolve, reject) => {
        const request = https.get(finalUrl, {
          timeout: 20000, // Más tiempo para debugging
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
          console.log(`📋 Headers:`, response.headers);
          
          // Manejar redirecciones
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers.location;
            console.log('🔄 Redirección a:', redirectUrl);
            request.destroy();
            resolve(PDFService.downloadAndCompressImage(redirectUrl));
            return;
          }
          
          if (response.statusCode === 404) {
            console.error(`❌ Imagen no encontrada (404): ${finalUrl}`);
            reject(new Error(`Imagen no encontrada: HTTP 404`));
            return;
          }
          
          if (response.statusCode !== 200) {
            console.error(`❌ Error HTTP ${response.statusCode}: ${response.statusMessage} para ${finalUrl}`);
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            return;
          }

          const chunks = [];
          response.on('data', (chunk) => {
            chunks.push(chunk);
            console.log(`📦 Chunk recibido: ${chunk.length} bytes`);
          });
          
          response.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log(`✅ Descarga completada: ${buffer.length} bytes total`);
            
            // Verificar que el buffer no esté vacío
            if (buffer.length === 0) {
              reject(new Error('Buffer vacío recibido'));
              return;
            }
            
            // Verificar que sea una imagen válida verificando magic numbers
            const isValidImage = PDFService.isValidImageBuffer(buffer);
            if (!isValidImage) {
              console.warn(`⚠️ Buffer no parece ser una imagen válida`);
            }
            
            resolve(buffer);
          });
          
          response.on('error', (err) => {
            console.error(`❌ Error en response: ${err.message}`);
            reject(err);
          });
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
        console.log(`🖼️ Procesando imagen con Jimp...`);
        const image = await Jimp.read(response);
        console.log(`📏 Dimensiones originales: ${image.bitmap.width}x${image.bitmap.height}`);
        
        // Mejorar la calidad significativamente para el nuevo layout 3x3
        const compressedBuffer = await image
          .resize(200, 200)    // Tamaño mucho más grande para mejor calidad
          .quality(85)         // Calidad alta para imágenes nítidas
          .getBufferAsync(Jimp.MIME_JPEG);

        console.log(`🎯 Comprimido exitosamente: ${compressedBuffer.length} bytes (alta calidad)`);
        return compressedBuffer;
      } catch (jimpError) {
        // Si Jimp falla (ej. con WebP), devolver la imagen original sin comprimir
        const imageType = PDFService.getImageType(response);
        console.warn(`⚠️ Jimp falló con ${imageType}, usando imagen original: ${jimpError.message}`);
        
        // Para WebP y otros formatos no soportados por Jimp, PDFKit puede manejarlos directamente
        if (imageType === 'WebP' || imageType === 'unknown') {
          console.log(`📋 Usando imagen ${imageType} sin compresión (${response.length} bytes)`);
        }
        
        return response;
      }

    } catch (error) {
      console.error(`❌ Error completo descargando ${url}:`);
      console.error(`   Mensaje: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
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

        // Configuración profesional del documento
        const doc = new PDFDocument({ 
          margin: 40,
          compress: true,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: 'Catálogo de Productos',
            Author: 'Sistema de Automatización',
            Subject: 'Catálogo de Productos',
            Keywords: 'catálogo, productos, PDF'
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

        // Configuración del layout optimizado para 3 columnas con mejor espaciado
        const pageConfig = {
          width: 595.28,      // Ancho A4 en puntos
          height: 841.89,     // Alto A4 en puntos
          margin: 40,         // Margen general
          headerHeight: 80,   // Espacio para header
          footerHeight: 80,   // Más espacio para footer para evitar choque
        };

        const gridConfig = {
          cols: 3,            // 3 columnas para tarjetas más grandes
          rows: 3,            // 3 filas 
          productsPerPage: 9, // 3x3 = 9 productos por página
          cardWidth: 165,     // Ancho más grande para cada tarjeta
          cardHeight: 170,    // Altura más reducida para evitar choque con footer
          imageSize: 110,     // Imagen ligeramente más pequeña para compensar
          spacing: 15,        // Más espaciado entre tarjetas
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

  // Renderizar header profesional del catálogo
  static renderHeader(doc, pageConfig, currentPage, totalPages) {
    const headerY = pageConfig.margin;
    
    // Fondo del header con gradiente simulado
    doc.rect(pageConfig.margin, headerY, pageConfig.width - (pageConfig.margin * 2), pageConfig.headerHeight)
       .fillAndStroke('#2c3e50', '#34495e');
    
    // Logo simulado (cuadrado azul como en la imagen)
    const logoSize = 30;
    const logoX = pageConfig.margin + 15;
    const logoY = headerY + 15;
    
    doc.rect(logoX, logoY, logoSize, logoSize)
       .fillAndStroke('#3498db', '#2980b9');
    
    // Título principal
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor('white')
       .text('CATÁLOGO DE PRODUCTOS', logoX + logoSize + 20, logoY + 5);
    
    // Fecha en la esquina superior derecha
    const dateText = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('white')
       .text(dateText, pageConfig.width - pageConfig.margin - 80, logoY + 8);
    
    // Línea separadora
    doc.moveTo(pageConfig.margin, headerY + pageConfig.headerHeight)
       .lineTo(pageConfig.width - pageConfig.margin, headerY + pageConfig.headerHeight)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();
    
    // Reset color para contenido siguiente
    doc.fillColor('black');
  }

  // Renderizar grid de productos de forma profesional
  static renderProductsGrid(doc, products, pageConfig, gridConfig, imageMap) {
    const startY = pageConfig.margin + pageConfig.headerHeight + 25; // Más separación del header
    
    for (let i = 0; i < products.length && i < gridConfig.productsPerPage; i++) {
      const product = products[i];
      const row = Math.floor(i / gridConfig.cols);
      const col = i % gridConfig.cols;
      
      const x = pageConfig.margin + (col * (gridConfig.cardWidth + gridConfig.spacing));
      const y = startY + (row * (gridConfig.cardHeight + gridConfig.spacing));
      
      PDFService.renderProductCardProfessional(doc, product, x, y, gridConfig, imageMap.get(product.id));
    }
  }

  // Renderizar tarjeta de producto profesional
  static renderProductCardProfessional(doc, product, x, y, gridConfig, preloadedImage = null) {
    try {
      // Marco con bordes redondeados simulados y sombra sutil
      doc.rect(x, y, gridConfig.cardWidth, gridConfig.cardHeight)
         .fillOpacity(0.05)
         .fill('#ecf0f1')
         .fillOpacity(1)
         .strokeColor('#3498db')
         .lineWidth(2)
         .stroke();

      // Área de imagen centrada
      const imageSize = gridConfig.imageSize;
      const imageX = x + (gridConfig.cardWidth - imageSize) / 2;
      const imageY = y + 15;

      // Renderizar imagen o placeholder con mejor calidad
      if (preloadedImage) {
        try {
          // Usar la imagen de alta calidad con opciones optimizadas
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

      // Información del producto debajo de la imagen
      const textStartY = imageY + imageSize + 10;
      
      // Nombre del producto - más compacto
      const productName = (product.nombre || 'Sin nombre').substring(0, 35);
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#2c3e50')
         .text(productName, x + 8, textStartY, { 
           width: gridConfig.cardWidth - 16, 
           align: 'center',
           ellipsis: true
         });

      // Precio - destacado pero más compacto
      const price = product.precio ? `$${parseFloat(product.precio).toLocaleString('es-ES')}` : '$0';
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#27ae60')
         .text(price, x + 8, textStartY + 14, { 
           width: gridConfig.cardWidth - 16, 
           align: 'center'
         });

      // ID del producto - más cerca del precio
      doc.fontSize(7)
         .font('Helvetica')
         .fillColor('#7f8c8d')
         .text(`ID: ${product.id}`, x + 8, textStartY + 30, { 
           width: gridConfig.cardWidth - 16, 
           align: 'center'
         });

      // Reset color
      doc.fillColor('black');

    } catch (error) {
      console.error(`❌ Error renderizando producto ${product.id}:`, error);
    }
  }

  // Renderizar footer profesional con mejor espaciado
  static renderFooter(doc, pageConfig, currentPage, totalPages) {
    const footerY = pageConfig.height - pageConfig.footerHeight - pageConfig.margin + 20; // Más separación del contenido
    
    // Línea separadora superior con más margen
    doc.moveTo(pageConfig.margin, footerY)
       .lineTo(pageConfig.width - pageConfig.margin, footerY)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();
    
    // Numeración de páginas con más separación de la línea
    const pageText = `Página ${currentPage} de ${totalPages}`;
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#7f8c8d')
       .text(pageText, pageConfig.width - pageConfig.margin - 80, footerY + 20);
    
    // Marca de agua o información adicional con más separación
    doc.fontSize(8)
       .fillColor('#95a5a6')
       .text('Catálogo generado automáticamente', pageConfig.margin, footerY + 20);
    
    // Reset color
    doc.fillColor('black');
  }

  // Placeholder profesional para productos sin imagen
  static renderPlaceholderProfessional(doc, imageX, imageY, imageSize) {
    // Fondo gris claro con bordes redondeados simulados
    doc.rect(imageX, imageY, imageSize, imageSize)
       .fillAndStroke('#f8f9fa', '#dee2e6');
    
    // Ícono de imagen faltante más grande
    const iconSize = imageSize * 0.4;
    const iconX = imageX + (imageSize - iconSize) / 2;
    const iconY = imageY + (imageSize - iconSize) / 2;
    
    doc.fontSize(iconSize / 1.5)
       .fillColor('#6c757d')
       .text('📷', iconX, iconY, { 
         width: iconSize, 
         align: 'center' 
       });
    
    // Texto más visible
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#868e96')
       .text('Sin imagen', imageX + 10, imageY + imageSize - 20, { 
         width: imageSize - 20, 
         align: 'center' 
       });
  }

  // Función auxiliar para verificar si un buffer es una imagen válida
  static isValidImageBuffer(buffer) {
    if (!buffer || buffer.length < 8) return false;
    
    // Verificar magic numbers comunes de imágenes
    const header = buffer.toString('hex', 0, 8).toLowerCase();
    
    // JPEG: FF D8 FF
    if (header.startsWith('ffd8ff')) return true;
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (header.startsWith('89504e47')) return true;
    
    // GIF: 47 49 46 38
    if (header.startsWith('47494638')) return true;
    
    // WebP: 52 49 46 46 (RIFF)
    if (header.startsWith('52494646')) return true;
    
    return false;
  }

  // Función auxiliar para detectar tipo de imagen
  static getImageType(buffer) {
    if (!buffer || buffer.length < 8) return 'unknown';
    
    const header = buffer.toString('hex', 0, 8).toLowerCase();
    
    if (header.startsWith('ffd8ff')) return 'JPEG';
    if (header.startsWith('89504e47')) return 'PNG';
    if (header.startsWith('47494638')) return 'GIF';
    if (header.startsWith('52494646')) return 'WebP';
    
    return 'unknown';
  }

  // Método para testear una URL específica (útil para debugging)
  static async testSpecificImageURL(url, productId = 'unknown') {
    console.log(`🧪 TESTING URL para producto ${productId}:`);
    console.log(`   URL original: "${url}"`);
    
    try {
      const result = await PDFService.downloadAndCompressImage(url);
      if (result) {
        console.log(`✅ SUCCESS: Imagen descargada correctamente para ${productId}`);
        console.log(`   Tamaño: ${result.length} bytes`);
        console.log(`   Tipo: ${PDFService.getImageType(result)}`);
        return true;
      } else {
        console.log(`❌ FAILED: No se pudo descargar imagen para ${productId}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message} para ${productId}`);
      return false;
    }
  }

}

module.exports = PDFService;
