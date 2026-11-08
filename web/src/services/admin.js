import { supabase } from '../lib/supabase'

const PAGE_LIMIT = 100

export async function getActiveStaff() {
  const { data, error } = await supabase
    .from('staffs')
    .select('id, first_name, second_name, last_name, second_last_name, staff_role')
    .eq('staff_status', 'ACTIVO')
    .order('staff_role')
    .order('last_name')
  if (error) throw error
  return data
}

export async function getAllSpecialties() {
  const { data, error } = await supabase
    .from('specialties')
    .select('id, specialty_name')
    .order('specialty_name')
  if (error) throw error
  return data
}

// Todos los médicos con sus especialidades (son pocos, se filtran en el navegador).
export async function getDoctorsWithSpecialties() {
  const { data, error } = await supabase
    .from('doctors')
    .select(
      'id, first_name, second_name, last_name, second_last_name, document_type, document_number, medical_registration, doctor_status, doctor_specialties(scy_id, specialties(specialty_name))',
    )
    .order('last_name')
  if (error) throw error
  return data.map((doctor) => ({
    ...doctor,
    specialties: doctor.doctor_specialties.map((row) => ({
      id: row.scy_id,
      name: row.specialties.specialty_name,
    })),
  }))
}

// Citas con filtros. La especialidad se filtra por los médicos que la tienen,
// porque la cita no guarda la especialidad.
export async function searchAppointments({ from, to, doctorId, specialtyId, status }) {
  let doctorIds = null
  if (specialtyId) {
    const { data, error } = await supabase
      .from('doctor_specialties')
      .select('dtr_id')
      .eq('scy_id', specialtyId)
    if (error) throw error
    doctorIds = data.map((row) => row.dtr_id)
    if (doctorIds.length === 0) return { rows: [], total: 0 }
  }

  let query = supabase
    .from('appointments')
    .select(
      'id, request_date, assignment_date, appointment_status, channel, observation, dtr_id, ' +
        'clients(first_name, second_name, last_name, second_last_name, document_type, document_number), ' +
        'doctors(first_name, second_name, last_name, second_last_name), ' +
        'medical_orders(order_number), ' +
        'cancellations(reason, cancelled_by)',
      { count: 'exact' },
    )
    .order('assignment_date', { ascending: true })
    .limit(PAGE_LIMIT)

  if (from) query = query.gte('assignment_date', `${from}T00:00:00`)
  if (to) query = query.lte('assignment_date', `${to}T23:59:59`)
  if (doctorId) query = query.eq('dtr_id', doctorId)
  if (doctorIds) query = query.in('dtr_id', doctorIds)
  if (status) query = query.eq('appointment_status', status)

  const { data, count, error } = await query
  if (error) throw error
  return { rows: data, total: count }
}

// Fechas de solicitud y asignación de las citas (para calcular tiempos de oportunidad).
// Supabase entrega máximo 1000 filas por consulta, por eso se pide por páginas.
export async function getWaitTimes({ from, to, status }) {
  const pageSize = 1000
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from('appointments')
      .select('id, request_date, assignment_date, appointment_status, dtr_id')
      .order('id')
      .range(offset, offset + pageSize - 1)
    if (from) query = query.gte('request_date', `${from}T00:00:00`)
    if (to) query = query.lte('request_date', `${to}T23:59:59`)
    if (status) query = query.eq('appointment_status', status)
    const { data, error } = await query
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) break
  }
  return rows
}

// Últimos cambios registrados por el trigger en appointments_audit.
export async function getAuditLog({ aptId, operation }) {
  let query = supabase
    .from('appointments_audit')
    .select('id, apt_id, operation, old_data, new_data, changed_at, changed_by', { count: 'exact' })
    .order('changed_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(50)
  if (aptId) query = query.eq('apt_id', Number(aptId))
  if (operation) query = query.eq('operation', operation)
  const { data, count, error } = await query
  if (error) throw error
  return { rows: data, total: count }
}

// Pacientes por documento o nombre. Se quitan caracteres que rompen el filtro de PostgREST.
export async function searchClients(text) {
  const term = text.replace(/[,()%*\\]/g, ' ').trim()
  let query = supabase
    .from('clients')
    .select('*, eps(eps_name), cities(city_name)', { count: 'exact' })
    .order('last_name')
    .limit(PAGE_LIMIT)
  if (term) {
    query = query.or(
      `document_number.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%,second_last_name.ilike.%${term}%`,
    )
  }
  const { data, count, error } = await query
  if (error) throw error
  return { rows: data, total: count }
}
