# Catálogo de Productos API
Una API REST robusta desarrollada con Node.js y Express para la gestión de productos con generación automática de catálogos en PDF.
Características
-API completa para consulta de productos desde PostgreSQL con supabase
-Generación automática de catálogos en formato PDF
-Filtrado avanzado de productos y estadísticas
-Endpoints RESTful con documentación integrada
-Configuración de seguridad con Helmet y CORS
-Manejo robusto de errores y validación de datos
# Instalación
Prerrequisitos
Node.js v14 o superior
PostgreSQL v12 o superior
npm o yarn
# Configuración
Clonar el repositorio y navegar al directorio:
bashgit clone <url-del-repositorio>
cd Proyecto-automatizaciondd

# Instalar dependencias:

bashnpm install

Configurar variables de entorno creando un archivo .env:

envDB_HOST=localhost
DB_PORT=5432
DB_NAME=tu_base_de_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_password
PORT=3000
NODE_ENV=development

npm start - Ejecutar en producción
npm run dev - Ejecutar en desarrollo con nodemon
npm test - Ejecutar tests

# Seguridad
El proyecto implementa las siguientes medidas de seguridad:

Headers de seguridad con Helmet.js
Control CORS configurado
Validación de parámetros de entrada
Límites de tamaño de request
Manejo seguro de variables de entorno

# Dependencias Principales

express: Framework web para Node.js
pg: Cliente PostgreSQL
pdfkit: Generación de documentos PDF
cors: Middleware para Cross-Origin Resource Sharing
helmet: Headers de seguridad HTTP
dotenv: Gestión de variables de entorno
morgan: Logging de requests HTTP

# Licencia
Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.
Soporte
Si necesitas ayuda o tienes preguntas:
