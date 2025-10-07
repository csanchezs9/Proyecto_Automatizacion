import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filters = {} } = body;

    // Construir query dinámica basada en filtros
    let query = 'SELECT id, nombre, descripcion, precio, talla, cantidad, imagen_url FROM productos WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters.talla) {
      query += ` AND talla = $${paramCount}`;
      params.push(filters.talla);
      paramCount++;
    }

    if (filters.precio_min !== undefined) {
      query += ` AND precio >= $${paramCount}`;
      params.push(filters.precio_min);
      paramCount++;
    }

    if (filters.precio_max !== undefined) {
      query += ` AND precio <= $${paramCount}`;
      params.push(filters.precio_max);
      paramCount++;
    }

    if (filters.stock_min !== undefined) {
      query += ` AND cantidad >= $${paramCount}`;
      params.push(filters.stock_min);
      paramCount++;
    }

    // Ordenamiento
    const ordenarPor = filters.ordenar || 'id';
    const orden = filters.orden || 'ASC';
    query += ` ORDER BY ${ordenarPor} ${orden}`;

    // Límite
    if (filters.limite) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limite);
    }

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      message: 'Catálogo generado exitosamente',
      data: {
        productos: result.rows,
        total: result.rows.length,
        filtros: filters,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generando catálogo:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al generar catálogo',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
