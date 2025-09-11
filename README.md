# Proyecto de Automatización - Catálogo de Productos

Este proyecto es una API REST desarrollada con Node.js y Express que permite consultar una base de datos PostgreSQL y generar PDFs con catálogos de productos.

## 🚀 Características

- ✅ Consulta de productos desde PostgreSQL
- ✅ Generación de PDFs con catálogos
- ✅ API REST completa
- ✅ Filtrado por productos disponibles
- ✅ Estadísticas de productos
- ✅ Documentación de endpoints

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd Proyecto-automatizacion
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   - Copia el archivo `.env` y ajusta los valores según tu configuración de PostgreSQL:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=tu_base_de_datos
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password
   ```

4. **Crear la tabla de productos en PostgreSQL**
   ```sql
   CREATE TABLE productos (
     id SERIAL PRIMARY KEY,
     nombre VARCHAR(255) NOT NULL,
     descripcion TEXT,
     precio DECIMAL(10,2),
     imagen VARCHAR(500),
     disponible BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Datos de ejemplo
   INSERT INTO productos (nombre, descripcion, precio, imagen, disponible) VALUES
   ('Laptop Gaming', 'Laptop para gaming de alta gama con RTX 4070', 1299.99, 'laptop-gaming.jpg', true),
   ('Mouse Inalámbrico', 'Mouse ergonómico con 6 botones programables', 49.99, 'mouse-wireless.jpg', true),
   ('Teclado Mecánico', 'Teclado mecánico RGB con switches Cherry MX', 89.99, 'teclado-mecanico.jpg', true),
   ('Monitor 4K', 'Monitor 27 pulgadas 4K UHD con HDR', 349.99, 'monitor-4k.jpg', true),
   ('Auriculares Gaming', 'Auriculares con sonido envolvente 7.1', 79.99, 'auriculares-gaming.jpg', true);
   ```

## 🏃‍♂️ Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`

## 📡 Endpoints de la API

### Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Obtener todos los productos disponibles |
| GET | `/api/products/:id` | Obtener producto específico por ID |
| GET | `/api/products/stats` | Obtener estadísticas de productos |
| GET | `/api/products/pdf` | Generar PDF con catálogo básico |
| GET | `/api/products/pdf/detailed` | Generar PDF con catálogo detallado |

### Utilidades
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Documentación de la API |
| GET | `/health` | Estado de salud del servidor |

## 📝 Ejemplos de Uso

### Obtener todos los productos
```bash
curl http://localhost:3000/api/products
```

### Obtener un producto específico
```bash
curl http://localhost:3000/api/products/1
```

### Descargar PDF del catálogo
```bash
curl http://localhost:3000/api/products/pdf --output catalogo.pdf
```

### Obtener estadísticas
```bash
curl http://localhost:3000/api/products/stats
```

## 📊 Respuestas de la API

### Respuesta exitosa de productos
```json
{
  "success": true,
  "message": "Productos obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "Laptop Gaming",
      "descripcion": "Laptop para gaming de alta gama",
      "precio": "1299.99",
      "imagen": "laptop-gaming.jpg"
    }
  ],
  "count": 1
}
```

### Respuesta de error
```json
{
  "success": false,
  "message": "Error interno del servidor",
  "error": "Descripción del error"
}
```

## 🗂️ Estructura del Proyecto

```
Proyecto-automatizacion/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración de PostgreSQL
│   ├── controllers/
│   │   └── productController.js # Lógica de negocio
│   ├── routes/
│   │   └── productRoutes.js     # Definición de rutas
│   ├── services/
│   │   └── pdfService.js        # Servicio de generación de PDFs
│   └── app.js                   # Aplicación principal
├── public/                      # Archivos estáticos
├── uploads/                     # PDFs temporales
├── .env                         # Variables de entorno
├── package.json                 # Dependencias y scripts
└── README.md                    # Este archivo
```

## 🔧 Scripts Disponibles

- `npm start` - Ejecutar en producción
- `npm run dev` - Ejecutar en desarrollo con nodemon
- `npm test` - Ejecutar tests (por implementar)

## 🛡️ Seguridad

- Helmet.js para headers de seguridad
- CORS configurado
- Validación de parámetros
- Límites de tamaño de request

## 📦 Dependencias Principales

- **express**: Framework web
- **pg**: Cliente PostgreSQL
- **pdfkit**: Generación de PDFs
- **cors**: Cross-Origin Resource Sharing
- **helmet**: Headers de seguridad
- **dotenv**: Variables de entorno
- **morgan**: Logging de requests

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Solución de Problemas

### Error de conexión a PostgreSQL
- Verificar que PostgreSQL esté ejecutándose
- Comprobar las credenciales en el archivo `.env`
- Asegurar que la base de datos existe

### Error al generar PDFs
- Verificar permisos de escritura en la carpeta `uploads`
- Comprobar que hay suficiente espacio en disco

### Puerto en uso
- Cambiar el puerto en el archivo `.env`
- O detener el proceso que está usando el puerto 3000

## 📞 Soporte

Si tienes problemas o preguntas, puedes:
- Abrir un issue en el repositorio
- Revisar la documentación de las dependencias
- Verificar los logs del servidor para más detalles
