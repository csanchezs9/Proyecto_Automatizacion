import TelegramBot from 'node-telegram-bot-api';

interface AlertProduct {
  id: string | number;
  nombre?: string;
  name?: string;
  stock?: number;
  cantidad?: number;
}

interface AlertDetails {
  productosSinStock?: AlertProduct[];
  stockBajo?: AlertProduct[];
}

class TelegramService {
  private bot: TelegramBot;
  private chatId: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!token || !chatId) {
      throw new Error('TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID deben estar configurados');
    }
    
    this.bot = new TelegramBot(token, { polling: false });
    this.chatId = chatId;
  }

  /**
   * Enviar detalles completos de alertas y tareas a Telegram
   */
  async sendAlertDetails(alertDetails: AlertDetails): Promise<{ success: boolean; message: string }> {
    try {
      // Construir mensaje principal
      let message = '🔔 *DETALLES DE ALERTAS Y TAREAS*\n\n';
      message += '⚠️ *Alertas de Inventario*\n\n';

      // Productos Sin Stock
      if (alertDetails.productosSinStock && alertDetails.productosSinStock.length > 0) {
        message += `🔴 *Productos Sin Stock* (${alertDetails.productosSinStock.length} producto${alertDetails.productosSinStock.length > 1 ? 's' : ''})\n`;
        message += `${alertDetails.productosSinStock.length} producto${alertDetails.productosSinStock.length > 1 ? 's' : ''} sin inventario\n\n`;
        
        alertDetails.productosSinStock.forEach((p, index) => {
          const nombre = p.nombre || p.name || 'Sin nombre';
          const stock = p.stock || p.cantidad || 0;
          
          message += `${index + 1}. *${p.id}* - ${nombre}\n`;
          message += `   📦 Stock: *${stock}*\n\n`;
        });
      }

      // Stock Bajo
      if (alertDetails.stockBajo && alertDetails.stockBajo.length > 0) {
        message += `⚠️ *Stock Bajo* (${alertDetails.stockBajo.length} producto${alertDetails.stockBajo.length > 1 ? 's' : ''})\n`;
        message += `${alertDetails.stockBajo.length} producto${alertDetails.stockBajo.length > 1 ? 's' : ''} con menos de 5 unidades\n\n`;
        
        alertDetails.stockBajo.forEach((p, index) => {
          const nombre = p.nombre || p.name || 'Sin nombre';
          const stock = p.stock || p.cantidad || 0;
          
          message += `${index + 1}. *${p.id}* - ${nombre}\n`;
          message += `   📦 Stock: *${stock}* unidades\n\n`;
        });
      }

      // Fecha y hora
      message += `📅 ${new Date().toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        dateStyle: 'full',
        timeStyle: 'short'
      })}`;

      // Enviar mensaje
      await this.bot.sendMessage(this.chatId, message, { 
        parse_mode: 'Markdown'
      });

      return { success: true, message: 'Alertas enviadas correctamente' };
      
    } catch (error) {
      console.error('❌ Error enviando detalles por Telegram:', error);
      throw error;
    }
  }

  /**
   * Probar conexión con Telegram
   */
  async testConnection(): Promise<{ success: boolean; bot: TelegramBot.User }> {
    try {
      const me = await this.bot.getMe();
      const testMessage = `🤖 *Conexión exitosa*\n\nBot: ${me.first_name}\nID: ${me.id}\n\n✅ Sistema de alertas listo`;
      
      await this.bot.sendMessage(this.chatId, testMessage, { 
        parse_mode: 'Markdown' 
      });
      
      return { success: true, bot: me };
    } catch (error) {
      console.error('❌ Error conectando con Telegram:', error);
      throw error;
    }
  }
}

export default TelegramService;
