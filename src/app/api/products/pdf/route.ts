import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import PDFService from '@/lib/pdfService';

export async function GET(request: NextRequest) {
  try {
    const query = `
      SELECT id, nombre, descripcion, precio, talla, cantidad, imagen_url, creado_en 
      FROM productos 
      ORDER BY id ASC
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se encontraron productos disponibles'
      }, { status: 404 });
    }

    // Generar el PDF
    const pdfBuffer = await PDFService.generateProductsPDF(result.rows);

    // Generar nombre para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `catalogo-productos-${timestamp}.pdf`;

    // Retornar el PDF directamente como respuesta (sin guardarlo)
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error al generar PDF:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al generar el PDF',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
