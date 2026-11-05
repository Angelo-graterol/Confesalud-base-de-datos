import { supabase } from '../lib/supabase'
import { WEB_STAFF_ID } from '../config'
import { nowBogota } from '../lib/dates'

// Horas ('07:20') que ya tiene ocupadas un médico en una fecha.
// Las citas canceladas no ocupan el hueco (misma regla del índice único de la BD).
export async function getTakenSlots(doctorId, date) {
  const { data, error } = await supabase
    .from('appointments')
    .select('assignment_date')
    .eq('dtr_id', doctorId)
    .neq('appointment_status', 'CANCELADA')
    .gte('assignment_date', `${date}T00:00:00`)
    .lte('assignment_date', `${date}T23:59:59`)
  if (error) throw error
  return data.map((row) => row.assignment_date.slice(11, 16))
}

// Regla 2: un paciente no puede tener dos citas activas el mismo día.
export async function clientHasActiveAppointmentOn(clientId, date) {
  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('cet_id', clientId)
    .eq('appointment_status', 'PROGRAMADA')
    .gte('assignment_date', `${date}T00:00:00`)
    .lte('assignment_date', `${date}T23:59:59`)
  if (error) throw error
  return count > 0
}

// Citas del paciente, de la más reciente a la más antigua, con médico, orden y cancelación.
export async function getClientAppointments(clientId) {
  const { data, error } = await supabase
    .from('appointments')
    .select(
      '*, doctors(first_name, second_name, last_name, second_last_name), medical_orders(order_number), cancellations(reason, cancelled_by, cancellation_date)',
    )
    .eq('cet_id', clientId)
    .order('assignment_date', { ascending: false })
  if (error) throw error
  return data
}

// Regla 12: toda cancelación registra motivo y quién la hizo.
// Regla 11: al pasar la cita a CANCELADA el hueco queda libre (el índice único la ignora).
// Son dos escrituras (cancelación + estado de la cita). Se inserta primero la cancelación;
// si el cambio de estado falla, se intenta deshacerla para no dejar datos a medias.
export async function cancelAppointment({
  appointmentId,
  reason,
  cancelledBy = 'PACIENTE',
  staffId = WEB_STAFF_ID,
}) {
  const { data: cancellation, error: insertError } = await supabase
    .from('cancellations')
    .insert({
      cancellation_date: nowBogota(),
      reason: reason.trim(),
      cancelled_by: cancelledBy,
      apt_id: appointmentId,
      stf_id: staffId,
    })
    .select()
    .single()

  if (insertError) throw friendlyWriteError(insertError)

  const { data: updated, error: updateError } = await supabase
    .from('appointments')
    .update({ appointment_status: 'CANCELADA' })
    .eq('id', appointmentId)
    .eq('appointment_status', 'PROGRAMADA')
    .select()

  if (updateError || updated.length === 0) {
    await supabase.from('cancellations').delete().eq('id', cancellation.id)
    if (updateError) throw friendlyWriteError(updateError)
    throw new Error('No se pudo cancelar la cita: ya no está programada o no hay permiso para modificarla. Avísale a Juan José.')
  }
}

// Regla 14: solo personal autorizado reasigna una cita ya confirmada (ver REASSIGN_ROLES).
// Cambia médico y/o hueco; deja constancia en la observación de la cita.
export async function reassignAppointment({ appointment, doctorId, date, time, staff }) {
  const note = `Reasignada por ${staff.first_name} ${staff.last_name} el ${nowBogota().slice(0, 16).replace('T', ' ')}`
  const observation = [appointment.observation, note].filter(Boolean).join(' · ').slice(-300)

  const { data, error } = await supabase
    .from('appointments')
    .update({ dtr_id: doctorId, assignment_date: `${date}T${time}:00`, observation })
    .eq('id', appointment.id)
    .eq('appointment_status', 'PROGRAMADA')
    .select()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ese horario acaba de ser tomado por otra persona. Elige otro.')
    }
    throw friendlyWriteError(error)
  }
  if (data.length === 0) {
    throw new Error('No se pudo reasignar: la cita ya no está programada o no hay permiso para modificarla. Avísale a Juan José.')
  }
  return data[0]
}

function friendlyWriteError(error) {
  if (error.code === '42501' || /row-level security/i.test(error.message)) {
    return new Error('La base de datos no permite esta operación con esta clave (falta una política de acceso). Avísale a Juan José.')
  }
  if (error.code === '23505') {
    return new Error('Esta cita ya tiene una cancelación registrada.')
  }
  return error
}

// Crea la cita. request_date se manda explícito, en hora de Bogotá: si se dejara el
// default now() del servidor (UTC), la regla assignment_date >= request_date podría fallar.
export async function createAppointment({ clientId, doctorId, date, time, orderId }) {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      request_date: nowBogota(),
      assignment_date: `${date}T${time}:00`,
      channel: 'WEB',
      appointment_status: 'PROGRAMADA',
      cet_id: clientId,
      dtr_id: doctorId,
      stf_id: WEB_STAFF_ID,
      mor_id: orderId ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Ese horario acaba de ser tomado por otra persona. Elige otro.')
    }
    if (error.code === '42501' || /row-level security/i.test(error.message)) {
      throw new Error('La base de datos no permite crear citas con esta clave (falta una política de acceso). Avísale a Juan José.')
    }
    throw error
  }
  return data
}
