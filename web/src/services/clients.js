import { supabase } from '../lib/supabase'
import { CONVENIO_EPS_IDS } from '../config'

export const DOCUMENT_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'RC', label: 'Registro civil' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'PPT', label: 'Permiso por protección temporal' },
]

export async function findClientByDocument(documentType, documentNumber) {
  const { data, error } = await supabase
    .from('clients')
    .select('*, eps(eps_name), cities(city_name)')
    .eq('document_type', documentType)
    .eq('document_number', documentNumber.trim())
    .maybeSingle()
  if (error) throw error
  return data
}

// Reglas 7 y 9: afiliación activa y EPS con convenio vigente.
export function checkEligibility(client) {
  if (client.affiliation_status !== 'ACTIVO') {
    return {
      ok: false,
      message: `La afiliación del paciente está ${client.affiliation_status.toLowerCase()}. Solo se agenda a pacientes con afiliación activa.`,
    }
  }
  if (CONVENIO_EPS_IDS && !CONVENIO_EPS_IDS.includes(client.eps_id)) {
    return {
      ok: false,
      message: 'La EPS del paciente no tiene convenio vigente con la IPS.',
    }
  }
  return { ok: true }
}

export function fullName(person) {
  return [person.first_name, person.second_name, person.last_name, person.second_last_name]
    .filter(Boolean)
    .join(' ')
}
