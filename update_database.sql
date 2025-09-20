-- Script para actualizar la tabla productos para usar IDs personalizados
-- IMPORTANTE: Hacer backup de la base de datos antes de ejecutar estos comandos

-- Paso 1: Crear una tabla temporal con la nueva estructura
CREATE TABLE productos_new (
    id VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    imagen_url TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Paso 2: Migrar los datos existentes con nuevos IDs en formato c-X
INSERT INTO productos_new (id, nombre, descripcion, precio, imagen_url, creado_en)
SELECT 
    'c-' || ROW_NUMBER() OVER (ORDER BY id) as new_id,
    nombre,
    descripcion,
    precio,
    imagen_url,
    creado_en
FROM productos
ORDER BY id;

-- Paso 3: Hacer backup de la tabla original (renombrarla)
ALTER TABLE productos RENAME TO productos_backup;

-- Paso 4: Renombrar la nueva tabla
ALTER TABLE productos_new RENAME TO productos;

-- Paso 5: Crear índices para optimizar consultas (opcional)
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_precio ON productos(precio);
CREATE INDEX idx_productos_creado_en ON productos(creado_en);

-- Para verificar la migración, ejecutar:
-- SELECT * FROM productos ORDER BY id;

-- Si todo está correcto, puedes eliminar la tabla de backup:
-- DROP TABLE productos_backup;