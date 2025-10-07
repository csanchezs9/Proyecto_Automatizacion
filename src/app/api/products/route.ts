import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT id, nombre, descripcion, precio, talla, cantidad, imagen_url, creado_en 
      FROM productos 
      ORDER BY id ASC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      message: 'Productos obtenidos exitosamente',
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, descripcion, precio, talla, cantidad, imagen_url } = body;

    // Validaciones
    if (!nombre || !precio) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nombre y precio son campos requeridos'
        },
        { status: 400 }
      );
    }

    // Generar ID personalizado
    const idQuery = `
      SELECT id FROM productos 
      WHERE id LIKE 'c-%' 
      ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER) DESC 
      LIMIT 1
    `;
    
    const idResult = await pool.query(idQuery);
    let newId = 'c-1';
    
    if (idResult.rows.length > 0) {
      const lastId = idResult.rows[0].id;
      const lastNumber = parseInt(lastId.substring(2));
      newId = `c-${lastNumber + 1}`;
    }

    // Insertar producto
    const insertQuery = `
      INSERT INTO productos (id, nombre, descripcion, precio, talla, cantidad, imagen_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      newId,
      nombre,
      descripcion || null,
      precio,
      talla || null,
      cantidad || 0,
      imagen_url || null
    ]);

    return NextResponse.json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al crear el producto',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
