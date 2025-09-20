-- Script para añadir columnas de talla y cantidad (stock) a la tabla productos
-- Fecha: 20 de septiembre de 2025
-- Propósito: Permitir el registro de ventas y control de inventario

-- IMPORTANTE: Hacer backup de la base de datos antes de ejecutar

-- Verificar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'productos' 
ORDER BY ordinal_position;

-- Paso 1: Añadir la columna talla
-- Usamos VARCHAR para permitir tallas como 'S', 'M', 'L', 'XL', '36', '38', etc.
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS talla VARCHAR(10);

-- Paso 2: Añadir la columna cantidad (stock)
-- Usamos INTEGER con valor por defecto 0 y restricción para evitar valores negativos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS cantidad INTEGER DEFAULT 0 CHECK (cantidad >= 0);

-- Paso 3: Añadir comentarios a las columnas para documentación
COMMENT ON COLUMN productos.talla IS 'Talla del producto (S, M, L, XL, 36, 38, etc.)';
COMMENT ON COLUMN productos.cantidad IS 'Cantidad disponible en stock';

-- Paso 4: Actualizar productos existentes con valores por defecto
-- Establecer talla por defecto como 'Única' para productos sin talla específica
UPDATE productos 
SET talla = 'Única' 
WHERE talla IS NULL;

-- Establecer cantidad por defecto como 10 para productos existentes
UPDATE productos 
SET cantidad = 10 
WHERE cantidad IS NULL OR cantidad = 0;

-- Paso 5: Crear índices para mejorar el rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_productos_talla ON productos(talla);
CREATE INDEX IF NOT EXISTS idx_productos_cantidad ON productos(cantidad);
CREATE INDEX IF NOT EXISTS idx_productos_stock_bajo ON productos(cantidad) WHERE cantidad < 5;

-- Paso 6: Verificar los cambios realizados
SELECT 
    id,
    nombre,
    talla,
    cantidad,
    precio,
    creado_en
FROM productos 
ORDER BY id 
LIMIT 10;

-- Mostrar estadísticas del stock
SELECT 
    'Total productos' as descripcion,
    COUNT(*) as cantidad
FROM productos
UNION ALL
SELECT 
    'Productos con stock bajo (< 5)' as descripcion,
    COUNT(*) as cantidad
FROM productos 
WHERE cantidad < 5
UNION ALL
SELECT 
    'Productos sin stock' as descripcion,
    COUNT(*) as cantidad
FROM productos 
WHERE cantidad = 0;

PRINT '✅ Migración completada: Se han añadido las columnas talla y cantidad a la tabla productos';