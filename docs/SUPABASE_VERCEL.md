# Supabase + Vercel — estabilidad de la base de datos

Guía para evitar cortes intermitentes (home vacío, `/api/products` en `[]`, vista rápida 503).

## Verificación rápida (producción)

Abrí: **https://fadustore.vercel.app/api/health**

Respuesta esperada:

```json
{
  "ok": true,
  "database": "ok",
  "databaseLatencyMs": 300,
  "databaseConfig": {
    "usesPooler": true,
    "hasPgbouncer": true,
    "serverlessReady": true,
    "warnings": []
  }
}
```

Si `database` es `"error"` o hay `warnings`, seguí los pasos de abajo.

---

## 1. URL correcta en Vercel

En **Supabase → Project Settings → Database → Connection string**:

1. Elegí **URI**
2. Elegí modo **Transaction** (pooler)
3. Puerto **6543** (no 5432)
4. Copiá la URL y agregá parámetros Prisma:

```
?pgbouncer=true&connection_limit=1&sslmode=require
```

Ejemplo (sin credenciales reales):

```
postgresql://postgres.[ref]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require
```

Pegala en **Vercel → Project → Settings → Environment Variables → `DATABASE_URL`** (Production, Preview y Development si aplica).

**Redeploy** después de cambiar la variable.

### Errores comunes

| Problema | Síntoma | Solución |
|----------|---------|----------|
| **Session mode (puerto 5432 pooler)** | `EMAXCONNSESSION max clients reached pool_size: 15` | Cambiar a **Transaction mode puerto 6543** + `pgbouncer=true` |
| Puerto 5432 (directo) | Timeouts, conexiones agotadas | Usar pooler **6543** |
| Sin `pgbouncer=true` | Errores raros con Prisma | Agregar parámetro |
| Sin `connection_limit=1` | Demasiadas conexiones en serverless | Agregar `connection_limit=1` |
| Proyecto Supabase pausado | Todo falla tras inactividad | Reanudar en dashboard Supabase |

---

## 2. Plan gratuito vs pago (desde agosto)

En el **plan gratuito** de Supabase:

- El proyecto se **pausa** tras ~7 días sin actividad → primera request lenta o error hasta despertar
- Límite de conexiones más bajo
- Compute compartido (más latencia en picos)

Con **plan pago** (Pro):

- Sin pausa automática
- Más conexiones y compute dedicado
- Mejor para tráfico real en ferias / lanzamientos

Recomendación: activar plan pago **antes** de eventos con mucho tráfico (feria FADU, campañas con cupones).

---

## 3. Región

Ideal: **Supabase y Vercel en la misma región** (ej. `sa-east-1` São Paulo si la audiencia es Argentina).

Más distancia = más latencia en cada query (~300 ms hoy es aceptable; >800 ms el health avisa).

---

## 4. Migraciones vs runtime

| Uso | URL |
|-----|-----|
| **Vercel (app)** | Pooler 6543 + `pgbouncer=true` |
| **Migraciones locales** (`db:push`, `db:migrate`) | Conexión directa 5432 (opcional `DIRECT_URL` en `.env.local`) |

No uses la URL del pooler para migraciones largas.

---

## 5. Qué hace el código

- **`lib/prisma.ts`**: un solo cliente Prisma por proceso (correcto en serverless)
- **`lib/db-retry.ts`**: reintentos solo en errores de conexión (P1001, P1017, timeouts…)
- **`lib/home-data.ts`**, **`/api/products`**: si falla la DB, devuelven arrays vacíos en lugar de romper el sitio
- **`/api/health`**: diagnóstico de conexión, latencia y warnings de configuración

---

## 6. Checklist antes de un evento

- [ ] `/api/health` → `ok: true`, `serverlessReady: true`
- [ ] Proyecto Supabase **activo** (no pausado)
- [ ] Plan pago activo si esperás mucho tráfico
- [ ] `prisma/add-columns-production.sql` ejecutado en Supabase SQL Editor
- [ ] Probar vista rápida, carrito y checkout con un pedido de prueba (admin)

---

## 7. Si sigue fallando

1. Revisá **Vercel → Logs** buscando `[db-retry]` o `[health]`
2. Revisá **Supabase → Database → Connection pooling** (Supavisor activo)
3. Confirmá que no hay otra `DATABASE_URL` vieja en Preview/Development
4. Contactá soporte Supabase si el pooler devuelve errores con URL correcta
