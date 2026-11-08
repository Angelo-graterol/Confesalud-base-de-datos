# Front-end de Confesalud IPS (gestión de citas)

Interfaz web en React para operar el proceso de citas médicas de Confesalud IPS sobre la base de datos de Supabase. Proyecto de Bases de Datos, Ingeniería de Sistemas, Universidad de Ocaña.

Este front-end **solo lee datos y escribe/cancela citas**. El esquema, los scripts SQL y los datos de prueba viven en `../supabase` y no se modifican desde aquí.

## Qué hace

**Paciente**
- Identificarse con tipo y número de documento (`/`).
- Agendar cita: especialidad, médico, fecha y horario de 20 minutos (`/agendar`).
- Ver sus citas y cancelarlas con motivo (`/mis-citas`).

**Personal administrativo** (`/admin`)
- Citas con filtros (fecha, especialidad, médico, estado), cancelar y reasignar.
- Búsqueda de pacientes y listado de médicos.
- Auditoría: tiempos de oportunidad (solicitud vs. asignación) y registro de cambios de `appointments_audit`.

## Requisitos

- Node.js 20.19 o superior (probado con Node 22) y npm.
- La URL y la clave pública de Supabase (ver abajo).

## Instalación

```bash
cd web
npm install
cp .env.example .env
```

Abre `.env` y llena los dos valores. Se sacan del panel de Supabase, en *Project Settings > API*:

```
VITE_SUPABASE_URL=https://<id-del-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<clave anon public o publishable>
```

> Usa solo la clave **anon / publishable**. **Nunca** pongas la `service_role` ni la cadena de conexión `psql` en el front ni en el repositorio. `.env` ya está en `.gitignore`.

## Comandos

```bash
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run lint     # revisión de estilo y errores
npm run build    # compila a la carpeta dist/
npm run preview  # sirve la carpeta dist/ para probarla
```

## Estructura

```
src/
  lib/          supabase.js (cliente), dates.js (horarios y fechas), labels.js, waitTimes.js
  services/     consultas a Supabase por tema: clients, catalog, orders, appointments, admin
  context/      paciente identificado y funcionario del panel (sessionStorage)
  components/   Layout, CancelForm, ReassignForm
  pages/        Home, Schedule, MyAppointments  y  admin/ (panel)
  config.js     reglas de negocio que no están en la base de datos
```

## Reglas de negocio

| # | Regla | Dónde se cumple |
|---|-------|-----------------|
| 1 | El paciente se identifica con su documento | `Home`, `services/clients.js` |
| 2 | No hay dos citas activas el mismo día para un paciente | `services/appointments.js` + `Schedule` |
| 3 | Especialista exige orden vigente (< 2 meses) | `services/orders.js` |
| 4 | Un médico no tiene dos citas en el mismo hueco | Base de datos (`uq_appointments_doctor_slot`) |
| 6 | Huecos fijos de 20 minutos, de 7:00 a 15:40 | Base de datos (`ck_appointments_slot`) y `lib/dates.js` |
| 7 | Paciente con afiliación ACTIVA | `services/clients.js` |
| 9 | EPS con convenio vigente | `config.js` (`CONVENIO_EPS_IDS`) |
| 10 | No se agenda en fechas pasadas | `Schedule`, `ReassignForm` |
| 11 | Al cancelar, el hueco queda libre | `cancelAppointment` + índice único que ignora canceladas |
| 12 | Toda cancelación guarda motivo y quién la hizo | `CancelForm`, `cancelAppointment` |
| 14 | Solo personal autorizado reasigna | `config.js` (`REASSIGN_ROLES`) |

## Decisiones y supuestos

- **Sin login.** La base de datos no tiene autenticación. El paciente se identifica por documento y el funcionario se elige de la lista de personal activo, sin contraseña. Es una demostración académica; en producción haría falta autenticación real.
- **Funcionario de las citas web.** `appointments.stf_id` es obligatorio; las citas pedidas por el paciente se registran con `WEB_STAFF_ID` (`config.js`).
- **Horas en Colombia.** Las fechas de la base son `timestamp` sin zona. El front las manda en hora de Bogotá, incluida `request_date`, para que la regla `assignment_date >= request_date` no falle por el reloj UTC del servidor.
- **Duración.** Todas las citas ocupan un hueco de 20 minutos (la regla de 40 minutos para especializada no está en la base).
- **Días de atención.** La base solo acepta lunes a viernes (`ck_appointments_weekday`); `OPEN_WEEKDAYS` en `config.js` lo refleja en el front.
- **Especialidad de una cita.** La cita no la guarda; los filtros por especialidad usan las de su médico.
- **Identidad visual.** Colores y logo de Confesalud IPS tomados de [confesalud.com](https://confesalud.com/): naranja del logo (`#FF6600`) para acentos y uno más oscuro (`#C2410C`) en botones para cumplir el contraste de lectura. El logo está en `public/logo-confesalud.png` y pertenece a la empresa; se usa solo en este proyecto académico.

## Pendientes que dependen de la base de datos

Si al agendar, cancelar o reasignar aparece un aviso de "falta una política de acceso", la clave pública no tiene permiso de escritura (RLS). No se resuelve desde el front: hay que pedir las políticas al responsable de la base (Juan José).

## Despliegue

1. `npm run build` genera la carpeta `dist/` (archivos estáticos).
2. Sube `dist/` a cualquier hosting estático (Vercel, Netlify, GitHub Pages, Cloudflare Pages) con `web/` como carpeta raíz y `npm run build` como comando de build.
3. Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno del hosting (no en el código).
4. Como la app usa rutas (`/agendar`, `/admin/...`), configura el hosting para devolver `index.html` en cualquier ruta (regla *SPA fallback*).

## Pruebas manuales

La lista de pruebas de aceptación (UAT) está en [`PRUEBAS.md`](./PRUEBAS.md).
