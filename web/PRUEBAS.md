# Pruebas manuales (UAT) del front-end

Pruebas de aceptación para ejecutar con la app corriendo (`npm run dev`). Todos los datos son de prueba, inventados.

**Antes de empezar**
- Las pruebas marcadas con ✍️ **escriben en la base de datos** (crean o cambian citas). Requieren que la clave pública tenga permiso de escritura. Hazlas con cuidado: los datos quedan en Supabase.
- Los números de documento y de orden de abajo son los de los datos de prueba al **5 de noviembre de 2026**. Las órdenes vencen con el tiempo; si una ya no sirve, busca otra `VIGENTE` de tipo `CONSULTA ESPECIALISTA` que no tenga cita activa.
- Anota en la última columna: ✔ cumple, ✘ no cumple y una nota.

## 1. Identificación del paciente (regla 1, 7 y 9)

| # | Pasos | Resultado esperado | Resultado |
|---|-------|--------------------|-----------|
| 1.1 | En `/`, tipo `CC`, documento `1098701961`, Continuar | Entra a `/agendar` y muestra nombre, documento, EPS (COOSALUD), régimen, ciudad y afiliación ACTIVO | |
| 1.2 | Documento `0000000` | Mensaje "No encontramos un paciente con ese documento." y no avanza | |
| 1.3 | Documento vacío | Mensaje "Escribe el número de documento." | |
| 1.4 | Tipo `CC`, documento `1023888349` (afiliación suspendida) | Mensaje de que la afiliación está suspendida; no avanza | |
| 1.5 | Con un paciente identificado, "Cambiar paciente" | Vuelve a `/` y se borra el paciente | |
| 1.6 | Entrar a `/agendar` sin identificarse | Redirige a `/` | |

## 2. Agendar cita (reglas 2, 3, 4, 6, 10)

| # | Pasos | Resultado esperado | Resultado |
|---|-------|--------------------|-----------|
| 2.1 | Paciente `1098701961`, especialidad `CARDIOLOGIA` | Solo aparecen médicos activos de esa especialidad (Edwin Arévalo Guerrero, Diego Barbosa) | |
| 2.2 | La lista de especialidades | No aparece `DERMATOLOGIA` (inactiva) | |
| 2.3 | Elegir un médico y una fecha futura | Se muestran horarios cada 20 minutos, de 7:00 a. m. a 3:40 p. m. (máximo 27) | |
| 2.4 | Comparar con una fecha en que el médico ya tenga cita | El hueco ocupado **no** aparece | |
| 2.5 | Elegir la fecha de hoy | No aparecen horarios que ya pasaron | |
| 2.6 | Intentar escribir una fecha pasada en el campo de fecha | Mensaje "No se puede agendar en fechas pasadas." y sin horarios | |
| 2.7 | Especialidad `MEDICINA GENERAL` | **No** pide orden médica | |
| 2.8 | Especialidad `CARDIOLOGIA` y un horario elegido | Aparecen los campos de número y fecha de expedición de la orden | |
| 2.9 | ✍️ Confirmar sin llenar la orden | Mensaje de que se exige la orden; no crea nada | |
| 2.10 | Orden `OM-00001`, expedida `2026-02-04` | "La orden está vencida y no se puede usar." | |
| 2.11 | Orden `OM-00003`, expedida `2026-10-31` | "Esta orden ya está asociada a otra cita." | |
| 2.12 | Orden `OM-00009`, expedida `2026-11-16` | Mensaje de que es una orden de laboratorio y no sirve para especialista | |
| 2.13 | Orden `OM-00094`, con una fecha de expedición distinta de la real | "La fecha de expedición no coincide con la de la orden." | |
| 2.14 | ✍️ Orden `OM-00094`, expedida `2026-11-05`, horario libre | Muestra "Cita programada" con especialidad, médico, fecha, hora y código | |
| 2.15 | ✍️ Con el paciente de 2.14, otra cita el **mismo día** (otro médico u hora) | "Ya tienes una cita programada ese día." (regla 2) | |
| 2.16 | ✍️ Dos personas eligen el mismo hueco a la vez; la segunda confirma después | "Ese horario acaba de ser tomado por otra persona." (regla 4) | |

## 3. Mis citas y cancelación (reglas 11 y 12)

| # | Pasos | Resultado esperado | Resultado |
|---|-------|--------------------|-----------|
| 3.1 | Paciente `1052170303`, menú "Mis citas" | Sección "Próximas" con su cita programada y sección "Historial" | |
| 3.2 | Paciente `1063877196`, "Mis citas" | En el historial, las canceladas muestran "Cancelada por el paciente: «motivo»" | |
| 3.3 | En una cita próxima, "Cancelar cita" y "Confirmar cancelación" sin motivo | "Escribe el motivo de la cancelación (mínimo 5 letras)." | |
| 3.4 | "Mantener cita" | Se cierra el formulario, la cita sigue programada | |
| 3.5 | ✍️ Cancelar con motivo "Cambio de planes" | La cita pasa al historial como Cancelada con ese motivo | |
| 3.6 | ✍️ Tras 3.5, agendar con el mismo médico, fecha y hora | El hueco vuelve a aparecer libre (regla 11) | |
| 3.7 | Citas atendidas o pasadas | No tienen botón de cancelar | |

## 4. Panel administrativo

| # | Pasos | Resultado esperado | Resultado |
|---|-------|--------------------|-----------|
| 4.1 | Ir a `/admin` | Pide elegir funcionario; sin elegir no entra | |
| 4.2 | Elegir una coordinadora y entrar | Abre "Citas" con las de los próximos 7 días; arriba el nombre y el rol | |
| 4.3 | Filtrar por estado "Cancelada" y ampliar el rango de fechas | Solo canceladas, sin botones de acción | |
| 4.4 | Filtrar por especialidad `CARDIOLOGIA` | La lista de médicos se reduce a los de cardiología | |
| 4.5 | Entrar como **recepcionista** | En citas futuras solo aparece "Cancelar" (sin "Reasignar") | |
| 4.6 | Entrar como **coordinador** | Aparecen "Cancelar" y "Reasignar" | |
| 4.7 | ✍️ Cancelar una cita con motivo | Queda Cancelada, "por el personal administrativo", con el motivo | |
| 4.8 | ✍️ Reasignar a otro médico de la misma especialidad, nueva fecha y hora | La cita cambia y queda la nota "Reasignada por …" | |
| 4.9 | Reasignar: elegir la fecha de hoy | No ofrece horarios que ya pasaron | |
| 4.10 | Pestaña "Pacientes", buscar `1063877196` | Un resultado; al abrirlo muestra EPS, régimen, nacimiento, género, teléfono, correo, dirección, ciudad, zona, ocupación y nivel educativo | |
| 4.11 | Buscar un apellido | Lista los pacientes que coinciden | |
| 4.12 | Pestaña "Médicos" | 25 médicos con documento, registro médico, especialidades y estado | |
| 4.13 | Filtrar médicos por estado "Vacaciones" | Solo médicos de vacaciones | |
| 4.14 | "Salir" | Vuelve al selector de funcionario | |

## 5. Auditoría (requisito 8)

| # | Pasos | Resultado esperado | Resultado |
|---|-------|--------------------|-----------|
| 5.1 | Panel > Auditoría | Muestra citas, espera promedio, mediana y máxima en días | |
| 5.2 | Revisar la distribución | Cinco rangos (0–3, 4–7, 8–15, 16–30, más de 30 días) y los conteos suman el total de citas | |
| 5.3 | Espera promedio por médico | Lista de médicos, de mayor a menor espera | |
| 5.4 | Filtrar por fechas de solicitud | Los números cambian y siguen siendo coherentes | |
| 5.5 | Registro de cambios, filtrar por número de cita | Solo los cambios de esa cita | |
| 5.6 | Filtrar operación "Modificada" | Cada cambio muestra el campo y "antes → después" (por ejemplo, Estado: PROGRAMADA → CANCELADA) | |
| 5.7 | ✍️ Cancelar una cita (prueba 3.5 o 4.7) y volver al registro | Aparece un cambio nuevo para esa cita | |

## 6. Diseño y accesibilidad

| # | Pasos | Resultado esperado | Resultado |
|---|-------|--------------------|-----------|
| 6.1 | Abrir la app en un celular o con la ventana angosta (375 px) | Sin scroll horizontal; botones y horarios usables | |
| 6.2 | Navegar con el teclado (Tab) | El foco siempre se ve y todos los campos se pueden usar | |
| 6.3 | Revisar los formularios | Cada campo tiene su etiqueta visible | |
| 6.4 | Provocar un error (por ejemplo, documento inexistente) | El mensaje de error aparece y se anuncia (rol de alerta) | |
