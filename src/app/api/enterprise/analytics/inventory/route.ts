import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { rows: productos } = await pool.query(
      'SELECT id, nombre, cantidad, precio, talla FROM productos ORDER BY cantidad ASC'
    );

    // Análisis por talla
    const tallaStats: any = {};
    productos.forEach((p: any) => {
      const talla = p.talla || 'Sin talla';
      if (!tallaStats[talla]) {
        tallaStats[talla] = {
          total: 0,
          sin_stock: 0,
          stock_bajo: 0,
          stock_normal: 0
        };
      }
      tallaStats[talla].total++;
      if (p.cantidad === 0) tallaStats[talla].sin_stock++;
      else if (p.cantidad < 5) tallaStats[talla].stock_bajo++;
      else tallaStats[talla].stock_normal++;
    });

    return NextResponse.json({
      success: true,
      data: {
        resumen_por_talla: tallaStats,
        total_productos: productos.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en analytics/inventory:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener análisis de inventario',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
