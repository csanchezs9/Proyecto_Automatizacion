import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT id, nombre_completo as nombre, correo as email, telefono, fecha_registro as creado_en, activo
      FROM clientes 
      WHERE activo = true
      ORDER BY nombre_completo ASC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener clientes',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre, email, telefono } = body;

    // Validaciones
    if (!nombre || !email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nombre y email son requeridos'
        },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO clientes (nombre_completo, correo, telefono, activo)
      VALUES ($1, $2, $3, true)
      RETURNING id, nombre_completo as nombre, correo as email, telefono, fecha_registro as creado_en, activo
    `;

    const values = [nombre, email, telefono || null];
    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: result.rows[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al crear cliente',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
