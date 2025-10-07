import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Obtener opciones únicas para filtros
    const tallasQuery = 'SELECT DISTINCT talla FROM productos WHERE talla IS NOT NULL ORDER BY talla';
    const tallas = await pool.query(tallasQuery);

    const preciosQuery = 'SELECT MIN(precio) as min_precio, MAX(precio) as max_precio FROM productos';
    const precios = await pool.query(preciosQuery);

    return NextResponse.json({
      success: true,
      data: {
        tallas: tallas.rows.map(r => r.talla),
        rango_precios: {
          minimo: parseFloat(precios.rows[0].min_precio) || 0,
          maximo: parseFloat(precios.rows[0].max_precio) || 0
        },
        opciones_ordenar: [
          { value: 'nombre', label: 'Nombre' },
          { value: 'precio', label: 'Precio' },
          { value: 'cantidad', label: 'Stock' },
          { value: 'id', label: 'ID' }
        ]
      }
    });

  } catch (error) {
    console.error('Error en filters/options:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener opciones de filtros',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
