const { pool } = require('./src/config/database');

async function addStockColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando migración de columnas talla y cantidad...');
    
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
      console.log('✅ Columna "talla" añadida exitosamente');
    } else {
      console.log('ℹ️ Columna "talla" ya existe');
    }
    
    // Añadir columna cantidad si no existe
    if (!existingColumns.includes('cantidad')) {
      await client.query(`
        ALTER TABLE productos 
        ADD COLUMN cantidad INTEGER DEFAULT 10 CHECK (cantidad >= 0)
      `);
      console.log('✅ Columna "cantidad" añadida exitosamente');
    } else {
      console.log('ℹ️ Columna "cantidad" ya existe');
    }
    
    // Actualizar productos existentes
    await client.query(`
      UPDATE productos 
      SET talla = 'Única' 
      WHERE talla IS NULL
    `);
    
    await client.query(`
      UPDATE productos 
      SET cantidad = 10 
      WHERE cantidad IS NULL OR cantidad = 0
    `);
    
    // Crear índices
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_productos_talla ON productos(talla)
      `);
      console.log('✅ Índice para talla creado');
    } catch (err) {
      console.log('ℹ️ Índice para talla ya existe');
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_productos_cantidad ON productos(cantidad)
      `);
      console.log('✅ Índice para cantidad creado');
    } catch (err) {
      console.log('ℹ️ Índice para cantidad ya existe');
    }
    
    // Mostrar estructura actualizada
    const finalStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'productos' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estructura final de la tabla productos:');
    finalStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Verificar productos existentes
    const productCount = await client.query('SELECT COUNT(*) as total FROM productos');
    console.log(`📦 Total de productos en la base de datos: ${productCount.rows[0].total}`);
    
    if (productCount.rows[0].total > 0) {
      const sampleProducts = await client.query(`
        SELECT id, nombre, talla, cantidad, precio 
        FROM productos 
        ORDER BY id 
        LIMIT 3
      `);
      
      console.log('🔍 Muestra de productos:');
      sampleProducts.rows.forEach(product => {
        console.log(`  ${product.id}: ${product.nombre} (Talla: ${product.talla}, Stock: ${product.cantidad}, Precio: $${product.precio})`);
      });
    }
    
    console.log('🎉 Migración completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la migración
addStockColumns()
  .then(() => {
    console.log('✅ Script de migración finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error ejecutando la migración:', error);
    process.exit(1);
  });