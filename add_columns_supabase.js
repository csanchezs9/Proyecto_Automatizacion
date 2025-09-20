const { Pool } = require('pg');

// Configuración de Supabase
// IMPORTANTE: Reemplaza estos valores con los de tu proyecto Supabase
const SUPABASE_CONFIG = {
  user: 'postgres',
  host: 'db.yessetrkzfz.supabase.co', // Reemplaza con tu URL de Supabase
  database: 'postgres',
  password: 'tu_password_aqui', // Reemplaza con tu contraseña de Supabase
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

async function addColumnsToSupabase() {
  const pool = new Pool(SUPABASE_CONFIG);
  
  try {
    console.log('🔗 Conectando a Supabase...');
    const client = await pool.connect();
    
    console.log('✅ Conexión a Supabase establecida');
    
    // Verificar si las columnas ya existen
    const checkColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
      AND column_name IN ('talla', 'cantidad')
    `);
    
    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('📋 Columnas existentes:', existingColumns);
    
    // Añadir columna talla si no existe
    if (!existingColumns.includes('talla')) {
      await client.query(`
        ALTER TABLE productos 
        ADD COLUMN talla VARCHAR(10) DEFAULT 'Única'
      `);
      console.log('✅ Columna "talla" añadida a Supabase');
    } else {
      console.log('ℹ️ Columna "talla" ya existe en Supabase');
    }
    
    // Añadir columna cantidad si no existe
    if (!existingColumns.includes('cantidad')) {
      await client.query(`
        ALTER TABLE productos 
        ADD COLUMN cantidad INTEGER DEFAULT 10 CHECK (cantidad >= 0)
      `);
      console.log('✅ Columna "cantidad" añadida a Supabase');
    } else {
      console.log('ℹ️ Columna "cantidad" ya existe en Supabase');
    }
    
    // Actualizar productos existentes con valores aleatorios
    const productCount = await client.query('SELECT COUNT(*) as total FROM productos');
    
    if (productCount.rows[0].total > 0) {
      console.log(`📦 Actualizando ${productCount.rows[0].total} productos existentes...`);
      
      // Arrays de tallas disponibles
      const tallasRopa = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      
      // Obtener todos los productos
      const productos = await client.query('SELECT id, nombre FROM productos ORDER BY id');
      
      for (const producto of productos.rows) {
        // Generar valores aleatorios
        const talla = tallasRopa[Math.floor(Math.random() * tallasRopa.length)];
        const cantidad = Math.floor(Math.random() * 50) + 1;
        
        await client.query(
          'UPDATE productos SET talla = $1, cantidad = $2 WHERE id = $3',
          [talla, cantidad, producto.id]
        );
      }
      
      console.log('✅ Productos actualizados con valores aleatorios');
    }
    
    // Crear índices para optimización
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_productos_talla ON productos(talla)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_productos_cantidad ON productos(cantidad)');
      console.log('✅ Índices creados en Supabase');
    } catch (err) {
      console.log('ℹ️ Índices ya existentes');
    }
    
    // Verificar estructura final
    const finalStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 ESTRUCTURA FINAL EN SUPABASE:');
    finalStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Mostrar estadísticas
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_productos,
        COUNT(CASE WHEN talla IS NOT NULL THEN 1 END) as con_talla,
        COUNT(CASE WHEN cantidad IS NOT NULL THEN 1 END) as con_cantidad,
        SUM(cantidad) as stock_total,
        AVG(cantidad) as stock_promedio
      FROM productos
    `);
    
    const estadisticas = stats.rows[0];
    console.log('\n📈 ESTADÍSTICAS EN SUPABASE:');
    console.log(`  Total productos: ${estadisticas.total_productos}`);
    console.log(`  Productos con talla: ${estadisticas.con_talla}`);
    console.log(`  Productos con cantidad: ${estadisticas.con_cantidad}`);
    console.log(`  Stock total: ${estadisticas.stock_total || 0}`);
    console.log(`  Stock promedio: ${Math.round(estadisticas.stock_promedio || 0)}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    console.log('\n🔧 INSTRUCCIONES:');
    console.log('1. Verifica que la URL de host esté correcta');
    console.log('2. Asegúrate de que la contraseña sea la correcta');
    console.log('3. Confirma que el SSL esté habilitado en Supabase');
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar solo si se proporciona configuración válida
if (SUPABASE_CONFIG.host.includes('supabase.co') && SUPABASE_CONFIG.password !== 'tu_password_aqui') {
  addColumnsToSupabase()
    .then(() => {
      console.log('\n🎉 Columnas añadidas exitosamente a Supabase!');
      console.log('📝 Refresca tu tabla en Supabase para ver los cambios');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
} else {
  console.log('⚠️ CONFIGURACIÓN REQUERIDA:');
  console.log('1. Abre este archivo: add_columns_supabase.js');
  console.log('2. Reemplaza "db.yessetrkzfz.supabase.co" con tu URL de Supabase');
  console.log('3. Reemplaza "tu_password_aqui" con tu contraseña de Supabase');
  console.log('4. Ejecuta nuevamente: node add_columns_supabase.js');
  process.exit(1);
}