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

      // Descargar imagen con mejor manejo de errores
      const response = await new Promise((resolve, reject) => {
        const request = https.get(finalUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
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
        const compressedBuffer = await image
          .resize(60, 60)  // Tamaño para el nuevo layout
          .quality(65)     // Calidad balanceada
          .getBufferAsync(Jimp.MIME_JPEG);

        console.log(`🎯 Comprimido: ${compressedBuffer.length} bytes`);
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
        console.log('🚀 Generando PDF optimizado con imágenes comprimidas...');
        const startTime = Date.now();

        // Configuración optimizada
        const doc = new PDFDocument({ 
          margin: 15,
          compress: true,
          size: 'A4',
          bufferPages: true,
          info: {
            Title: 'Catálogo Productos',
            Author: 'Sistema'
          }
        });
        
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Título compacto
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('CATÁLOGO DE PRODUCTOS', { align: 'center' });

        doc.fontSize(8)
           .font('Helvetica')
           .text(new Date().toLocaleDateString('es-ES'), { align: 'right' })
           .moveDown(0.3);

        // Descargar y comprimir todas las imágenes en lotes
        console.log('📥 Descargando y comprimiendo imágenes...');
        const imageResults = await PDFService.downloadImagesInBatches(products, 5);
        const imageMap = new Map();
        imageResults.forEach(result => {
          if (result.imageBuffer) {
            imageMap.set(result.productId, result.imageBuffer);
          }
        });

        console.log(`📄 Generando contenido con imágenes... ${imageMap.size} imágenes descargadas`);

        // Layout optimizado: 4x5 compacto (20 productos por página)
        let currentY = doc.y;
        const cardHeight = 95;   // Altura más compacta
        const imageSize = 60;    // Imágenes más pequeñas
        const startX = 15;       // Margen reducido
        const cardWidth = 140;   // Ancho para 4 columnas
        const marginX = 8;       // Espaciado horizontal mínimo
        const marginY = 5;       // Espaciado vertical mínimo
        const productsPerRow = 4;
        const rowsPerPage = 5;
        const productsPerPage = productsPerRow * rowsPerPage; // 20 productos

        // Generar productos en grid 4x5 con imágenes descargadas
        for (let pageStart = 0; pageStart < products.length; pageStart += productsPerPage) {
          // Nueva página si no es la primera
          if (pageStart > 0) {
            doc.addPage();
            currentY = 40;
          }

          console.log(`📄 Procesando página ${Math.floor(pageStart/productsPerPage) + 1}`);

          // Reiniciar Y para cada página
          let pageY = currentY;

          // Procesar hasta 20 productos por página
          for (let row = 0; row < rowsPerPage; row++) {
            for (let col = 0; col < productsPerRow; col++) {
              const productIndex = pageStart + (row * productsPerRow) + col;
              
              if (productIndex >= products.length) {
                break; // No más productos
              }

              const product = products[productIndex];
              const x = startX + (col * (cardWidth + marginX));
              const y = pageY + (row * (cardHeight + marginY));

              // Renderizar producto con imagen del mapa
              const productImage = imageMap.get(product.id);
              await PDFService.renderProductCard(doc, product, x, y, cardWidth, cardHeight, imageSize, productImage);
            }
            
            if (pageStart + ((row + 1) * productsPerRow) >= products.length) {
              break; // No más productos en esta página
            }
          }
        }

        // Resumen final
        currentY += 10;
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .text(`Total: ${products.length} productos | ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });

        const endTime = Date.now();
        console.log(`✅ PDF con imágenes comprimidas generado en ${endTime - startTime}ms`);

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


}

module.exports = PDFService;
