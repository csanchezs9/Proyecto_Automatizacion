import { NextRequest, NextResponse } from 'next/server';
import TelegramService from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const alertDetails = await request.json();

    // Validar que tenga las propiedades necesarias
    if (!alertDetails || (!alertDetails.productosSinStock && !alertDetails.stockBajo)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Se requieren los detalles de las alertas (productosSinStock o stockBajo)'
        },
        { status: 400 }
      );
    }

    const telegramService = new TelegramService();
    const result = await telegramService.sendAlertDetails(alertDetails);

    return NextResponse.json({
      success: true,
      message: 'Alertas enviadas correctamente a Telegram',
      data: result
    });

  } catch (error) {
    console.error('Error sending to Telegram:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al enviar las alertas a Telegram',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
