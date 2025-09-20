# Guía para Convertir IDs Problemáticos a Formato c-X

## Problema Identificado
Tienes productos con IDs largos como:
- `71a01ddb-899f-4d6d-987f-6cab94db7375`
- `baf4ac8f-e661-4ee1-b6e9-e8bdb5ee0399`

Que necesitan ser convertidos al formato: `c-1`, `c-2`, `c-3`, etc.

## Scripts Disponibles

### 1. `convert_ids_step_by_step.sql` (RECOMENDADO)
**Uso**: Para conversión controlada paso a paso
- Ejecutar cada sección individualmente
- Verificar resultados antes de continuar
- Máxima seguridad

### 2. `auto_convert_ids.sql` 
**Uso**: Para conversión automática rápida
- Ejecuta todo en una transacción
- Permite ROLLBACK si algo sale mal
- Más rápido pero menos control

### 3. `fix_existing_ids.sql`
**Uso**: Para análisis detallado
- Solo para diagnóstico y planificación
- No realiza cambios automáticos

## Pasos Recomendados

### OPCIÓN A: Conversión Paso a Paso (Más Segura)

1. **Conectar a tu base de datos**
```bash
psql -U tu_usuario -d tu_base_datos
```

2. **Ejecutar diagnóstico inicial**
```sql
-- Copiar y pegar SECCIÓN 1 del archivo convert_ids_step_by_step.sql
```

3. **Crear mapeo de conversión**
```sql
-- Copiar y pegar SECCIÓN 2 del archivo convert_ids_step_by_step.sql
```

4. **Verificar que no hay conflictos**
```sql
-- Copiar y pegar SECCIÓN 3 del archivo convert_ids_step_by_step.sql
```

5. **Hacer la conversión**
```sql
-- Copiar y pegar SECCIÓN 4 del archivo convert_ids_step_by_step.sql
```

6. **Verificar resultados**
```sql
-- Copiar y pegar SECCIÓN 5 del archivo convert_ids_step_by_step.sql
```

### OPCIÓN B: Conversión Automática (Más Rápida)

1. **Ejecutar el script automático**
```sql
\i auto_convert_ids.sql
```

2. **Revisar los resultados mostrados**

3. **Confirmar o deshacer**
```sql
-- Si todo está bien:
COMMIT;

-- Si hay problemas:
ROLLBACK;
```

## Qué Hace la Conversión

### Antes:
```
ID: 71a01ddb-899f-4d6d-987f-6cab94db7375  →  Producto: cuca
ID: baf4ac8f-e661-4ee1-b6e9-e8bdb5ee0399  →  Producto: Camisa gucci
```

### Después:
```
ID: c-1  →  Producto: cuca
ID: c-2  →  Producto: Camisa gucci
```

## Seguridad

- ✅ **Backup automático**: Los scripts crean respaldos antes de hacer cambios
- ✅ **Verificación de duplicados**: Verifica que no habrá conflictos de IDs
- ✅ **Transacciones**: Permite deshacer cambios si algo sale mal
- ✅ **Orden preservado**: Mantiene el orden cronológico de creación

## Verificación Post-Conversión

Después de la conversión, verifica:

1. **Todos los IDs tienen formato correcto**
```sql
SELECT * FROM productos WHERE NOT id ~ '^c-[0-9]+$';
-- Esta query no debe devolver filas
```

2. **Probar crear un producto nuevo**
- Debe obtener el siguiente ID disponible (ej: c-3, c-4, etc.)

3. **Probar buscar productos existentes**
- Tanto por ID como en las listas

## Rollback de Emergencia

Si algo sale mal, puedes restaurar:

```sql
-- Opción 1: Si usaste el script paso a paso
DROP TABLE productos;
ALTER TABLE productos_backup_before_id_conversion RENAME TO productos;

-- Opción 2: Si usaste el script automático (dentro de la misma sesión)
ROLLBACK;
```

## Contacto con el Sistema

Después de la conversión exitosa:
- Los nuevos productos seguirán el formato c-X automáticamente
- Las búsquedas por ID funcionarán normalmente  
- Los PDFs se generarán con los nuevos IDs
- El frontend ya está preparado para manejar este formato

¿Alguna duda antes de ejecutar la conversión?