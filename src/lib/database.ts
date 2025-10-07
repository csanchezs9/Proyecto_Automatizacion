import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mi_base_datos',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_HOST?.includes('supabase.com') 
    ? { rejectUnauthorized: false } 
    : false,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 60000,
  query_timeout: 30000,
  max: 10,
  min: 2,
});

// Manejar errores de conexión del pool
pool.on('error', (err: Error) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
  console.log('🔄 Intentando reconectar...');
});

// Función para probar la conexión con reintentos
export const testConnection = async (retries = 3, delay = 5000): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Intento de conexión ${attempt}/${retries} a PostgreSQL...`);
      
      const client: PoolClient = await pool.connect();
      const result = await client.query('SELECT NOW()');
      
      console.log('✅ Conexión a PostgreSQL exitosa');
      console.log(`📅 Hora del servidor: ${result.rows[0].now}`);
      
      client.release();
      return true;
    } catch (err) {
      console.error(`❌ Error en intento ${attempt}/${retries}:`, (err as Error).message);
      
      if (attempt === retries) {
        console.error('💥 Todos los intentos de conexión han fallado');
        throw err;
      }
      
      console.log(`⏳ Esperando ${delay/1000} segundos antes del próximo intento...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
};

export default pool;
