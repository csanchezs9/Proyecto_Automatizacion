import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Intentar una query simple para verificar la conexión
    const result = await pool.query('SELECT NOW()');
    
    return NextResponse.json({
      success: true,
      status: 'online',
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      database: 'connected',
      serverTime: result.rows[0].now
    });
  } catch (error) {
    console.error('Error en health check:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: 'Error de conexión a base de datos',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
