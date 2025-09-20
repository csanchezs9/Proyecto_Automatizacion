const { pool } = require('./src/config/database');

async function assignRandomValues() {
  const client = await pool.connect();
  
  try {
    console.log('🎲 Asignando valores aleatorios de talla y cantidad...');
    
    // Obtener todos los productos
    const result = await client.query('SELECT id, nombre FROM productos ORDER BY id');
    const productos = result.rows;
    
    console.log(`📦 Total productos a actualizar: ${productos.length}`);
    
    // Arrays de tallas disponibles
    const tallasRopa = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const tallasCalzado = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
    const tallasGenerales = ['Única'];
    
    // Función para generar cantidad aleatoria (1-50)
    const generarCantidad = () => Math.floor(Math.random() * 50) + 1;
    
    // Función para seleccionar talla aleatoria
    const seleccionarTalla = (nombreProducto) => {
      const nombre = nombreProducto.toLowerCase();
      
      if (nombre.includes('zapato') || nombre.includes('calzado') || nombre.includes('sandalia') || 
          nombre.includes('bota') || nombre.includes('tenis') || nombre.includes('zapatilla')) {
        // Para calzado, usar tallas numéricas
        return tallasCalzado[Math.floor(Math.random() * tallasCalzado.length)];
      } else if (nombre.includes('camisa') || nombre.includes('camiseta') || nombre.includes('blusa') || 
                 nombre.includes('vestido') || nombre.includes('pantalón') || nombre.includes('jean') ||
                 nombre.includes('sudadera') || nombre.includes('chaqueta')) {
        // Para ropa, usar tallas de letras
        return tallasRopa[Math.floor(Math.random() * tallasRopa.length)];
      } else {
        // Para otros productos, mix de tallas o única
        const todasLasTallas = [...tallasRopa, ...tallasGenerales];
        return todasLasTallas[Math.floor(Math.random() * todasLasTallas.length)];
      }
    };
    
    let actualizados = 0;
    
    // Actualizar cada producto
    for (const producto of productos) {
      const nuevaTalla = seleccionarTalla(producto.nombre);
      const nuevaCantidad = generarCantidad();
      
      await client.query(
        'UPDATE productos SET talla = $1, cantidad = $2 WHERE id = $3',
        [nuevaTalla, nuevaCantidad, producto.id]
      );
      
      actualizados++;
      console.log(`✅ ${producto.id}: ${producto.nombre} → Talla: ${nuevaTalla}, Stock: ${nuevaCantidad}`);
    }
    
    console.log(`\n🎉 ${actualizados} productos actualizados exitosamente!`);
    
    // Mostrar estadísticas finales
    const estadisticas = await client.query(`
      SELECT 
        COUNT(*) as total_productos,
        SUM(cantidad) as total_stock,
        AVG(cantidad) as promedio_stock,
        MIN(cantidad) as min_stock,
        MAX(cantidad) as max_stock,
        COUNT(CASE WHEN cantidad < 5 THEN 1 END) as stock_bajo,
        COUNT(CASE WHEN cantidad = 0 THEN 1 END) as sin_stock
      FROM productos
    `);
    
    const stats = estadisticas.rows[0];
    console.log('\n📊 ESTADÍSTICAS FINALES:');
    console.log(`   Total productos: ${stats.total_productos}`);
    console.log(`   Stock total: ${stats.total_stock} unidades`);
    console.log(`   Stock promedio: ${Math.round(stats.promedio_stock)} unidades`);
    console.log(`   Stock mínimo: ${stats.min_stock} unidades`);
    console.log(`   Stock máximo: ${stats.max_stock} unidades`);
    console.log(`   Productos con stock bajo (<5): ${stats.stock_bajo}`);
    console.log(`   Productos sin stock: ${stats.sin_stock}`);
    
    // Mostrar distribución de tallas
    const distribucionTallas = await client.query(`
      SELECT talla, COUNT(*) as cantidad
      FROM productos
      GROUP BY talla
      ORDER BY cantidad DESC
    `);
    
    console.log('\n👕 DISTRIBUCIÓN DE TALLAS:');
    distribucionTallas.rows.forEach(row => {
      console.log(`   Talla ${row.talla}: ${row.cantidad} productos`);
    });
    
    // Mostrar algunos ejemplos
    const ejemplos = await client.query(`
      SELECT id, nombre, talla, cantidad
      FROM productos
      ORDER BY RANDOM()
      LIMIT 8
    `);
    
    console.log('\n🔍 EJEMPLOS ALEATORIOS:');
    ejemplos.rows.forEach(row => {
      const emoji = row.cantidad < 5 ? '⚠️' : row.cantidad > 30 ? '📦' : '✅';
      console.log(`   ${emoji} ${row.id}: ${row.nombre} (Talla: ${row.talla}, Stock: ${row.cantidad})`);
    });
    
  } catch (error) {
    console.error('❌ Error asignando valores aleatorios:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar la asignación
assignRandomValues()
  .then(() => {
    console.log('\n✅ Script de asignación aleatoria completado');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error ejecutando script:', error);
    process.exit(1);
  });