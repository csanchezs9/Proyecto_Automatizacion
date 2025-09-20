-- Script para actualizar la base de datos con capacidades empresariales
-- IMPORTANTE: Hacer backup antes de ejecutar

-- Actualizar tabla productos con campos empresariales
ALTER TABLE productos ADD COLUMN IF NOT EXISTS talla VARCHAR(10);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS temporada VARCHAR(20);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_costo DECIMAL(10,2) DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS margen_ganancia DECIMAL(5,2) DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS sku VARCHAR(50) UNIQUE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS peso DECIMAL(8,2);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS dimensiones VARCHAR(50);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS material VARCHAR(100);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fecha_ultimo_inventario DATE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS popularidad INTEGER DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS descuento_porcentaje DECIMAL(5,2) DEFAULT 0;

-- Crear tabla de ventas para análisis
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cliente_id VARCHAR(100),
    canal_venta VARCHAR(50) DEFAULT 'online',
    descuento_aplicado DECIMAL(5,2) DEFAULT 0,
    metodo_pago VARCHAR(50),
    region VARCHAR(100)
);

-- Crear tabla de inventario para seguimiento
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id VARCHAR(20) REFERENCES productos(id),
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
    cantidad INTEGER NOT NULL,
    motivo VARCHAR(255),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(100),
    costo_unitario DECIMAL(10,2)
);

-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),
    direccion TEXT,
    tiempo_entrega_dias INTEGER DEFAULT 7,
    calificacion DECIMAL(3,2) DEFAULT 5.0,
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de clientes para análisis de comportamiento
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    telefono VARCHAR(50),
    fecha_nacimiento DATE,
    genero VARCHAR(20),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    fecha_primera_compra TIMESTAMP,
    total_compras DECIMAL(10,2) DEFAULT 0,
    numero_compras INTEGER DEFAULT 0,
    categoria_preferida VARCHAR(100),
    talla_preferida VARCHAR(10),
    activo BOOLEAN DEFAULT true,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de campañas de marketing
CREATE TABLE IF NOT EXISTS campanas_marketing (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo_campana VARCHAR(50), -- 'descuento', 'promocion', 'newsletter', 'restock'
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    productos_incluidos TEXT[], -- Array de IDs de productos
    segmento_objetivo VARCHAR(100), -- 'todos', 'nuevos_clientes', 'clientes_vip', etc.
    automatica BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    resultados JSONB, -- Métricas de la campaña
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de alertas del sistema
CREATE TABLE IF NOT EXISTS alertas_sistema (
    id SERIAL PRIMARY KEY,
    tipo_alerta VARCHAR(50), -- 'stock_bajo', 'producto_sin_rotacion', 'oportunidad_venta'
    producto_id VARCHAR(20) REFERENCES productos(id),
    mensaje TEXT NOT NULL,
    nivel_prioridad VARCHAR(20) DEFAULT 'media', -- 'alta', 'media', 'baja'
    leida BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_talla ON productos(talla);
CREATE INDEX IF NOT EXISTS idx_productos_temporada ON productos(temporada);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_producto ON ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas_sistema(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_alertas_leida ON alertas_sistema(leida);

-- Insertar datos de ejemplo para demostración
INSERT INTO proveedores (nombre, contacto, email, telefono, tiempo_entrega_dias, calificacion) VALUES
('Textiles Premium S.A.', 'Juan Pérez', 'juan@textilespremium.com', '+34 123 456 789', 5, 4.8),
('Moda Internacional', 'María García', 'maria@modainternacional.com', '+34 987 654 321', 7, 4.5),
('Confecciones Elite', 'Carlos López', 'carlos@confeccioneselite.com', '+34 555 123 456', 3, 4.9)
ON CONFLICT DO NOTHING;

-- Insertar categorías ejemplo
UPDATE productos SET 
    categoria = CASE 
        WHEN LOWER(nombre) LIKE '%camiseta%' OR LOWER(nombre) LIKE '%camisa%' THEN 'Camisetas'
        WHEN LOWER(nombre) LIKE '%pantalon%' OR LOWER(nombre) LIKE '%jean%' THEN 'Pantalones'
        WHEN LOWER(nombre) LIKE '%zapato%' OR LOWER(nombre) LIKE '%calzado%' THEN 'Calzado'
        WHEN LOWER(nombre) LIKE '%chaqueta%' OR LOWER(nombre) LIKE '%abrigo%' THEN 'Abrigos'
        ELSE 'General'
    END,
    talla = CASE 
        WHEN RANDOM() < 0.2 THEN 'XS'
        WHEN RANDOM() < 0.4 THEN 'S'
        WHEN RANDOM() < 0.6 THEN 'M'
        WHEN RANDOM() < 0.8 THEN 'L'
        ELSE 'XL'
    END,
    temporada = CASE 
        WHEN RANDOM() < 0.25 THEN 'Primavera'
        WHEN RANDOM() < 0.5 THEN 'Verano'
        WHEN RANDOM() < 0.75 THEN 'Otoño'
        ELSE 'Invierno'
    END,
    stock = FLOOR(RANDOM() * 100) + 1,
    precio_costo = precio * 0.6,
    margen_ganancia = 40.0,
    sku = 'SKU-' || id,
    activo = true,
    popularidad = FLOOR(RANDOM() * 100)
WHERE categoria IS NULL;