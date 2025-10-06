const { pool } = require('../config/database');
const GoogleDriveService = require('../services/googleDriveService');
const PDFService = require('../services/pdfService');
const cron = require('node-cron');

class EnterpriseController {
  
  /**
   * Generar catálogos automáticos con filtros específicos
   */
  static async generateAutomaticCatalogs(req, res) {
    try {
      const { filters = {} } = req.body;
      
      // Obtener productos con filtros
      const products = await this.getFilteredProducts(filters);
      
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron productos con los filtros especificados'
        });
      }

      // Inicializar Google Drive
      const driveService = new GoogleDriveService();
      const initialized = await driveService.initialize();
      
      if (!initialized) {
        return res.status(500).json({
          success: false,
          message: 'Error configurando Google Drive. Verifique las credenciales.'
        });
      }

      // Crear estructura de carpetas
      const folderStructure = await driveService.createProductCatalogStructure();
      
      // Generar catálogos automáticos
      const catalogs = await driveService.generateAutomaticCatalogs(products, folderStructure);

      // Registrar la actividad
      await this.logAutomaticActivity('catalog_generation', {
        catalogsGenerated: catalogs.length,
        totalProducts: products.length,
        filters: filters,
        mainFolderId: folderStructure.mainFolder.id
      });

      res.json({
        success: true,
        message: 'Catálogos generados automáticamente',
        data: {
          mainFolder: folderStructure.mainFolder,
          catalogs: catalogs,
          totalProducts: products.length,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error generando catálogos automáticos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  /**
   * Obtener productos con filtros avanzados
   */
  static async getFilteredProducts(filters) {
    try {
      let query = 'SELECT * FROM productos WHERE activo = true';
      const params = [];
      let paramCount = 0;

      // Aplicar filtros dinámicos
      if (filters.talla) {
        paramCount++;
        query += ` AND talla = $${paramCount}`;
        params.push(filters.talla);
      }

      if (filters.categoria) {
        paramCount++;
        query += ` AND categoria = $${paramCount}`;
        params.push(filters.categoria);
      }

      if (filters.temporada) {
        paramCount++;
        query += ` AND temporada = $${paramCount}`;
        params.push(filters.temporada);
      }

      if (filters.precio_min) {
        paramCount++;
        query += ` AND precio >= $${paramCount}`;
        params.push(filters.precio_min);
      }

      if (filters.precio_max) {
        paramCount++;
        query += ` AND precio <= $${paramCount}`;
        params.push(filters.precio_max);
      }

      if (filters.stock_min) {
        paramCount++;
        query += ` AND stock >= $${paramCount}`;
        params.push(filters.stock_min);
      }

      if (filters.popularidad_min) {
        paramCount++;
        query += ` AND popularidad >= $${paramCount}`;
        params.push(filters.popularidad_min);
      }

      // Ordenamiento
      const orderBy = filters.ordenar || 'nombre';
      const orden = filters.orden || 'ASC';
      query += ` ORDER BY ${orderBy} ${orden}`;

      // Límite
      if (filters.limite) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limite);
      }

      const result = await pool.query(query, params);
      return result.rows;

    } catch (error) {
      console.error('❌ Error obteniendo productos filtrados:', error);
      throw error;
    }
  }

  /**
   * Generar reportes automáticos de análisis empresarial
   */
  static async generateBusinessReports(req, res) {
    try {
      // Análisis de inventario
      const inventoryAnalysis = await this.analyzeInventory();
      
      // Análisis de ventas (si hay datos)
      const salesAnalysis = await this.analyzeSales();
      
      // Productos sin rotación
      const stagnantProducts = await this.findStagnantProducts();
      
      // Oportunidades de optimización
      const opportunities = await this.findOptimizationOpportunities();

      const report = {
        generatedAt: new Date().toISOString(),
        inventory: inventoryAnalysis,
        sales: salesAnalysis,
        stagnantProducts: stagnantProducts,
        opportunities: opportunities,
        summary: {
          totalProducts: inventoryAnalysis.totalProducts,
          totalValue: inventoryAnalysis.totalValue,
          lowStockItems: inventoryAnalysis.lowStockCount,
          highValueItems: inventoryAnalysis.highValueCount
        }
      };

      // Registrar actividad
      await this.logAutomaticActivity('business_report', {
        reportType: 'complete_analysis',
        metricsAnalyzed: Object.keys(report).length
      });

      res.json({
        success: true,
        message: 'Reporte empresarial generado',
        data: report
      });

    } catch (error) {
      console.error('❌ Error generando reporte empresarial:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando reporte',
        error: error.message
      });
    }
  }

  /**
   * Configurar alertas automáticas
   */
  static async setupAutomaticAlerts(req, res) {
    try {
      const { alertTypes = ['stock_bajo', 'productos_estancados', 'oportunidades_precio'] } = req.body;

      const alerts = [];
      const summaryByType = {};

      for (const alertType of alertTypes) {
        switch (alertType) {
          case 'stock_bajo':
            const lowStockAlerts = await this.createLowStockAlerts();
            alerts.push(...lowStockAlerts);
            summaryByType.stock_bajo = (summaryByType.stock_bajo || 0) + lowStockAlerts.length;
            break;

          case 'productos_estancados':
            const stagnantAlerts = await this.createStagnantProductAlerts();
            alerts.push(...stagnantAlerts);
            summaryByType.productos_estancados = (summaryByType.productos_estancados || 0) + stagnantAlerts.length;
            break;

          case 'oportunidades_precio':
            const priceOpportunityAlerts = await this.createPriceOpportunityAlerts();
            alerts.push(...priceOpportunityAlerts);
            summaryByType.oportunidades_precio = (summaryByType.oportunidades_precio || 0) + priceOpportunityAlerts.length;
            break;
        }
      }

      await this.logAutomaticActivity('alert_setup', {
        alertTypes,
        alertsCreated: alerts.length,
        summaryByType
      });

      res.json({
        success: true,
        message: 'Alertas automáticas configuradas',
        data: {
          alertsCreated: alerts.length,
          alerts: alerts,
          summaryByType
        }
      });

    } catch (error) {
      console.error('❌ Error configurando alertas:', error);
      res.status(500).json({
        success: false,
        message: 'Error configurando alertas automáticas',
        error: error.message
      });
    }
  }

  /**
   * Análisis de inventario
   */
  static async analyzeInventory() {
    try {
      // Primero verificamos qué columnas existen
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'productos'
      `;
      
      const columnsResult = await pool.query(columnsQuery);
      const columns = columnsResult.rows.map(row => row.column_name);
      
      // Consulta base que funciona con la estructura actual
      let query = `
        SELECT 
          COUNT(*) as total_products,
          AVG(precio) as avg_price
      `;
      
      // Agregar campos opcionales si existen
      if (columns.includes('stock')) {
        query += `, SUM(precio * COALESCE(stock, 0)) as total_value,
                    SUM(COALESCE(stock, 0)) as total_stock,
                    COUNT(*) FILTER (WHERE COALESCE(stock, 0) < 10) as low_stock_count`;
      } else {
        query += `, SUM(precio * 1) as total_value,
                    COUNT(*) as total_stock,
                    0 as low_stock_count`;
      }
      
      if (columns.includes('popularidad')) {
        query += `, COUNT(*) FILTER (WHERE COALESCE(popularidad, 0) < 20) as low_popularity_count`;
      } else {
        query += `, 0 as low_popularity_count`;
      }
      
      query += `, COUNT(*) FILTER (WHERE precio > 100) as high_value_count
        FROM productos 
        WHERE 1=1`;
        
      // Solo filtrar por activo si la columna existe
      if (columns.includes('activo')) {
        query += ` AND COALESCE(activo, true) = true`;
      }
      
      const result = await pool.query(query);
      const stats = result.rows[0];

      // Análisis por categoría (adaptativo)
      let categoryQuery = `
        SELECT 
          COALESCE(categoria, 'General') as categoria,
          COUNT(*) as productos,
          AVG(precio) as precio_promedio
      `;
      
      if (columns.includes('stock')) {
        categoryQuery += `, SUM(precio * COALESCE(stock, 1)) as valor_inventario,
                           SUM(COALESCE(stock, 1)) as stock_total`;
      } else {
        categoryQuery += `, SUM(precio) as valor_inventario,
                           COUNT(*) as stock_total`;
      }
      
      categoryQuery += ` FROM productos WHERE 1=1`;
      
      if (columns.includes('activo')) {
        categoryQuery += ` AND COALESCE(activo, true) = true`;
      }
      
      if (columns.includes('categoria')) {
        categoryQuery += ` GROUP BY categoria`;
      } else {
        categoryQuery += ` GROUP BY 'General'`;
      }
      
      categoryQuery += ` ORDER BY valor_inventario DESC`;
      
      const categoryResult = await pool.query(categoryQuery);

      return {
        totalProducts: parseInt(stats.total_products),
        totalValue: parseFloat(stats.total_value || 0).toFixed(2),
        avgPrice: parseFloat(stats.avg_price || 0).toFixed(2),
        totalStock: parseInt(stats.total_stock || 0),
        lowStockCount: parseInt(stats.low_stock_count),
        highValueCount: parseInt(stats.high_value_count),
        lowPopularityCount: parseInt(stats.low_popularity_count),
        categoryBreakdown: categoryResult.rows
      };

    } catch (error) {
      console.error('❌ Error analizando inventario:', error);
      return {};
    }
  }

  /**
   * Análisis de ventas
   */
  static async analyzeSales() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_sales,
          SUM(precio_venta * cantidad) as total_revenue,
          AVG(precio_venta) as avg_sale_price,
          COUNT(DISTINCT producto_id) as productos_vendidos
        FROM ventas 
        WHERE fecha_venta >= NOW() - INTERVAL '30 days'
      `;
      
      const result = await pool.query(query);
      const stats = result.rows[0];

      return {
        totalSales: parseInt(stats.total_sales || 0),
        totalRevenue: parseFloat(stats.total_revenue || 0).toFixed(2),
        avgSalePrice: parseFloat(stats.avg_sale_price || 0).toFixed(2),
        productsSold: parseInt(stats.productos_vendidos || 0)
      };

    } catch (error) {
      console.error('❌ Error analizando ventas:', error);
      return {
        totalSales: 0,
        totalRevenue: '0.00',
        avgSalePrice: '0.00',
        productsSold: 0,
        note: 'Datos de ventas no disponibles'
      };
    }
  }

  /**
   * Encontrar productos estancados (sin tabla de ventas)
   */
  static async findStagnantProducts() {
    try {
      // Verificar columnas disponibles
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'productos'
      `;
      
      const columnsResult = await pool.query(columnsQuery);
      const columns = columnsResult.rows.map(row => row.column_name);
      
      // Consulta simplificada que funciona sin tabla de ventas
      let query = `SELECT * FROM productos WHERE 1=1`;
      
      if (columns.includes('activo')) {
        query += ` AND COALESCE(activo, true) = true`;
      }
      
      if (columns.includes('stock')) {
        query += ` AND COALESCE(stock, 0) > 0`;
      }
      
      if (columns.includes('popularidad')) {
        query += ` AND COALESCE(popularidad, 0) < 20`;
      }
      
      query += ` ORDER BY precio DESC LIMIT 10`;
      
      const result = await pool.query(query);
      return result.rows;

    } catch (error) {
      console.error('❌ Error encontrando productos estancados:', error);
      return [];
    }
  }

  /**
   * Encontrar oportunidades de optimización (adaptativo)
   */
  static async findOptimizationOpportunities() {
    try {
      // Verificar columnas disponibles
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'productos'
      `;
      
      const columnsResult = await pool.query(columnsQuery);
      const columns = columnsResult.rows.map(row => row.column_name);
      
      const opportunities = [];

      // Productos sin descripción completa
      const incompleteQuery = `
        SELECT * FROM productos 
        WHERE (descripcion IS NULL OR descripcion = '' OR LENGTH(descripcion) < 10)
        LIMIT 10
      `;
      
      const incompleteResult = await pool.query(incompleteQuery);
      
      if (incompleteResult.rows.length > 0) {
        opportunities.push({
          type: 'incomplete_products',
          title: 'Productos con información incompleta',
          description: 'Productos que necesitan mejor descripción',
          count: incompleteResult.rows.length,
          items: incompleteResult.rows
        });
      }

      // Productos con precios muy bajos o altos
      const priceAnalysisQuery = `
        SELECT 
          AVG(precio) as precio_promedio,
          MIN(precio) as precio_min,
          MAX(precio) as precio_max
        FROM productos 
        WHERE precio > 0
      `;
      
      const priceResult = await pool.query(priceAnalysisQuery);
      const avgPrice = parseFloat(priceResult.rows[0].precio_promedio || 0);
      
      if (avgPrice > 0) {
        const outlierQuery = `
          SELECT * FROM productos 
          WHERE precio > 0 AND (precio < $1 OR precio > $2)
          LIMIT 10
        `;
        
        const outlierResult = await pool.query(outlierQuery, [avgPrice * 0.2, avgPrice * 3]);
        
        if (outlierResult.rows.length > 0) {
          opportunities.push({
            type: 'price_outliers',
            title: 'Productos con precios atípicos',
            description: 'Productos con precios muy por encima o debajo del promedio',
            count: outlierResult.rows.length,
            items: outlierResult.rows
          });
        }
      }

      return opportunities;

    } catch (error) {
      console.error('❌ Error encontrando oportunidades:', error);
      return [];
    }
  }

  /**
   * Crear alertas de stock bajo (simplificado)
   */
  static async createLowStockAlerts() {
    try {
      // Verificar columnas disponibles
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'productos'
      `;
      
      const columnsResult = await pool.query(columnsQuery);
      const columns = columnsResult.rows.map(row => row.column_name);
      
      // Consulta adaptativa
      let query = `SELECT * FROM productos WHERE 1=1`;
      
      if (columns.includes('activo')) {
        query += ` AND COALESCE(activo, true) = true`;
      }
      
      if (columns.includes('stock')) {
        query += ` AND COALESCE(stock, 0) > 0 AND COALESCE(stock, 0) < 10`;
      } else {
        // Si no hay columna stock, simular alertas con productos de precio bajo
        query += ` AND precio < 20`;
      }
      
      const result = await pool.query(query);
      const alerts = [];

      // Crear alertas simples (sin insertar en base de datos por ahora)
      for (const product of result.rows) {
        const stockValue = product.stock || 'N/A';
        const mensaje = `Atención requerida para ${product.nombre}. ${stockValue !== 'N/A' ? `Stock: ${stockValue}` : 'Precio bajo: €' + product.precio}`;
        
        alerts.push({
          id: Date.now() + Math.random(),
          tipo_alerta: 'atencion_producto',
          producto_id: product.id,
          mensaje: mensaje,
          nivel_prioridad: stockValue < 5 || product.precio < 10 ? 'alta' : 'media',
          fecha_creacion: new Date().toISOString(),
          product: product
        });
      }

      return alerts.slice(0, 10); // Limitar a 10 alertas

    } catch (error) {
      console.error('❌ Error creando alertas:', error);
      return [];
    }
  }

  /**
   * Crear alertas de productos estancados
   */
  static async createStagnantProductAlerts() {
    try {
      const stagnantProducts = await this.findStagnantProducts();
      if (!Array.isArray(stagnantProducts) || stagnantProducts.length === 0) {
        return [];
      }

      return stagnantProducts.slice(0, 10).map(product => {
        const stock = typeof product.stock === 'number'
          ? product.stock
          : typeof product.cantidad === 'number'
            ? product.cantidad
            : null;

        const prioridad = stock !== null && stock < 5 ? 'alta' : 'media';

        const baseMessage = product.nombre
          ? `Producto ${product.nombre} presenta baja rotación.`
          : 'Producto con baja rotación identificado.';

        const stockMessage = stock !== null ? ` Stock actual: ${stock}.` : '';

        return {
          id: Date.now() + Math.random(),
          tipo_alerta: 'productos_estancados',
          producto_id: product.id,
          mensaje: `${baseMessage}${stockMessage}`.trim(),
          nivel_prioridad: prioridad,
          fecha_creacion: new Date().toISOString(),
          product
        };
      });

    } catch (error) {
      console.error('❌ Error creando alertas de productos estancados:', error);
      return [];
    }
  }

  /**
   * Crear alertas de oportunidades de precio
   */
  static async createPriceOpportunityAlerts() {
    try {
      const priceStatsQuery = `
        SELECT 
          AVG(precio) as precio_promedio
        FROM productos 
        WHERE precio > 0
      `;

      const priceStatsResult = await pool.query(priceStatsQuery);
      const avgPrice = parseFloat(priceStatsResult.rows?.[0]?.precio_promedio || 0);

      if (!avgPrice || Number.isNaN(avgPrice)) {
        return [];
      }

      const minThreshold = avgPrice * 0.6; // 40% por debajo del promedio
      const maxThreshold = avgPrice * 1.4; // 40% por encima del promedio

      const opportunityQuery = `
        SELECT * FROM productos 
        WHERE precio > 0 AND (precio < $1 OR precio > $2)
        ORDER BY precio ASC
        LIMIT 20
      `;

      const opportunityResult = await pool.query(opportunityQuery, [minThreshold, maxThreshold]);

      if (!opportunityResult.rows.length) {
        return [];
      }

      return opportunityResult.rows.slice(0, 10).map(product => {
        const price = parseFloat(product.precio) || 0;
        const deviation = avgPrice ? price / avgPrice : 1;
        const isHigh = deviation > 1;
        const variacionPorcentaje = (deviation - 1) * 100;
        const variacionTexto = `${variacionPorcentaje >= 0 ? '+' : ''}${variacionPorcentaje.toFixed(1)}%`;

        let prioridad = 'media';
        if (Math.abs(deviation - 1) >= 0.4) {
          prioridad = 'alta';
        }

        const stock = typeof product.stock === 'number'
          ? product.stock
          : typeof product.cantidad === 'number'
            ? product.cantidad
            : null;

        const directionText = isHigh ? 'alto' : 'bajo';

        const stockText = stock !== null ? ` Stock disponible: ${stock}.` : '';

        return {
          id: Date.now() + Math.random(),
          tipo_alerta: 'oportunidades_precio',
          producto_id: product.id,
          mensaje: `Precio ${directionText} detectado para ${product.nombre || 'producto'}. Actual: $${price.toFixed(2)} vs promedio $${avgPrice.toFixed(2)} (${variacionTexto}).${stockText}`.trim(),
          nivel_prioridad: prioridad,
          fecha_creacion: new Date().toISOString(),
          product,
          promedioReferencia: avgPrice
        };
      });

    } catch (error) {
      console.error('❌ Error creando alertas de oportunidades de precio:', error);
      return [];
    }
  }

  /**
   * Registrar actividad automática
   */
  static async logAutomaticActivity(activityType, details) {
    try {
      const query = `
        INSERT INTO actividades_automaticas (tipo_actividad, detalles, fecha_ejecucion)
        VALUES ($1, $2, $3)
      `;
      
      // Crear tabla si no existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS actividades_automaticas (
          id SERIAL PRIMARY KEY,
          tipo_actividad VARCHAR(100) NOT NULL,
          detalles JSONB,
          fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await pool.query(query, [activityType, JSON.stringify(details), new Date()]);
      
    } catch (error) {
      console.error('❌ Error registrando actividad automática:', error);
    }
  }

  /**
   * Programar tareas automáticas
   */
  static setupAutomaticTasks() {
    // Generar catálogos diariamente a las 8 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('🕐 Ejecutando generación automática de catálogos...');
      try {
        await this.generateAutomaticCatalogs({ body: {} }, {
          json: (data) => console.log('✅ Catálogos generados automáticamente:', data)
        });
      } catch (error) {
        console.error('❌ Error en tarea automática de catálogos:', error);
      }
    });

    // Verificar alertas cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('🔔 Verificando alertas automáticas...');
      try {
        await this.setupAutomaticAlerts({ body: {} }, {
          json: (data) => console.log('✅ Alertas verificadas:', data)
        });
      } catch (error) {
        console.error('❌ Error en verificación de alertas:', error);
      }
    });

    console.log('⏰ Tareas automáticas programadas correctamente');
  }
}

module.exports = EnterpriseController;
