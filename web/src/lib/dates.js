import { DAY_START_MINUTES, LAST_SLOT_MINUTES, SLOT_MINUTES } from '../config'

const TIME_ZONE = 'America/Bogota'

// Las fechas de la BD son "timestamp sin zona": se guardan tal cual, en hora de Colombia.
// Por eso siempre se arma la fecha actual en hora de Bogotá, sin importar el computador.
export function nowBogota() {
  return new Date().toLocaleString('sv-SE', { timeZone: TIME_ZONE }).replace(' ', 'T')
}

export function todayBogota() {
  return nowBogota().slice(0, 10)
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function addMonths(dateStr, months) {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function weekday(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay()
}

// ['07:00', '07:20', ..., '15:40']  (27 huecos)
export function buildDaySlots() {
  const slots = []
  for (let m = DAY_START_MINUTES; m <= LAST_SLOT_MINUTES; m += SLOT_MINUTES) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

// Huecos libres de un día: quita los ocupados y, si la fecha es hoy, los que ya pasaron.
export function freeSlotsFor(date, takenSlots) {
  const nowTime = nowBogota().slice(11, 16)
  const isToday = date === todayBogota()
  return buildDaySlots().filter(
    (time) => !takenSlots.includes(time) && (!isToday || time > nowTime),
  )
}

export function formatDateLong(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// '14:20' -> '2:20 p. m.'
export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'p. m.' : 'a. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}
