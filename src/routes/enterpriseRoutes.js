const express = require('express');
const EnterpriseController = require('../controllers/enterpriseController');

const router = express.Router();

/**
 * @route POST /api/enterprise/catalogs/generate
 * @desc Generar catálogos automáticos con filtros específicos
 * @body {
 *   filters: {
 *     talla?: string,
 *     categoria?: string,
 *     temporada?: string,
 *     precio_min?: number,
 *     precio_max?: number,
 *     stock_min?: number,
 *     popularidad_min?: number,
 *     ordenar?: string,
 *     orden?: 'ASC'|'DESC',
 *     limite?: number
 *   }
 * }
 */
router.post('/catalogs/generate', EnterpriseController.generateAutomaticCatalogs);

/**
 * @route GET /api/enterprise/reports/business
 * @desc Generar reportes automáticos de análisis empresarial
 */
router.get('/reports/business', EnterpriseController.generateBusinessReports);

/**
 * @route POST /api/enterprise/alerts/setup
 * @desc Configurar alertas automáticas
 * @body {
 *   alertTypes: string[] // ['stock_bajo', 'productos_estancados', 'oportunidades_precio']
 * }
 */
router.post('/alerts/setup', EnterpriseController.setupAutomaticAlerts);

/**
 * @route GET /api/enterprise/analytics/inventory
 * @desc Análisis detallado de inventario
 */
router.get('/analytics/inventory', async (req, res) => {
  try {
    const analysis = await EnterpriseController.analyzeInventory();
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en análisis de inventario',
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/products/stagnant
 * @desc Obtener productos sin rotación
 */
router.get('/products/stagnant', async (req, res) => {
  try {
    const stagnantProducts = await EnterpriseController.findStagnantProducts();
    res.json({
      success: true,
      data: stagnantProducts,
      count: stagnantProducts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo productos estancados',
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/opportunities
 * @desc Obtener oportunidades de optimización
 */
router.get('/opportunities', async (req, res) => {
  try {
    const opportunities = await EnterpriseController.findOptimizationOpportunities();
    res.json({
      success: true,
      data: opportunities,
      count: opportunities.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo oportunidades',
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/filters/options
 * @desc Obtener opciones disponibles para filtros
 */
router.get('/filters/options', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // Obtener opciones únicas para filtros
    const tallaQuery = 'SELECT DISTINCT talla FROM productos WHERE activo = true AND talla IS NOT NULL ORDER BY talla';
    const categoriaQuery = 'SELECT DISTINCT categoria FROM productos WHERE activo = true AND categoria IS NOT NULL ORDER BY categoria';
    const temporadaQuery = 'SELECT DISTINCT temporada FROM productos WHERE activo = true AND temporada IS NOT NULL ORDER BY temporada';
    const preciosQuery = 'SELECT MIN(precio) as precio_min, MAX(precio) as precio_max FROM productos WHERE activo = true';
    
    const [tallas, categorias, temporadas, precios] = await Promise.all([
      pool.query(tallaQuery),
      pool.query(categoriaQuery),
      pool.query(temporadaQuery),
      pool.query(preciosQuery)
    ]);

    res.json({
      success: true,
      data: {
        tallas: tallas.rows.map(row => row.talla),
        categorias: categorias.rows.map(row => row.categoria),
        temporadas: temporadas.rows.map(row => row.temporada),
        precios: precios.rows[0] || { precio_min: 0, precio_max: 1000 }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo opciones de filtros',
      error: error.message
    });
  }
});

/**
 * @route POST /api/enterprise/products/bulk-update
 * @desc Actualización masiva de productos
 */
router.post('/products/bulk-update', async (req, res) => {
  try {
    const { updates, criteria } = req.body;
    const { pool } = require('../config/database');
    
    // Construir query de actualización masiva
    let query = 'UPDATE productos SET ';
    const setClause = [];
    const params = [];
    let paramCount = 0;

    // Campos a actualizar
    for (const [field, value] of Object.entries(updates)) {
      paramCount++;
      setClause.push(`${field} = $${paramCount}`);
      params.push(value);
    }

    query += setClause.join(', ');
    query += ' WHERE activo = true';

    // Aplicar criterios de filtro
    if (criteria) {
      for (const [field, value] of Object.entries(criteria)) {
        paramCount++;
        query += ` AND ${field} = $${paramCount}`;
        params.push(value);
      }
    }

    query += ' RETURNING *';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Productos actualizados masivamente',
      data: {
        updatedCount: result.rows.length,
        products: result.rows
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en actualización masiva',
      error: error.message
    });
  }
});

/**
 * @route GET /api/enterprise/dashboard/metrics
 * @desc Métricas para dashboard ejecutivo
 */
router.get('/dashboard/metrics', async (req, res) => {
  try {
    const { pool } = require('../config/database');
    
    // KPIs principales
    const metricsQuery = `
      SELECT 
        COUNT(*) as total_products,
        SUM(precio * stock) as inventory_value,
        COUNT(*) FILTER (WHERE stock < 10) as low_stock_items,
        COUNT(*) FILTER (WHERE popularidad > 70) as popular_items,
        AVG(precio) as avg_price,
        COUNT(DISTINCT categoria) as categories_count,
        COUNT(DISTINCT talla) as sizes_count
      FROM productos 
      WHERE activo = true
    `;

    const alertsQuery = `
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(*) FILTER (WHERE nivel_prioridad = 'alta') as high_priority,
        COUNT(*) FILTER (WHERE leida = false) as unread_alerts
      FROM alertas_sistema
    `;

    const [metrics, alerts] = await Promise.all([
      pool.query(metricsQuery),
      pool.query(alertsQuery).catch(() => ({ rows: [{ total_alerts: 0, high_priority: 0, unread_alerts: 0 }] }))
    ]);

    const dashboard = {
      inventory: metrics.rows[0],
      alerts: alerts.rows[0],
      lastUpdated: new Date().toISOString(),
      recommendations: [
        'Revisar productos con stock bajo',
        'Optimizar precios de productos populares',
        'Categorizar productos sin clasificar'
      ]
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas del dashboard',
      error: error.message
    });
  }
});

module.exports = router;