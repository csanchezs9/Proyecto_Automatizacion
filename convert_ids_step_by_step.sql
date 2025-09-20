-- SCRIPT SEGURO PARA CONVERTIR IDs PROBLEMÁTICOS
-- Ejecutar cada sección una por vez y verificar resultados

-- =====================================================
-- SECCIÓN 1: DIAGNÓSTICO - Ejecutar primero para ver el estado actual
-- =====================================================

-- Ver todos los productos y sus formatos de ID
SELECT 
    id,
    nombre,
    creado_en,
    LENGTH(id) as longitud_id,
    CASE 
        WHEN id ~ '^c-[0-9]+$' THEN '✓ Correcto'
        WHEN LENGTH(id) > 10 THEN '✗ ID muy largo (UUID?)'
        WHEN id ~ '^[0-9]+$' THEN '? Solo números'
        ELSE '✗ Formato desconocido'
    END as diagnostico
FROM productos
ORDER BY creado_en;

-- Contar productos por tipo de formato
SELECT 
    CASE 
        WHEN id ~ '^c-[0-9]+$' THEN 'Formato c-X correcto'
        WHEN LENGTH(id) > 10 THEN 'UUID largo'
        WHEN id ~ '^[0-9]+$' THEN 'Solo números'
        ELSE 'Otro formato'
    END as tipo_formato,
    COUNT(*) as cantidad
FROM productos
GROUP BY 
    CASE 
        WHEN id ~ '^c-[0-9]+$' THEN 'Formato c-X correcto'
        WHEN LENGTH(id) > 10 THEN 'UUID largo'
        WHEN id ~ '^[0-9]+$' THEN 'Solo números'
        ELSE 'Otro formato'
    END;

-- =====================================================
-- SECCIÓN 2: PREPARACIÓN - Crear tabla de mapeo
-- =====================================================

-- Crear tabla temporal con el mapeo de conversión
DROP TABLE IF EXISTS temp_id_conversion;

CREATE TEMP TABLE temp_id_conversion AS
WITH productos_a_convertir AS (
    -- Seleccionar productos que NO tienen formato c-X
    SELECT 
        id as old_id,
        nombre,
        creado_en,
        ROW_NUMBER() OVER (ORDER BY creado_en, id) as orden
    FROM productos 
    WHERE NOT id ~ '^c-[0-9]+$'
),
ultimo_numero_c AS (
    -- Encontrar el último número usado en formato c-X
    SELECT 
        COALESCE(
            MAX(CAST(SUBSTRING(id FROM 3) AS INTEGER)), 
            0
        ) as max_c_number
    FROM productos 
    WHERE id ~ '^c-[0-9]+$'
)
SELECT 
    pac.old_id,
    'c-' || (unc.max_c_number + pac.orden) as new_id,
    pac.nombre,
    pac.creado_en
FROM productos_a_convertir pac
CROSS JOIN ultimo_numero_c unc;

-- Ver el mapeo propuesto
SELECT 
    old_id,
    new_id,
    nombre,
    'Convertir: ' || old_id || ' → ' || new_id as conversion
FROM temp_id_conversion
ORDER BY CAST(SUBSTRING(new_id FROM 3) AS INTEGER);

-- =====================================================
-- SECCIÓN 3: VERIFICACIÓN - Antes de convertir
-- =====================================================

-- Verificar que no habrá conflictos de ID
SELECT 
    new_id,
    COUNT(*) as veces_usado
FROM (
    -- IDs que ya existen en formato correcto
    SELECT id as new_id FROM productos WHERE id ~ '^c-[0-9]+$'
    UNION ALL
    -- IDs propuestos para conversión  
    SELECT new_id FROM temp_id_conversion
) combined
GROUP BY new_id
HAVING COUNT(*) > 1;

-- Si la query anterior no devuelve filas, es seguro continuar

-- =====================================================
-- SECCIÓN 4: CONVERSIÓN - Ejecutar solo si las verificaciones son OK
-- =====================================================

-- BACKUP: Crear tabla de respaldo antes de la conversión
CREATE TABLE productos_backup_before_id_conversion AS
SELECT * FROM productos;

-- Realizar la conversión de IDs
UPDATE productos 
SET id = tc.new_id
FROM temp_id_conversion tc
WHERE productos.id = tc.old_id;

-- Mostrar resultados de la conversión
SELECT 
    COUNT(*) as productos_convertidos
FROM temp_id_conversion;

-- =====================================================
-- SECCIÓN 5: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todos los productos ahora tienen formato correcto
SELECT 
    CASE 
        WHEN id ~ '^c-[0-9]+$' THEN 'Formato correcto'
        ELSE 'PROBLEMA: Formato incorrecto'
    END as estado,
    COUNT(*) as cantidad
FROM productos
GROUP BY 
    CASE 
        WHEN id ~ '^c-[0-9]+$' THEN 'Formato correcto'
        ELSE 'PROBLEMA: Formato incorrecto'
    END;

-- Ver todos los productos con sus nuevos IDs ordenados
SELECT 
    id,
    nombre,
    precio,
    creado_en
FROM productos
ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER);

-- =====================================================
-- SECCIÓN 6: LIMPIEZA (Opcional - ejecutar solo si todo está OK)
-- =====================================================

-- Si todo funciona correctamente, puedes eliminar el backup
-- DROP TABLE productos_backup_before_id_conversion;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS temp_id_conversion;