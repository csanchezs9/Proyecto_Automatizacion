-- Script alternativo para PostgreSQL - Migración paso a paso
-- Ejecutar cada comando uno por uno y verificar los resultados

-- 1. Verificar estructura actual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'productos';

-- 2. Verificar datos actuales
SELECT COUNT(*) as total_productos FROM productos;

-- 3. Crear columna temporal para el nuevo ID
ALTER TABLE productos ADD COLUMN new_id VARCHAR(20);

-- 4. Llenar la columna temporal con IDs en formato c-X
UPDATE productos 
SET new_id = 'c-' || ROW_NUMBER() OVER (ORDER BY id)::text;

-- 5. Verificar que todos los new_id son únicos
SELECT new_id, COUNT(*) 
FROM productos 
GROUP BY new_id 
HAVING COUNT(*) > 1;

-- 6. Si no hay duplicados, proceder con el cambio
-- Eliminar la constraint PRIMARY KEY del id actual
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_pkey;

-- 7. Cambiar el tipo de la columna id original
ALTER TABLE productos ALTER COLUMN id TYPE VARCHAR(20);

-- 8. Copiar los nuevos IDs a la columna id
UPDATE productos SET id = new_id;

-- 9. Eliminar la columna temporal
ALTER TABLE productos DROP COLUMN new_id;

-- 10. Recrear la PRIMARY KEY
ALTER TABLE productos ADD PRIMARY KEY (id);

-- 11. Verificar el resultado final
SELECT * FROM productos ORDER BY 
    CASE 
        WHEN id ~ '^c-[0-9]+$' THEN CAST(SUBSTRING(id FROM 3) AS INTEGER)
        ELSE 999999
    END;

-- Script para verificar que todo funciona correctamente
SELECT 
    id,
    nombre,
    precio,
    creado_en
FROM productos 
WHERE id LIKE 'c-%'
ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER);