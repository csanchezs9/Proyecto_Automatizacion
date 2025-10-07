import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  icon: string;
  count: number;
  message: string;
  priority: 'high' | 'medium' | 'low';
  details: Array<{
    id: string | number;
    nombre: string;
    cantidad: number;
    talla: string;
    precio: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { rows: productos } = await pool.query(
      'SELECT id, nombre, cantidad, precio, talla FROM productos ORDER BY cantidad ASC'
    );

    // Productos sin stock (cantidad = 0)
    const sinStock = productos.filter((p: any) => p.cantidad === 0);

    // Productos con stock bajo (cantidad < 5 pero > 0)
    const stockBajo = productos.filter((p: any) => p.cantidad > 0 && p.cantidad < 5);

    const alerts: Alert[] = [];

    // Alerta de productos sin stock
    if (sinStock.length > 0) {
      alerts.push({
        id: 'sin-stock',
        type: 'critical',
        title: 'Productos Sin Stock',
        icon: '🔴',
        count: sinStock.length,
        message: `${sinStock.length} producto${sinStock.length > 1 ? 's' : ''} sin inventario`,
        priority: 'high',
        details: sinStock.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          cantidad: p.cantidad,
          talla: p.talla || 'N/A',
          precio: parseFloat(p.precio) || 0
        }))
      });
    }

    // Alerta de stock bajo
    if (stockBajo.length > 0) {
      alerts.push({
        id: 'stock-bajo',
        type: 'warning',
        title: 'Stock Bajo',
        icon: '⚠️',
        count: stockBajo.length,
        message: `${stockBajo.length} producto${stockBajo.length > 1 ? 's' : ''} con menos de 5 unidades`,
        priority: 'medium',
        details: stockBajo.map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          cantidad: p.cantidad,
          talla: p.talla || 'N/A',
          precio: parseFloat(p.precio) || 0
        }))
      });
    }

    // Alerta de análisis automático (siempre presente)
    alerts.push({
      id: 'analisis-automatico',
      type: 'info',
      title: 'Análisis Automático',
      icon: '📊',
      count: 0,
      message: 'Sistema verificando tendencias de inventario',
      priority: 'low',
      details: []
    });

    return NextResponse.json({
      success: true,
      data: {
        alerts: alerts,
        totalAlerts: sinStock.length + stockBajo.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching enterprise alerts:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener las alertas',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
