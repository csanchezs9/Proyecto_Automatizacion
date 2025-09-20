const { Client } = require('pg');
require('dotenv').config();

// Configuración de Supabase usando variables de entorno seguras
const client = new Client({
  host: process.env.SUPABASE_HOST || 'aws-1-us-east-2.pooler.supabase.com',
  port: parseInt(process.env.SUPABASE_PORT) || 5432,
  database: process.env.SUPABASE_DB || 'postgres',
  user: process.env.SUPABASE_USER || 'postgres.xdhymmzmxbaxxmregzuh',
  password: process.env.SUPABASE_PASSWORD, // ⚠️ NUNCA hardcodear contraseñas
  ssl: {
    rejectUnauthorized: false
  }
});

// Verificar que las credenciales estén configuradas
if (!process.env.SUPABASE_PASSWORD) {
  console.error('❌ Error: SUPABASE_PASSWORD no está configurada en las variables de entorno');
  console.log('📝 Por favor configura las variables de entorno antes de ejecutar este script:');
  console.log('   - SUPABASE_HOST');
  console.log('   - SUPABASE_PORT');
  console.log('   - SUPABASE_DB');
  console.log('   - SUPABASE_USER');
  console.log('   - SUPABASE_PASSWORD');
  process.exit(1);
}

async function addColumnsToProductos() {
  try {
    console.log('🔌 Conectando a Supabase...');
    await client.connect();
    console.log('✅ Conectado exitosamente a Supabase');

    // 1. Verificar estructura actual
    console.log('\n📋 Verificando estructura actual de la tabla productos...');
    const currentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Columnas actuales:', currentColumns.rows.map(r => r.column_name).join(', '));

    // 2. Añadir columnas talla y cantidad
    console.log('\n🔧 Añadiendo columnas talla y cantidad...');
    
    await client.query(`
      ALTER TABLE productos ADD COLUMN IF NOT EXISTS talla VARCHAR(10) DEFAULT 'Única';
    `);
    console.log('  ✅ Columna "talla" añadida');
    
    await client.query(`
      ALTER TABLE productos ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 10 CHECK (cantidad >= 0);
    `);
    console.log('  ✅ Columna "cantidad" añadida');

    // 3. Verificar que se añadieron
    console.log('\n🔍 Verificando nuevas columnas...');
    const newColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
        AND table_schema = 'public'
        AND column_name IN ('talla', 'cantidad');
    `);
    
    console.log('Nuevas columnas añadidas:', newColumns.rows.length);
    newColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });

    // 4. Contar productos existentes
    const countResult = await client.query('SELECT COUNT(*) as total FROM productos');
    const totalProducts = countResult.rows[0].total;
    console.log(`\n📦 Total productos en la tabla: ${totalProducts}`);

    if (totalProducts > 0) {
      // 5. Asignar valores aleatorios a productos existentes
      console.log('\n🎲 Asignando valores aleatorios a productos...');
      
      await client.query(`
        UPDATE productos 
        SET talla = (ARRAY['XS','S','M','L','XL','XXL'])[floor(random()*6)+1],
            cantidad = (RANDOM() * 49 + 1)::INTEGER
        WHERE talla IS NULL OR talla = 'Única';
      `);
      
      console.log('  ✅ Valores aleatorios asignados');

      // 6. Crear índices para optimización
      console.log('\n📊 Creando índices...');
      
      await client.query('CREATE INDEX IF NOT EXISTS idx_productos_talla ON productos(talla);');
      await client.query('CREATE INDEX IF NOT EXISTS idx_productos_cantidad ON productos(cantidad);');
      
      console.log('  ✅ Índices creados');

      // 7. Mostrar algunos ejemplos
      console.log('\n🔍 Ejemplos de productos actualizados:');
      const examples = await client.query(`
        SELECT id, nombre, talla, cantidad,
               CASE 
                   WHEN cantidad = 0 THEN '🔴 Sin stock'
                   WHEN cantidad < 5 THEN '🟡 Stock bajo'
                   ELSE '🟢 Stock normal'
               END as estado_stock
        FROM productos 
        ORDER BY id
        LIMIT 8;
      `);

      examples.rows.forEach(product => {
        console.log(`  ${product.estado_stock} ${product.id}: ${product.nombre} (Talla: ${product.talla}, Stock: ${product.cantidad})`);
      });

      // 8. Estadísticas finales
      console.log('\n📈 ESTADÍSTICAS FINALES:');
      
      const stats = await client.query(`
        SELECT 
          COUNT(*) as total_productos,
          COALESCE(SUM(cantidad), 0) as stock_total,
          ROUND(AVG(cantidad), 2) as stock_promedio,
          COUNT(CASE WHEN cantidad < 5 THEN 1 END) as stock_bajo,
          COUNT(CASE WHEN cantidad = 0 THEN 1 END) as sin_stock,
          COUNT(DISTINCT talla) as tallas_diferentes
        FROM productos;
      `);

      const estadisticas = stats.rows[0];
      console.log(`  📦 Total productos: ${estadisticas.total_productos}`);
      console.log(`  📊 Stock total: ${estadisticas.stock_total} unidades`);
      console.log(`  📊 Stock promedio: ${estadisticas.stock_promedio} unidades`);
      console.log(`  ⚠️ Stock bajo (<5): ${estadisticas.stock_bajo} productos`);
      console.log(`  🔴 Sin stock: ${estadisticas.sin_stock} productos`);
      console.log(`  👕 Tallas diferentes: ${estadisticas.tallas_diferentes}`);

      // 9. Distribución de tallas
      console.log('\n👕 DISTRIBUCIÓN DE TALLAS:');
      const tallaStats = await client.query(`
        SELECT talla, COUNT(*) as productos, SUM(cantidad) as stock_total
        FROM productos 
        GROUP BY talla 
        ORDER BY productos DESC;
      `);

      tallaStats.rows.forEach(row => {
        console.log(`  Talla ${row.talla}: ${row.productos} productos, ${row.stock_total} unidades`);
      });
    }

    console.log('\n🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!');
    console.log('📝 Ve a Supabase Table Editor > productos para ver las nuevas columnas');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar el script
addColumnsToProductos()
  .then(() => {
    console.log('\n✅ Script ejecutado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error ejecutando script:', error);
    process.exit(1);
  });