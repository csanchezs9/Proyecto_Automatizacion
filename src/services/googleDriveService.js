const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.auth = null;
  }

  /**
   * Inicializar la autenticación con Google Drive
   */
  async initialize() {
    try {
      // Configurar la autenticación
      this.auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || './google-credentials.json',
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ],
      });

      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      console.log('✅ Google Drive API inicializada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Drive API:', error.message);
      return false;
    }
  }

  /**
   * Crear una carpeta en Google Drive
   */
  async createFolder(folderName, parentFolderId = null) {
    try {
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink'
      });

      console.log(`📁 Carpeta creada: ${folderName} (ID: ${folder.data.id})`);
      return folder.data;
    } catch (error) {
      console.error('❌ Error creando carpeta:', error.message);
      throw error;
    }
  }

  /**
   * Subir un archivo a Google Drive
   */
  async uploadFile(filePath, fileName, parentFolderId = null) {
    try {
      const fileMetadata = {
        name: fileName,
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const media = {
        mimeType: 'application/pdf',
        body: await fs.createReadStream(filePath)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, webViewLink'
      });

      console.log(`📄 Archivo subido: ${fileName} (ID: ${file.data.id})`);
      return file.data;
    } catch (error) {
      console.error('❌ Error subiendo archivo:', error.message);
      throw error;
    }
  }

  /**
   * Crear estructura de carpetas por categorías automáticamente
   */
  async createProductCatalogStructure() {
    try {
      const mainFolderName = `Catálogo Productos - ${new Date().toISOString().split('T')[0]}`;
      const mainFolder = await this.createFolder(mainFolderName);

      const categories = [
        'Por Talla',
        'Por Categoría', 
        'Por Temporada',
        'Por Precio',
        'Más Vendidos',
        'Stock Bajo',
        'Nuevos Productos',
        'Ofertas Especiales'
      ];

      const categoryFolders = {};
      
      for (const category of categories) {
        const folder = await this.createFolder(category, mainFolder.id);
        categoryFolders[category] = folder.id;
      }

      // Crear subcarpetas por tallas
      const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const sizeFolders = {};
      
      for (const size of sizes) {
        const folder = await this.createFolder(`Talla ${size}`, categoryFolders['Por Talla']);
        sizeFolders[size] = folder.id;
      }

      // Crear subcarpetas por categorías de producto
      const productCategories = ['Camisetas', 'Pantalones', 'Calzado', 'Abrigos', 'Accesorios'];
      const productCategoryFolders = {};
      
      for (const prodCategory of productCategories) {
        const folder = await this.createFolder(prodCategory, categoryFolders['Por Categoría']);
        productCategoryFolders[prodCategory] = folder.id;
      }

      return {
        mainFolder,
        categoryFolders,
        sizeFolders,
        productCategoryFolders
      };
    } catch (error) {
      console.error('❌ Error creando estructura de catálogo:', error.message);
      throw error;
    }
  }

  /**
   * Generar catálogos automáticos filtrados
   */
  async generateAutomaticCatalogs(products, folderStructure) {
    try {
      const PDFService = require('./pdfService');
      const catalogs = [];

      // Generar catálogo por tallas
      const productsBySize = this.groupProductsBySize(products);
      
      for (const [size, sizeProducts] of Object.entries(productsBySize)) {
        if (sizeProducts.length > 0) {
          const catalogName = `Catálogo Talla ${size} - ${new Date().toISOString().split('T')[0]}.pdf`;
          const catalogPath = path.join(__dirname, '../../uploads', catalogName);
          
          // Generar PDF del catálogo
          await PDFService.generateCatalogPDF(sizeProducts, {
            title: `Productos Talla ${size}`,
            subtitle: `Catálogo generado automáticamente - ${sizeProducts.length} productos`,
            filterInfo: `Filtrado por talla: ${size}`
          }, catalogPath);

          // Subir a Google Drive
          const uploadedFile = await this.uploadFile(
            catalogPath, 
            catalogName, 
            folderStructure.sizeFolders[size]
          );

          catalogs.push({
            type: 'size',
            filter: size,
            file: uploadedFile,
            productCount: sizeProducts.length
          });

          // Limpiar archivo temporal
          await fs.unlink(catalogPath).catch(() => {});
        }
      }

      // Generar catálogo por categorías
      const productsByCategory = this.groupProductsByCategory(products);
      
      for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
        if (categoryProducts.length > 0) {
          const catalogName = `Catálogo ${category} - ${new Date().toISOString().split('T')[0]}.pdf`;
          const catalogPath = path.join(__dirname, '../../uploads', catalogName);
          
          await PDFService.generateCatalogPDF(categoryProducts, {
            title: `Productos ${category}`,
            subtitle: `Catálogo generado automáticamente - ${categoryProducts.length} productos`,
            filterInfo: `Filtrado por categoría: ${category}`
          }, catalogPath);

          const uploadedFile = await this.uploadFile(
            catalogPath, 
            catalogName, 
            folderStructure.productCategoryFolders[category]
          );

          catalogs.push({
            type: 'category',
            filter: category,
            file: uploadedFile,
            productCount: categoryProducts.length
          });

          await fs.unlink(catalogPath).catch(() => {});
        }
      }

      // Generar catálogo de productos más vendidos
      const topProducts = products
        .filter(p => p.popularidad > 50)
        .sort((a, b) => b.popularidad - a.popularidad)
        .slice(0, 20);

      if (topProducts.length > 0) {
        const catalogName = `Top Productos - ${new Date().toISOString().split('T')[0]}.pdf`;
        const catalogPath = path.join(__dirname, '../../uploads', catalogName);
        
        await PDFService.generateCatalogPDF(topProducts, {
          title: 'Productos Más Vendidos',
          subtitle: `Top ${topProducts.length} productos con mayor popularidad`,
          filterInfo: 'Ordenados por popularidad'
        }, catalogPath);

        const uploadedFile = await this.uploadFile(
          catalogPath, 
          catalogName, 
          folderStructure.categoryFolders['Más Vendidos']
        );

        catalogs.push({
          type: 'top_products',
          filter: 'más vendidos',
          file: uploadedFile,
          productCount: topProducts.length
        });

        await fs.unlink(catalogPath).catch(() => {});
      }

      // Generar catálogo de stock bajo
      const lowStockProducts = products.filter(p => p.stock < 10 && p.stock > 0);
      
      if (lowStockProducts.length > 0) {
        const catalogName = `Stock Bajo - ${new Date().toISOString().split('T')[0]}.pdf`;
        const catalogPath = path.join(__dirname, '../../uploads', catalogName);
        
        await PDFService.generateCatalogPDF(lowStockProducts, {
          title: 'Productos con Stock Bajo',
          subtitle: `${lowStockProducts.length} productos necesitan reabastecimiento`,
          filterInfo: 'Stock menor a 10 unidades'
        }, catalogPath);

        const uploadedFile = await this.uploadFile(
          catalogPath, 
          catalogName, 
          folderStructure.categoryFolders['Stock Bajo']
        );

        catalogs.push({
          type: 'low_stock',
          filter: 'stock bajo',
          file: uploadedFile,
          productCount: lowStockProducts.length
        });

        await fs.unlink(catalogPath).catch(() => {});
      }

      return catalogs;
    } catch (error) {
      console.error('❌ Error generando catálogos automáticos:', error.message);
      throw error;
    }
  }

  /**
   * Agrupar productos por talla
   */
  groupProductsBySize(products) {
    return products.reduce((groups, product) => {
      const size = product.talla || 'Sin Talla';
      if (!groups[size]) {
        groups[size] = [];
      }
      groups[size].push(product);
      return groups;
    }, {});
  }

  /**
   * Agrupar productos por categoría
   */
  groupProductsByCategory(products) {
    return products.reduce((groups, product) => {
      const category = product.categoria || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(product);
      return groups;
    }, {});
  }

  /**
   * Compartir una carpeta con permisos específicos
   */
  async shareFolderWithPermissions(folderId, emailAddress, role = 'reader') {
    try {
      const permission = {
        type: 'user',
        role: role, // 'reader', 'writer', 'owner'
        emailAddress: emailAddress
      };

      await this.drive.permissions.create({
        fileId: folderId,
        resource: permission,
        sendNotificationEmail: true
      });

      console.log(`📧 Carpeta compartida con ${emailAddress} como ${role}`);
      return true;
    } catch (error) {
      console.error('❌ Error compartiendo carpeta:', error.message);
      throw error;
    }
  }

  /**
   * Programar generación automática de catálogos
   */
  async scheduleAutomaticGeneration(schedule = 'daily') {
    // Esta función se puede integrar con cron jobs
    console.log(`⏰ Programación automática configurada: ${schedule}`);
    
    const schedules = {
      daily: '0 8 * * *',    // Diariamente a las 8 AM
      weekly: '0 8 * * 1',   // Lunes a las 8 AM
      monthly: '0 8 1 * *'   // Primer día del mes a las 8 AM
    };

    return schedules[schedule] || schedules.daily;
  }
}

module.exports = GoogleDriveService;