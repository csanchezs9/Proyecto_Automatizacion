const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mi_base_datos',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('supabase.com') ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 30000, // Aumentado a 30 segundos
  idleTimeoutMillis: 60000,       // Aumentado a 60 segundos
  query_timeout: 30000,           // Timeout para queries
  max: 10,                        // Máximo de conexiones en el pool
  min: 2,                         // Mínimo de conexiones mantenidas
  acquire: 30000,                 // Tiempo máximo para obtener conexión
  createTimeoutMillis: 30000,     // Timeout para crear conexión
  acquireTimeoutMillis: 30000,    // Timeout para adquirir conexión
  destroyTimeoutMillis: 5000,     // Timeout para destruir conexión
});

// Manejar errores de conexión del pool
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
  console.log('🔄 Intentando reconectar...');
});

// Función para probar la conexión con reintentos
const testConnection = async (retries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Intento de conexión ${attempt}/${retries} a PostgreSQL...`);
      
      const client = await pool.connect();
      
      // Hacer una query simple para verificar que la conexión funciona
      const result = await client.query('SELECT NOW()');
      
      console.log('✅ Conexión a PostgreSQL exitosa');
      console.log(`📅 Hora del servidor: ${result.rows[0].now}`);
      
      client.release();
      return true;
    } catch (err) {
      console.error(`❌ Error en intento ${attempt}/${retries}:`, err.message);
      
      if (attempt === retries) {
        console.error('💥 Todos los intentos de conexión han fallado');
        throw err;
      }
      
      console.log(`⏱️ Esperando ${delay/1000} segundos antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = { pool, testConnection };
