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
