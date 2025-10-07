import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import PDFService from '@/lib/pdfService';
import fs from 'fs';
import path from 'path';

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

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `productos-${timestamp}.pdf`;

    // Guardar el PDF en la carpeta public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));

    // Retornar JSON con información del archivo (compatible con HTML original)
    return NextResponse.json({
      success: true,
      message: 'PDF generado exitosamente',
      data: {
        filename: fileName,
        downloadUrl: `/uploads/${fileName}`,
        timestamp: new Date().toISOString(),
        totalProducts: result.rows.length
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
