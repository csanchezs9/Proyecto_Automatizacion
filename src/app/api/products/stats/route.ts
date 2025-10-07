import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_productos,
        SUM(cantidad) as total_stock,
        AVG(precio) as precio_promedio,
        MAX(precio) as precio_maximo,
        MIN(precio) as precio_minimo,
        COUNT(CASE WHEN cantidad = 0 THEN 1 END) as productos_sin_stock,
        COUNT(CASE WHEN cantidad > 0 AND cantidad < 5 THEN 1 END) as productos_stock_bajo
      FROM productos
    `;
    
    const result = await pool.query(query);
    const stats = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        totalProductos: parseInt(stats.total_productos) || 0,
        totalStock: parseInt(stats.total_stock) || 0,
        precioPromedio: parseFloat(stats.precio_promedio) || 0,
        precioMaximo: parseFloat(stats.precio_maximo) || 0,
        precioMinimo: parseFloat(stats.precio_minimo) || 0,
        productosSinStock: parseInt(stats.productos_sin_stock) || 0,
        productosStockBajo: parseInt(stats.productos_stock_bajo) || 0
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener estadísticas',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
