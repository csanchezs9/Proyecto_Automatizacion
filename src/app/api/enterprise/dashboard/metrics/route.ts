import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Métricas del dashboard
    const metricsQuery = `
      SELECT 
        COUNT(*) as total_productos,
        SUM(cantidad) as total_inventario,
        AVG(precio) as precio_promedio,
        COUNT(CASE WHEN cantidad = 0 THEN 1 END) as productos_sin_stock,
        COUNT(CASE WHEN cantidad > 0 AND cantidad < 5 THEN 1 END) as stock_bajo,
        COUNT(CASE WHEN cantidad >= 5 THEN 1 END) as stock_normal
      FROM productos
    `;

    const valorInventarioQuery = `
      SELECT SUM(precio * cantidad) as valor_total_inventario
      FROM productos
    `;

    const [metrics, valorInv] = await Promise.all([
      pool.query(metricsQuery),
      pool.query(valorInventarioQuery)
    ]);

    const data = metrics.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        total_productos: parseInt(data.total_productos) || 0,
        total_inventario: parseInt(data.total_inventario) || 0,
        precio_promedio: parseFloat(data.precio_promedio) || 0,
        productos_sin_stock: parseInt(data.productos_sin_stock) || 0,
        productos_stock_bajo: parseInt(data.stock_bajo) || 0,
        productos_stock_normal: parseInt(data.stock_normal) || 0,
        valor_total_inventario: parseFloat(valorInv.rows[0].valor_total_inventario) || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en dashboard/metrics:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener métricas del dashboard',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
