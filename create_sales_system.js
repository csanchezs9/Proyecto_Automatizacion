const { pool } = require('./src/config/database');

async function createSalesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Creando tabla de ventas...');
    
    // Crear tabla de ventas
    await client.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        producto_id VARCHAR(20) NOT NULL,
        cantidad_vendida INTEGER NOT NULL CHECK (cantidad_vendida > 0),
        precio_unitario DECIMAL(10,2) NOT NULL,
        precio_total DECIMAL(10,2) NOT NULL,
        fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cliente VARCHAR(255),
        notas TEXT,
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      )
    `);
    
    console.log('✅ Tabla de ventas creada exitosamente');
    
    // Crear índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ventas_producto_id ON ventas(producto_id)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta)
    `);
    
    console.log('✅ Índices para ventas creados');
    
    // Crear función para actualizar stock automáticamente
    await client.query(`
      CREATE OR REPLACE FUNCTION actualizar_stock_venta()
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE productos 
        SET cantidad = cantidad - NEW.cantidad_vendida
        WHERE id = NEW.producto_id;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Producto no encontrado: %', NEW.producto_id;
        END IF;
        
        -- Verificar que no quede stock negativo
        IF (SELECT cantidad FROM productos WHERE id = NEW.producto_id) < 0 THEN
          RAISE EXCEPTION 'Stock insuficiente para el producto: %', NEW.producto_id;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Función de actualización de stock creada');
    
    // Crear trigger
    await client.query(`
      DROP TRIGGER IF EXISTS trigger_actualizar_stock ON ventas;
      CREATE TRIGGER trigger_actualizar_stock
        AFTER INSERT ON ventas
        FOR EACH ROW
        EXECUTE FUNCTION actualizar_stock_venta();
    `);
    
    console.log('✅ Trigger de actualización automática creado');
    
    // Verificar la estructura de la tabla
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ventas' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estructura de la tabla ventas:');
    tableStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    console.log('🎉 Sistema de ventas configurado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error creando tabla de ventas:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la creación
createSalesTable()
  .then(() => {
    console.log('✅ Script de ventas finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error ejecutando script de ventas:', error);
    process.exit(1);
  });