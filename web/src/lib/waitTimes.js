const DAY_MS = 24 * 60 * 60 * 1000

// Tiempo de oportunidad: días entre la solicitud y la fecha asignada de la cita.
// Las fechas son "timestamp sin zona"; se leen como UTC para que la resta no dependa
// del horario de verano del computador.
export function waitDays(appointment) {
  return (
    (Date.parse(`${appointment.assignment_date}Z`) - Date.parse(`${appointment.request_date}Z`)) /
    DAY_MS
  )
}

function median(sortedValues) {
  const middle = Math.floor(sortedValues.length / 2)
  return sortedValues.length % 2
    ? sortedValues[middle]
    : (sortedValues[middle - 1] + sortedValues[middle]) / 2
}

export const BUCKETS = [
  { label: '0 a 3 días', max: 3 },
  { label: '4 a 7 días', max: 7 },
  { label: '8 a 15 días', max: 15 },
  { label: '16 a 30 días', max: 30 },
  { label: 'Más de 30 días', max: Infinity },
]

export function summarize(appointments) {
  if (appointments.length === 0) return null
  const days = appointments.map(waitDays).sort((a, b) => a - b)
  const average = days.reduce((sum, d) => sum + d, 0) / days.length

  const buckets = BUCKETS.map((bucket) => ({ ...bucket, count: 0 }))
  for (const d of days) {
    buckets.find((bucket) => Math.floor(d) <= bucket.max).count += 1
  }

  return {
    count: days.length,
    average,
    median: median(days),
    max: days[days.length - 1],
    buckets,
  }
}

// Promedio de espera por médico, de mayor a menor espera.
export function averageByDoctor(appointments) {
  const groups = new Map()
  for (const a of appointments) {
    const group = groups.get(a.dtr_id) ?? { doctorId: a.dtr_id, count: 0, total: 0 }
    group.count += 1
    group.total += waitDays(a)
    groups.set(a.dtr_id, group)
  }
  return [...groups.values()]
    .map((g) => ({ doctorId: g.doctorId, count: g.count, average: g.total / g.count }))
    .sort((a, b) => b.average - a.average)
}

export function formatDays(value) {
  return value.toLocaleString('es-CO', { maximumFractionDigits: 1 })
}
