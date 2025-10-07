import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Análisis de inventario
    const inventoryQuery = `
      SELECT 
        COUNT(*) as total_productos,
        SUM(cantidad) as total_stock,
        AVG(precio) as precio_promedio,
        COUNT(CASE WHEN cantidad = 0 THEN 1 END) as sin_stock,
        COUNT(CASE WHEN cantidad > 0 AND cantidad < 5 THEN 1 END) as stock_bajo
      FROM productos
    `;

    // Análisis por talla
    const porTallaQuery = `
      SELECT 
        talla,
        COUNT(*) as total_productos,
        SUM(cantidad) as total_stock,
        AVG(precio) as precio_promedio,
        MAX(precio) as precio_maximo,
        MIN(precio) as precio_minimo
      FROM productos
      GROUP BY talla
      ORDER BY total_productos DESC
    `;

    // Top productos más caros
    const topCarosQuery = `
      SELECT id, nombre, precio, talla, cantidad
      FROM productos
      ORDER BY precio DESC
      LIMIT 10
    `;

    // Top productos con más stock
    const topStockQuery = `
      SELECT id, nombre, cantidad, talla, precio
      FROM productos
      ORDER BY cantidad DESC
      LIMIT 10
    `;

    const [inventory, porTalla, topCaros, topStock] = await Promise.all([
      pool.query(inventoryQuery),
      pool.query(porTallaQuery),
      pool.query(topCarosQuery),
      pool.query(topStockQuery)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Reportes generados exitosamente',
      data: {
        inventario_general: {
          total_productos: parseInt(inventory.rows[0].total_productos),
          total_stock: parseInt(inventory.rows[0].total_stock),
          precio_promedio: parseFloat(inventory.rows[0].precio_promedio),
          productos_sin_stock: parseInt(inventory.rows[0].sin_stock),
          productos_stock_bajo: parseInt(inventory.rows[0].stock_bajo)
        },
        analisis_por_talla: porTalla.rows.map(row => ({
          talla: row.talla,
          total_productos: parseInt(row.total_productos),
          total_stock: parseInt(row.total_stock),
          precio_promedio: parseFloat(row.precio_promedio),
          precio_maximo: parseFloat(row.precio_maximo),
          precio_minimo: parseFloat(row.precio_minimo)
        })),
        top_productos_caros: topCaros.rows,
        top_productos_stock: topStock.rows,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generando reportes:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al generar reportes',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
