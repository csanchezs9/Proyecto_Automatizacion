import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Oportunidades de negocio
    const oportunidadesQuery = `
      SELECT 
        'Productos con bajo stock' as tipo_oportunidad,
        COUNT(*) as cantidad,
        'Reabastecer inventario' as accion_recomendada
      FROM productos
      WHERE cantidad > 0 AND cantidad < 5
      
      UNION ALL
      
      SELECT 
        'Productos sin stock' as tipo_oportunidad,
        COUNT(*) as cantidad,
        'Urgente: Reabastecer' as accion_recomendada
      FROM productos
      WHERE cantidad = 0
      
      UNION ALL
      
      SELECT 
        'Productos de alto valor' as tipo_oportunidad,
        COUNT(*) as cantidad,
        'Promoción especial' as accion_recomendada
      FROM productos
      WHERE precio > (SELECT AVG(precio) * 1.5 FROM productos)
    `;

    const result = await pool.query(oportunidadesQuery);

    return NextResponse.json({
      success: true,
      data: {
        oportunidades: result.rows,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error en opportunities:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener oportunidades',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
