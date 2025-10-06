# 📱 Integración de Telegram - Envío de Alertas

## ✅ Implementación Completada

Se ha agregado la funcionalidad para enviar los detalles de alertas y tareas directamente a Telegram desde el Dashboard Empresarial.

## 🔧 Configuración

### 1. Variables de Entorno (ya configuradas en `.env`)

```env
TELEGRAM_BOT_TOKEN=7902486945:AAF0ENScnFyxiBbAYt9D_p1lx67u68B7n34
TELEGRAM_CHAT_ID=1558851125
```

### 2. Dependencias Instaladas
ddd
```bash
npm install node-telegram-bot-api
```

## 📋 Funcionalidades Implementadas

### 1. **Botón "Enviar a Telegram" en el Modal de Detalles**

Ubicación: Modal "Detalles de Alertas y Tareas"

- **Icono**: <i class="fab fa-telegram"></i> Telegram
- **Acción**: Envía todos los detalles de las alertas al chat de Telegram configurado
- **Estilo**: Botón azul con efecto hover y animación

### 2. **Endpoint API**

```
POST /api/enterprise/send-to-telegram
Content-Type: application/json

Body:
{
  "productosSinStock": [
    {
      "id": "c-1",
      "nombre": "Camisa gucci",
      "talla": "S",
      "stock": 0,
      "cantidad": 0,
      "precio": 1000.00
    }
  ],
  "stockBajo": [
    {
      "id": "c-28",
      "nombre": "Camisa Negra",
      "talla": "L",
      "stock": 1,
      "cantidad": 1,
      "precio": 84183.00
    }
  ]
}
```

### 3. **Formato del Mensaje en Telegram**

El mensaje enviado incluye:

```
🔔 DETALLES DE ALERTAS Y TAREAS

⚠️ Alertas de Inventario

🔴 Productos Sin Stock (1 producto)
1 producto sin inventario

┌────────────────────────────────────────────────────────────────┐
│ ID      Producto             Talla  Stock  Precio      Valor   │
├────────────────────────────────────────────────────────────────┤
│ c-1     Camisa gucci         S          0  $1000.00    $0.00   │
└────────────────────────────────────────────────────────────────┘

⚠️ Stock Bajo (2 productos)
2 productos con menos de 5 unidades

┌────────────────────────────────────────────────────────────────┐
│ ID      Producto             Talla  Stock  Precio      Valor   │
├────────────────────────────────────────────────────────────────┤
│ c-28    Camisa Negra         L          1  $84183.00  $84183  │
│ c-45    Pantalón Azul        M          3  $45000.00  $135000 │
└────────────────────────────────────────────────────────────────┘

📅 lunes, 6 de octubre de 2025, 3:15 p. m.
```

## 🚀 Cómo Usar

### Paso 1: Acceder al Dashboard

1. Asegúrate de que el servidor esté corriendo:
   ```bash
   cd c:\programming\Proyecto_Automatizacion
   node src/app.js
   ```

2. Abre en el navegador:
   ```
   http://localhost:3001/dashboard-empresarial.html
   ```

### Paso 2: Abrir Modal de Detalles

1. En la sección "Alertas y Tareas Automáticas"
2. Haz clic en el botón "Ver Detalles Completos"
3. Se abrirá el modal con todos los detalles de las alertas

### Paso 3: Enviar a Telegram

1. En la esquina superior derecha del modal
2. Haz clic en el botón azul "📱 Enviar a Telegram"
3. Espera la confirmación (modal de éxito)
4. Revisa tu Telegram para ver el mensaje

## 📊 Datos Enviados

El sistema envía automáticamente:

### Productos Sin Stock (🔴)
- ID del producto
- Nombre completo
- Talla
- Stock actual (0)
- Precio unitario
- Valor total (siempre $0.00)

### Stock Bajo (⚠️)
- ID del producto
- Nombre completo
- Talla
- Stock actual (< 5 unidades)
- Precio unitario
- Valor total (precio × cantidad)

## 🎨 Componentes Implementados

### 1. **TelegramService** (`src/services/telegramService.js`)
```javascript
class TelegramService {
  async sendAlertDetails(alertDetails) {
    // Envía mensaje formateado a Telegram
    // Incluye tablas con detalles de productos
    // Formato Markdown para mejor visualización
  }
  
  async testConnection() {
    // Prueba la conexión con el bot
  }
}
```

### 2. **Ruta API** (`src/routes/enterpriseRoutes.js`)
```javascript
router.post('/send-to-telegram', async (req, res) => {
  // Recibe datos de alertas
  // Inicializa servicio de Telegram
  // Envía mensaje
  // Retorna resultado
});
```

### 3. **Frontend** (`public/dashboard-empresarial.html`)
```javascript
// Variables globales
let currentAlertsData = {
  productosSinStock: [],
  stockBajo: []
};

// Función para enviar a Telegram
async function sendAlertsToTelegram() {
  // Valida que haya alertas
  // Llama al endpoint API
  // Muestra resultado al usuario
}
```

## 🎯 Flujo de Funcionamiento

```
1. Usuario abre Dashboard Empresarial
   ↓
2. Sistema carga alertas automáticamente
   ↓
3. Usuario hace clic en "Ver Detalles Completos"
   ↓
4. Modal se abre con tabla detallada
   ↓
5. Sistema guarda datos en currentAlertsData
   ↓
6. Usuario hace clic en "Enviar a Telegram"
   ↓
7. Frontend envía POST a /api/enterprise/send-to-telegram
   ↓
8. Backend formatea mensaje con tablas
   ↓
9. TelegramService envía mensaje vía Bot API
   ↓
10. Usuario recibe mensaje en Telegram
   ↓
11. Frontend muestra confirmación de éxito
```

## 🔒 Seguridad

- ✅ Token del bot almacenado en variables de entorno
- ✅ Chat ID específico del administrador
- ✅ No se exponen credenciales en el frontend
- ✅ Validación de datos antes de enviar
- ✅ Manejo de errores con mensajes claros

## 🐛 Solución de Problemas

### Error: "No hay alertas para enviar"
- **Causa**: No hay productos sin stock ni con stock bajo
- **Solución**: Verifica que existan productos con estas condiciones en la base de datos

### Error: "Error enviando alertas a Telegram"
- **Causa**: Problema de conexión o configuración incorrecta
- **Solución**: 
  1. Verifica que el token del bot sea correcto en `.env`
  2. Confirma que el chat ID sea válido
  3. Asegúrate de haber iniciado conversación con el bot

### Modal sin datos
- **Causa**: `globalAlertsData` no se está cargando
- **Solución**: Refresca la página y espera que carguen las alertas

## 📱 Información del Bot

- **Nombre**: Cyntex (o el que hayas configurado)
- **Usuario**: @Dmuxes12_bot (o el tuyo)
- **Token**: 7902486945:AAF0ENScnFyxiBbAYt9D_p1lx67u68B7n34
- **Chat ID**: 1558851125

## ✨ Características Adicionales

1. **Formato de Tablas**: Los datos se muestran en tablas bien formateadas con columnas alineadas
2. **Markdown**: Uso de negrita y formato especial para mejor legibilidad
3. **Fecha/Hora**: Se incluye timestamp en formato colombiano
4. **Responsive**: El botón de Telegram se adapta a diferentes tamaños de pantalla
5. **Confirmación Visual**: Modal de éxito con contador de alertas enviadas

## 📞 Testing

Para probar la integración:

```bash
# 1. Inicia el servidor
node src/app.js

# 2. Abre el navegador en
http://localhost:3001/dashboard-empresarial.html

# 3. Verifica que aparezcan alertas
# 4. Abre el modal de detalles
# 5. Haz clic en "Enviar a Telegram"
# 6. Revisa tu chat de Telegram
```

---

**Desarrollado para**: Proyecto de Automatización Empresarial  
**Fecha**: Octubre 2025  
**Versión**: 1.0.0  
**Bot**: Telegram Bot API v6.0
