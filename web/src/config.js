// Reglas de negocio que el front necesita y que no viven en la base de datos.
// Si cambia una regla, se cambia aquí y en ningún otro lugar.

// Agenda: huecos fijos de 20 minutos, de 7:00 a 15:40 (ver migración citas_sin_cruce).
export const SLOT_MINUTES = 20
export const DAY_START_MINUTES = 7 * 60
export const LAST_SLOT_MINUTES = 15 * 60 + 40

// Días de la semana en que se agenda (0 = domingo ... 6 = sábado).
// La BD solo acepta lunes a viernes (ck_appointments_weekday, migración reglas_citas).
export const OPEN_WEEKDAYS = [1, 2, 3, 4, 5]

// Hasta cuántos días hacia adelante se puede agendar.
export const MAX_DAYS_AHEAD = 60

// Medicina general (specialties.id = 1) no exige orden médica; las demás sí.
export const GENERAL_MEDICINE_ID = 1

// La orden vale máximo 2 meses desde su expedición.
export const ORDER_VALID_MONTHS = 2

// Tipos de orden (order_types.id) que sirven para pedir cita con especialista:
// 1 = CONSULTA ESPECIALISTA, 6 = CONTROL.
export const SPECIALIST_ORDER_TYPE_IDS = [1, 6]

// La tabla appointments exige un funcionario (stf_id). Las citas pedidas desde la web
// se registran con este funcionario (RECEPCIONISTA activo).
export const WEB_STAFF_ID = 1

// Regla 14: roles de funcionario (staffs.staff_role) autorizados a reasignar una cita confirmada.
// Cancelar puede hacerlo cualquier funcionario activo.
export const REASSIGN_ROLES = ['COORDINADOR', 'ADMINISTRADOR']

// EPS con convenio vigente (eps.id). null = cualquier EPS registrada en la tabla `eps`.
// La EPS real del convenio (Comfaoriente) no está en los datos de prueba.
export const CONVENIO_EPS_IDS = null
