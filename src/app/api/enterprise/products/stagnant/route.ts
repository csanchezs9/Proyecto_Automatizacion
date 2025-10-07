import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Productos estancados (simulación - productos con stock alto pero precio bajo)
    const query = `
      SELECT id, nombre, cantidad, precio, talla
      FROM productos
      WHERE cantidad > 10 AND precio < (SELECT AVG(precio) FROM productos)
      ORDER BY cantidad DESC
      LIMIT 20
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      data: {
        productos_estancados: result.rows,
        total: result.rows.length,
        recomendacion: 'Considerar promociones o descuentos para estos productos',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en products/stagnant:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener productos estancados',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
