import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tasks = [
      {
        id: 1,
        name: "Verificación de Alertas",
        schedule: "Cada segundo",
        status: "running",
        enabled: true,
        lastRun: new Date().toISOString(),
        nextRun: new Date(Date.now() + 1000).toISOString() // +1 segundo
      }
    ];

    return NextResponse.json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('Error fetching enterprise tasks:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener las tareas',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
