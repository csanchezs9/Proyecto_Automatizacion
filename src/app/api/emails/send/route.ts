import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import emailService from '@/lib/emailService';
import PDFService from '@/lib/pdfService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clienteId, email, nombre, asunto, mensaje, adjuntarCatalogo } = body;

    // Validaciones
    if (!email || !asunto || !mensaje) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, asunto y mensaje son requeridos'
        },
        { status: 400 }
      );
    }

    // Preparar adjuntos si se solicita el catálogo
    let attachments = [];
    
    if (adjuntarCatalogo) {
      try {
        // Obtener productos para generar el PDF
        const query = `
          SELECT id, nombre, descripcion, precio, talla, cantidad, imagen_url, creado_en 
          FROM productos 
          ORDER BY id ASC
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
          const pdfBuffer = await PDFService.generateProductsPDF(result.rows);
          
          attachments.push({
            filename: 'catalogo-productos.pdf',
            content: Buffer.from(pdfBuffer),
            contentType: 'application/pdf'
          });
        }
      } catch (pdfError) {
        console.error('Error generando PDF para adjuntar:', pdfError);
        // Continuar sin el adjunto
      }
    }

    // Personalizar el mensaje
    const mensajePersonalizado = `
Hola ${nombre},

${mensaje}

---
Saludos cordiales,
Cyntex
    `.trim();

    // Enviar el correo
    const emailResult = await emailService.sendEmail({
      to: email,
      subject: asunto,
      text: mensajePersonalizado,
      attachments: attachments
    });

    // Registrar el envío en la base de datos (opcional)
    try {
      await pool.query(
        `INSERT INTO envios_correos (cliente_id, email, asunto, mensaje, enviado_en) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [clienteId || null, email, asunto, mensaje]
      );
    } catch (dbError) {
      console.error('Error guardando registro del envío:', dbError);
      // No fallar si no se puede guardar el registro
    }

    return NextResponse.json({
      success: true,
      message: 'Correo enviado exitosamente',
      data: {
        messageId: emailResult.messageId,
        to: email,
        subject: asunto,
        attachments: attachments.length
      }
    });

  } catch (error) {
    console.error('Error al enviar correo:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al enviar el correo',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
