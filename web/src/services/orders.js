import { supabase } from '../lib/supabase'
import { ORDER_VALID_MONTHS, SPECIALIST_ORDER_TYPE_IDS } from '../config'
import { addMonths, todayBogota } from '../lib/dates'

// Regla 3: la cita con especialista exige una orden vigente, expedida hace menos de 2 meses.
// Devuelve { ok: true, order } o { ok: false, message }.
export async function validateMedicalOrder(orderNumber, issueDate) {
  const { data: order, error } = await supabase
    .from('medical_orders')
    .select('*, order_types(type_name)')
    .eq('order_number', orderNumber.trim().toUpperCase())
    .maybeSingle()
  if (error) throw error

  if (!order) return { ok: false, message: 'No encontramos una orden con ese número.' }

  if (order.issue_date !== issueDate) {
    return { ok: false, message: 'La fecha de expedición no coincide con la de la orden.' }
  }

  const today = todayBogota()
  if (order.order_status !== 'VIGENTE') {
    return { ok: false, message: `La orden está ${order.order_status.toLowerCase()} y no se puede usar.` }
  }
  if (order.expiration_date < today || addMonths(order.issue_date, ORDER_VALID_MONTHS) < today) {
    return { ok: false, message: 'La orden venció. Debe tener menos de 2 meses desde su expedición.' }
  }
  if (!SPECIALIST_ORDER_TYPE_IDS.includes(order.ote_id)) {
    return {
      ok: false,
      message: `Esta orden es de tipo ${order.order_types.type_name.toLowerCase()} y no sirve para una cita con especialista.`,
    }
  }

  const { count, error: usedError } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('mor_id', order.id)
    .neq('appointment_status', 'CANCELADA')
  if (usedError) throw usedError
  if (count > 0) return { ok: false, message: 'Esta orden ya está asociada a otra cita.' }

  return { ok: true, order }
}
