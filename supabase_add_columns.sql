-- Script SQL para ejecutar DIRECTAMENTE en Supabase SQL Editor
-- Copia y pega este código en: Supabase Dashboard > SQL Editor > New query

-- 1. Añadir columna TALLA (si no existe)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'talla'
    ) THEN
        ALTER TABLE productos ADD COLUMN talla VARCHAR(10) DEFAULT 'Única';
        RAISE NOTICE 'Columna TALLA añadida exitosamente';
    ELSE
        RAISE NOTICE 'Columna TALLA ya existe';
    END IF;
END $$;

-- 2. Añadir columna CANTIDAD (si no existe)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'productos' AND column_name = 'cantidad'
    ) THEN
        ALTER TABLE productos ADD COLUMN cantidad INTEGER DEFAULT 10 CHECK (cantidad >= 0);
        RAISE NOTICE 'Columna CANTIDAD añadida exitosamente';
    ELSE
        RAISE NOTICE 'Columna CANTIDAD ya existe';
    END IF;
END $$;

-- 3. Actualizar productos existentes con valores aleatorios de talla
UPDATE productos 
SET talla = (
    SELECT tallas.talla 
    FROM (
        VALUES 
        ('XS'), ('S'), ('M'), ('L'), ('XL'), ('XXL')
    ) AS tallas(talla)
    ORDER BY random()
    LIMIT 1
)
WHERE talla IS NULL OR talla = 'Única';

-- 4. Actualizar productos existentes con cantidades aleatorias (1-50)
UPDATE productos 
SET cantidad = (RANDOM() * 49 + 1)::INTEGER
WHERE cantidad IS NULL OR cantidad = 10;

-- 5. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_talla ON productos(talla);
CREATE INDEX IF NOT EXISTS idx_productos_cantidad ON productos(cantidad);
CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo ON productos(cantidad) WHERE cantidad < 5;

-- 6. Verificar resultados
SELECT 
    'Estructura de tabla' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- 7. Mostrar estadísticas finales
SELECT 
    'Estadísticas' as info,
    COUNT(*) as total_productos,
    COUNT(CASE WHEN talla IS NOT NULL THEN 1 END) as productos_con_talla,
    COUNT(CASE WHEN cantidad IS NOT NULL THEN 1 END) as productos_con_cantidad,
    COALESCE(SUM(cantidad), 0) as stock_total,
    ROUND(AVG(cantidad), 2) as stock_promedio,
    COUNT(CASE WHEN cantidad < 5 THEN 1 END) as stock_bajo,
    COUNT(CASE WHEN cantidad = 0 THEN 1 END) as sin_stock
FROM productos;

-- 8. Mostrar distribución de tallas
SELECT 
    'Distribución de Tallas' as info,
    talla,
    COUNT(*) as cantidad_productos
FROM productos 
WHERE talla IS NOT NULL
GROUP BY talla 
ORDER BY cantidad_productos DESC;

-- 9. Mostrar algunos productos de ejemplo
SELECT 
    'Ejemplos' as info,
    id,
    nombre,
    talla,
    cantidad,
    CASE 
        WHEN cantidad = 0 THEN 'SIN STOCK'
        WHEN cantidad < 5 THEN 'STOCK BAJO'
        WHEN cantidad > 30 THEN 'STOCK ALTO'
        ELSE 'STOCK NORMAL'
    END as estado_stock
FROM productos 
ORDER BY random()
LIMIT 10;

-- ✅ Script completado
-- Las columnas talla y cantidad ahora deberían ser visibles en tu tabla de Supabase