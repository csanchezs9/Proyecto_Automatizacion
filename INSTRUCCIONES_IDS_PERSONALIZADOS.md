# Actualización del Sistema de IDs Personalizados

## Resumen de Cambios

Se ha implementado un sistema de IDs personalizados para los productos que utiliza el formato `c-1`, `c-2`, `c-3`, etc., en lugar de números largos auto-generados.

## Archivos Modificados

### 1. `src/controllers/productController.js`
- ✅ Agregada función `generateCustomId()` que genera IDs secuenciales en formato `c-X`
- ✅ Modificado método `createProduct()` para usar IDs personalizados
- La función busca el último ID usado y genera el siguiente número secuencial

### 2. `public/html_clasico.html`
- ✅ Cambiado el input de búsqueda por ID de `type="number"` a `type="text"`
- ✅ Actualizado placeholder para mostrar ejemplos del nuevo formato

### 3. `public/index.html`
- ✅ Ya estaba configurado correctamente para manejar IDs de texto

## Archivos SQL Creados

### `update_database.sql`
Script completo para migrar la base de datos con tabla temporal (método seguro).

### `migrate_database_step_by_step.sql` 
Script paso a paso para ejecutar la migración de forma controlada.

## Pasos para Implementar

### 1. Hacer Backup de la Base de Datos
```bash
pg_dump -U tu_usuario -h localhost tu_base_datos > backup_productos.sql
```

### 2. Ejecutar la Migración de la Base de Datos

**Opción A: Migración paso a paso (recomendada)**
```sql
-- Ejecutar cada comando del archivo migrate_database_step_by_step.sql
-- uno por uno y verificar los resultados
```

**Opción B: Migración completa**
```sql
-- Ejecutar el archivo update_database.sql completo
```

### 3. Reiniciar la Aplicación
```bash
npm start
```

## Funcionamiento del Sistema de IDs

### Generación de IDs
- Los nuevos productos tendrán IDs: `c-1`, `c-2`, `c-3`, etc.
- El sistema busca automáticamente el último número usado
- No se repiten IDs, incluso si se eliminan productos intermedios

### Búsqueda por ID
- El frontend ahora acepta tanto IDs nuevos (`c-1`) como antiguos (`123`)
- Los placeholders muestran ejemplos del formato esperado

## Compatibilidad

- ✅ Los productos existentes mantendrán sus IDs hasta la migración
- ✅ Después de la migración, todos tendrán formato `c-X`
- ✅ El frontend es compatible con ambos formatos durante la transición
- ✅ Las funciones de PDF y otras operaciones funcionarán normalmente

## Verificación Post-Migración

Después de ejecutar la migración, verificar:

1. **Consultar productos**:
```sql
SELECT * FROM productos ORDER BY CAST(SUBSTRING(id FROM 3) AS INTEGER);
```

2. **Crear un producto nuevo** desde el frontend y verificar que el ID sea `c-X`

3. **Buscar productos** usando tanto IDs antiguos como nuevos

## Rollback (En caso de problemas)

Si algo sale mal, puedes restaurar desde el backup:
```sql
-- Renombrar tabla actual
ALTER TABLE productos RENAME TO productos_with_issues;

-- Restaurar desde backup
psql -U tu_usuario -d tu_base_datos < backup_productos.sql
```

## Notas Importantes

- ⚠️ **SIEMPRE hacer backup antes de la migración**
- ✅ La migración preserva todos los datos existentes
- ✅ Los IDs personalizados son más legibles y fáciles de recordar
- ✅ El sistema mantiene el orden secuencial automáticamente