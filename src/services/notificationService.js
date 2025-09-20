const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Inicializar el servicio de notificaciones
   */
  async initialize() {
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        
        // Verificar conexión
        await this.transporter.verify();
        this.initialized = true;
        console.log('✅ Servicio de notificaciones inicializado');
        return true;
      } else {
        console.log('⚠️ Servicio de notificaciones no configurado (variables SMTP faltantes)');
        return false;
      }
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error.message);
      return false;
    }
  }

  /**
   * Enviar notificación de catálogos generados
   */
  async sendCatalogNotification(catalogData) {
    if (!this.initialized || !process.env.NOTIFICATION_EMAIL) {
      console.log('📧 Notificación por email no disponible');
      return false;
    }

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #3b82f6); color: white; padding: 20px; text-align: center;">
            <h2>🏪 Catálogos Generados Automáticamente</h2>
          </div>
          
          <div style="padding: 20px; background: #f8fafc;">
            <h3>Resumen de la generación:</h3>
            <ul style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <li><strong>Carpeta principal:</strong> <a href="${catalogData.mainFolder.webViewLink}">${catalogData.mainFolder.name}</a></li>
              <li><strong>Catálogos creados:</strong> ${catalogData.catalogs.length}</li>
              <li><strong>Productos procesados:</strong> ${catalogData.totalProducts}</li>
              <li><strong>Fecha de generación:</strong> ${new Date(catalogData.generatedAt).toLocaleString()}</li>
            </ul>
            
            <h4>Catálogos generados:</h4>
            <div style="background: white; padding: 15px; border-radius: 8px;">
              ${catalogData.catalogs.map(catalog => `
                <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px;">
                  <strong>${catalog.filter}</strong> - ${catalog.productCount} productos<br>
                  <small style="color: #64748b;">Tipo: ${catalog.type}</small>
                </div>
              `).join('')}
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px;">
              <p style="margin: 0; color: #1e40af;">
                <strong>💡 Sugerencia:</strong> Revise los catálogos generados y considere compartirlos con su equipo comercial.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background: #1e293b; color: white;">
            <p style="margin: 0;">Generado automáticamente por Sistema de Gestión Empresarial</p>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.NOTIFICATION_EMAIL,
        subject: `📁 Catálogos generados automáticamente - ${new Date().toLocaleDateString()}`,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log('📧 Notificación de catálogos enviada por email');
      return true;

    } catch (error) {
      console.error('❌ Error enviando notificación por email:', error.message);
      return false;
    }
  }

  /**
   * Enviar alerta de stock bajo
   */
  async sendLowStockAlert(products) {
    if (!this.initialized || !process.env.NOTIFICATION_EMAIL) return false;

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; text-align: center;">
            <h2>⚠️ Alerta de Stock Bajo</h2>
          </div>
          
          <div style="padding: 20px; background: #fef2f2;">
            <p><strong>${products.length} productos</strong> tienen stock bajo y necesitan reabastecimiento:</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              ${products.slice(0, 10).map(product => `
                <div style="margin-bottom: 10px; padding: 10px; border-left: 4px solid #ef4444; background: #fef2f2;">
                  <strong>${product.nombre}</strong><br>
                  <span style="color: #dc2626;">Stock actual: ${product.stock} unidades</span><br>
                  <small style="color: #64748b;">Precio: €${product.precio} | SKU: ${product.sku || product.id}</small>
                </div>
              `).join('')}
              
              ${products.length > 10 ? `
                <div style="text-align: center; padding: 10px; color: #64748b;">
                  ... y ${products.length - 10} productos más
                </div>
              ` : ''}
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #fbbf24; border-radius: 8px; color: #92400e;">
              <p style="margin: 0;">
                <strong>🚨 Acción requerida:</strong> Contacte con los proveedores para reabastecer estos productos antes de que se agoten.
              </p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.NOTIFICATION_EMAIL,
        subject: `🚨 ALERTA: Stock bajo en ${products.length} productos`,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log('📧 Alerta de stock bajo enviada por email');
      return true;

    } catch (error) {
      console.error('❌ Error enviando alerta de stock:', error.message);
      return false;
    }
  }

  /**
   * Enviar reporte de oportunidades
   */
  async sendOpportunitiesReport(opportunities) {
    if (!this.initialized || !process.env.NOTIFICATION_EMAIL) return false;

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center;">
            <h2>💡 Oportunidades de Optimización</h2>
          </div>
          
          <div style="padding: 20px; background: #fffbeb;">
            <p>Se han identificado <strong>${opportunities.length} oportunidades</strong> para optimizar su negocio:</p>
            
            ${opportunities.map(opp => `
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b;">
                <h4 style="margin-top: 0; color: #92400e;">${opp.title}</h4>
                <p style="color: #64748b;">${opp.description}</p>
                <p><strong>Items identificados:</strong> ${opp.count}</p>
                
                ${opp.items && opp.items.length > 0 ? `
                  <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; font-weight: bold;">Ver detalles</summary>
                    <div style="margin-top: 10px; padding: 10px; background: #f9fafb; border-radius: 4px;">
                      ${opp.items.slice(0, 5).map(item => `
                        <div style="margin-bottom: 5px;">
                          <strong>${item.nombre}</strong> - €${item.precio}
                          ${item.margen_actual ? ` (Margen: ${item.margen_actual.toFixed(1)}%)` : ''}
                        </div>
                      `).join('')}
                    </div>
                  </details>
                ` : ''}
              </div>
            `).join('')}
            
            <div style="margin-top: 20px; padding: 15px; background: #dbeafe; border-radius: 8px; color: #1e40af;">
              <p style="margin: 0;">
                <strong>📈 Próximos pasos:</strong> Revise estas oportunidades en el dashboard empresarial para implementar mejoras.
              </p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.NOTIFICATION_EMAIL,
        subject: `💡 Oportunidades de optimización identificadas`,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log('📧 Reporte de oportunidades enviado por email');
      return true;

    } catch (error) {
      console.error('❌ Error enviando reporte de oportunidades:', error.message);
      return false;
    }
  }

  /**
   * Enviar notificación de sistema
   */
  async sendSystemNotification(title, message, type = 'info') {
    if (!this.initialized || !process.env.NOTIFICATION_EMAIL) return false;

    const colors = {
      info: { bg: '#3b82f6', border: '#2563eb' },
      success: { bg: '#10b981', border: '#059669' },
      warning: { bg: '#f59e0b', border: '#d97706' },
      error: { bg: '#ef4444', border: '#dc2626' }
    };

    const color = colors[type] || colors.info;

    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${color.bg}, ${color.border}); color: white; padding: 20px; text-align: center;">
            <h2>${title}</h2>
          </div>
          
          <div style="padding: 20px; background: #f8fafc;">
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${color.bg};">
              ${message}
            </div>
            
            <div style="margin-top: 20px; text-align: center; color: #64748b;">
              <p>Fecha: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      `;

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.NOTIFICATION_EMAIL,
        subject: title,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Notificación del sistema enviada: ${title}`);
      return true;

    } catch (error) {
      console.error('❌ Error enviando notificación del sistema:', error.message);
      return false;
    }
  }
}

module.exports = new NotificationService();