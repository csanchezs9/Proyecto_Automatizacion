import { jsPDF } from 'jspdf';

interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  talla?: string;
  cantidad?: number;
  imagen_url?: string;
}

class PDFService {
  /**
   * Generar PDF con lista de productos usando jsPDF
   */
  static async generateProductsPDF(products: Product[]): Promise<Uint8Array> {
    try {
      // Crear documento PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Colores
        const primaryColor = [37, 99, 235]; // #2563eb
        const secondaryColor = [100, 116, 139]; // #64748b
        const textColor = [30, 41, 59]; // #1e293b

        // ===== HEADER =====
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CATALOGO DE PRODUCTOS', 15, 15);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestion Automatizada', 15, 25);

        // Fecha
        const now = new Date();
        doc.setFontSize(9);
        doc.text(
          `Generado: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
          pageWidth - 75,
          15
        );

        // ===== ESTADÍSTICAS =====
        const totalValue = products.reduce((sum, p) => {
          const precio = p.precio ? parseFloat(p.precio.toString()) : 0;
          return sum + precio;
        }, 0);
        const avgPrice = products.length > 0 ? totalValue / products.length : 0;
        const totalStock = products.reduce((sum, p) => sum + (p.cantidad || 0), 0);

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMEN DEL CATALOGO', 15, 45);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total de Productos: ${products.length}`, 15, 55);
        doc.text(`Valor Total Inventario: $${totalValue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, 62);
        doc.text(`Stock Total: ${totalStock} unidades`, 15, 69);
        doc.text(`Precio Promedio: $${avgPrice.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, 76);

        // Línea separadora
        doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.line(15, 82, pageWidth - 15, 82);

        // ===== PRODUCTOS =====
        let yPosition = 90;
        const productsPerPage = 4; // Reducido a 4 para mejor visualización
        const rowHeight = 45; // Aumentado para imágenes más grandes
        const imageSize = 35; // Tamaño de la imagen aumentado de 25mm a 35mm

        // Función para cargar imagen desde URL (para Node.js)
        const loadImage = async (url: string): Promise<string | null> => {
          try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString('base64');
            
            // Determinar el tipo MIME basado en la URL o usar JPEG por defecto
            let mimeType = 'image/jpeg';
            if (url.includes('.png')) mimeType = 'image/png';
            if (url.includes('.jpg') || url.includes('.jpeg')) mimeType = 'image/jpeg';
            
            return `data:${mimeType};base64,${base64}`;
          } catch (error) {
            console.error('Error cargando imagen:', error);
            return null;
          }
        };

        // Cargar todas las imágenes primero
        const imagePromises = products.map(async (product) => {
          if (product.imagen_url && product.imagen_url !== 'Sin imagen') {
            return await loadImage(product.imagen_url);
          }
          return null;
        });

        const loadedImages = await Promise.all(imagePromises);

        products.forEach((product, index) => {
          // Nueva página si es necesario
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 20;
          }

          // Fondo alterno
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(10, yPosition - 5, pageWidth - 20, rowHeight, 'F');
          }

          // ESPACIO PARA IMAGEN
          const imageX = 15;
          const imageY = yPosition - 3;
          
          // Intentar agregar la imagen si existe
          const imageData = loadedImages[index];
          if (imageData) {
            try {
              doc.addImage(imageData, 'JPEG', imageX, imageY, imageSize, imageSize);
            } catch (error) {
              // Si falla, mostrar marco con texto
              doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
              doc.setFillColor(255, 255, 255);
              doc.rect(imageX, imageY, imageSize, imageSize, 'FD');
              doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
              doc.setFontSize(7);
              doc.text('Imagen', imageX + 4, imageY + 13);
            }
          } else {
            // Marco para la imagen (placeholder)
            doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFillColor(255, 255, 255);
            doc.rect(imageX, imageY, imageSize, imageSize, 'FD');
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFontSize(7);
            doc.text('Imagen', imageX + 4, imageY + 13);
          }
          
          // Contenido del producto (desplazado para dar espacio a la imagen)
          const contentX = imageX + imageSize + 5;

          // ID y Nombre
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${product.id} - ${product.nombre}`, contentX, yPosition);

          // Descripción
          if (product.descripcion) {
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const desc = product.descripcion.substring(0, 50) + (product.descripcion.length > 50 ? '...' : '');
            doc.text(desc, contentX, yPosition + 5, { maxWidth: 100 });
          }

          // Información adicional (Talla y Stock)
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Talla: ${product.talla || 'N/A'} | Stock: ${product.cantidad || 0}`,
            contentX,
            yPosition + 15
          );

          // Precio (destacado a la derecha)
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          const precio = product.precio ? parseFloat(product.precio.toString()) : 0;
          doc.text(`$${precio.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 45, yPosition + 5);

          yPosition += rowHeight;
        });

      // ===== FOOTER EN TODAS LAS PÁGINAS =====
      const totalPages = doc.getNumberOfPages();
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFontSize(8);
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.text(
          `Página ${i} de ${totalPages} | Sistema de Gestión Automatizada`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Generar el PDF como array de bytes
      const pdfOutput = doc.output('arraybuffer');
      return new Uint8Array(pdfOutput);

    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }
}

export default PDFService;
