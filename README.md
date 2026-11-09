# Confesalud — Base de datos de gestión de citas médicas

Proyecto de la materia Base de datos. Recreación de la base de datos del proceso de gestión de citas de Confesalud I.P.S, implementada en PostgreSQL, desplegada en Supabase y con una aplicación web en React.

## Integrantes

- Juan José Zambrano Manzano (0192327)
- Nicoll Sofia Arevalo Caballero (0192316)
- Angelo Alessandro Graterol (0192330)

## Tecnologías

| Parte | Tecnología |
|---|---|
| Base de datos | PostgreSQL |
| Nube | Supabase |
| Migraciones | Supabase CLI |
| Aplicación web | React + Vite, `@supabase/supabase-js` |

## Estructura del repositorio

```
├── supabase/
│   ├── config.toml       → configuración de la CLI de Supabase
│   ├── migrations/       → scripts DDL: tablas, restricciones, triggers (se ejecutan en orden)
│   └── seeds/            → scripts DML: datos de prueba para la base local
├── web/                  → aplicación web en React
└── docs/                 → documentación del proyecto
```

## Modelo de datos

13 tablas en el esquema `public`:

| Grupo | Tablas |
|---|---|
| Catálogos | `states`, `cities`, `eps`, `order_types`, `specialties`, `medical_orders` |
| Personas | `doctors`, `staffs`, `doctor_specialties`, `clients` |
| Citas | `appointments`, `cancellations` |
| Auditoría | `appointments_audit` |

## Migraciones

| # | Migración | Contenido |
|---|---|---|
| 1 | `catalogos` | Departamentos, ciudades, EPS, tipos de orden, órdenes médicas y especialidades |
| 2 | `personas` | Médicos, personal administrativo, especialidades de cada médico y pacientes |
| 3 | `citas` | Citas y cancelaciones, con llaves foráneas y borrado en cascada |
| 4 | `auditoria` | Tabla de auditoría y trigger que registra cada cambio en las citas |
| 5 | `citas_sin_cruce` | Huecos fijos de 20 minutos (7:00 a 15:40) y un médico por hueco |
| 6 | `reglas_citas` | Un paciente por hueco, orden médica vigente y de un solo uso, médico activo, afiliación activa, lunes a viernes y cancelación que libera el cupo |

## Reglas del negocio implementadas

- Las citas van en huecos fijos de 20 minutos, de 7:00 a.m. a 4:00 p.m., de lunes a viernes.
- Un médico no puede tener dos citas en el mismo hueco, y un paciente tampoco.
- Solo se asignan citas a médicos activos y a pacientes con afiliación activa.
- Si la cita usa una orden médica, la orden debe estar vigente el día de la cita y no puede estar anulada. Cada orden sirve para una sola cita activa.
- Al registrar una cancelación, la cita pasa a estado `CANCELADA` y el hueco queda libre. Solo se cancelan citas programadas.
- La hora de llegada solo se registra en citas atendidas.
- Toda cita que se crea, se modifica o se borra queda registrada en `appointments_audit`.

## Requisitos

- Git
- Node.js 18 o superior
- Docker (para la base de datos local)
- Supabase CLI (se usa con `npx supabase`)

## Cómo ejecutar el proyecto

### Base de datos local

```bash
git clone https://github.com/Angelo-graterol/Confesalud-base-de-datos.git
cd Confesalud-base-de-datos
npx supabase start
npx supabase db reset
```

`db reset` crea las 13 tablas con las migraciones y carga los datos de prueba de `supabase/seeds/`. La base local queda en `postgresql://postgres:postgres@127.0.0.1:54322/postgres` y el panel en `http://127.0.0.1:54323`.

### Aplicación web

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

En `.env` se ponen la URL del proyecto y la llave pública (anon) de Supabase.

## Despliegue en Supabase

```bash
npx supabase login
npx supabase link --project-ref <id-del-proyecto>
npx supabase db push
```

Si la conexión falla por tiempo de espera, se puede usar la cadena del Session pooler:

```bash
npx supabase db push --db-url "postgresql://postgres.<id-del-proyecto>:<contraseña>@<host-del-pooler>:5432/postgres"
```

## Reglas para el equipo

- No subir el archivo `.env` ni la llave `service_role`.
- No crear ni modificar tablas desde el panel de Supabase. Todo cambio de estructura va como migración nueva (`npx supabase migration new <nombre>`).
- No editar una migración que ya se subió a Supabase.
- Nombres en minúscula y `snake_case`. Todas las restricciones llevan nombre (`pk_`, `fk_`, `uq_`, `ck_`).
