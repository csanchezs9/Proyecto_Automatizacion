import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const query = `
      SELECT id, nombre, descripcion, precio, talla, cantidad, imagen_url, creado_en 
      FROM productos 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Producto no encontrado'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Producto obtenido exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const query = 'DELETE FROM productos WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Producto no encontrado'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Producto eliminado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al eliminar el producto',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
