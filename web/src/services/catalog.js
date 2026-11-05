import { supabase } from '../lib/supabase'

export async function getActiveSpecialties() {
  const { data, error } = await supabase
    .from('specialties')
    .select('id, specialty_name')
    .eq('specialty_status', 'ACTIVA')
    .order('specialty_name')
  if (error) throw error
  return data
}

// Médicos activos que tienen la especialidad (tabla muchos a muchos doctor_specialties).
export async function getDoctorsBySpecialty(specialtyId) {
  const { data, error } = await supabase
    .from('doctor_specialties')
    .select('doctors(id, first_name, second_name, last_name, second_last_name, medical_registration, doctor_status)')
    .eq('scy_id', specialtyId)
  if (error) throw error
  return data
    .map((row) => row.doctors)
    .filter((doctor) => doctor && doctor.doctor_status === 'ACTIVO')
    .sort((a, b) => a.last_name.localeCompare(b.last_name))
}
