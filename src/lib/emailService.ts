import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    // Configuración del transporter con Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /**
   * Enviar correo electrónico
   */
  async sendEmail(options: EmailOptions): Promise<any> {
    try {
      const mailOptions = {
        from: `"Cyntex" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || this.generateDefaultHTML(options.text),
        attachments: options.attachments || [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error enviando correo:', error);
      throw error;
    }
  }

  /**
   * Generar HTML por defecto para el correo
   */
  private generateDefaultHTML(text: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #00d4ff, #0ea5e9);
            color: #ffffff;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            color: #333333;
            line-height: 1.6;
          }
          .footer {
            background-color: #1e293b;
            color: #94a3b8;
            padding: 20px;
            text-align: center;
            font-size: 14px;
          }
          .footer a {
            color: #00d4ff;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Cyntex</h1>
          </div>
          <div class="content">
            ${text.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>Este correo fue enviado desde Cyntex</p>
            <p style="margin-top: 10px; font-size: 12px;">
              © ${new Date().getFullYear()} - Todos los derechos reservados
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Verificar configuración del servicio
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Servidor de correo listo');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de correo:', error);
      return false;
    }
  }
}

export default new EmailService();
