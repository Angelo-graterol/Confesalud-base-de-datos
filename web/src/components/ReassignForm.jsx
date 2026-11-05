import { useEffect, useState } from 'react'
import { MAX_DAYS_AHEAD } from '../config'
import { addDays, formatTime, freeSlotsFor, todayBogota } from '../lib/dates'
import { reassignAppointment, getTakenSlots } from '../services/appointments'
import { fullName } from '../services/clients'

// Reasignar = cambiar médico y/o hueco de una cita programada. Solo se ofrecen médicos
// activos que comparten alguna especialidad con el médico original.
export default function ReassignForm({ appointment, doctors, staff, onStop, onDone }) {
  const current = doctors.find((d) => d.id === appointment.dtr_id)
  const currentSpecialtyIds = current?.specialties.map((s) => s.id) ?? []
  const candidates = doctors.filter(
    (d) =>
      d.id === appointment.dtr_id ||
      (d.doctor_status === 'ACTIVO' && d.specialties.some((s) => currentSpecialtyIds.includes(s.id))),
  )

  const [doctorId, setDoctorId] = useState(String(appointment.dtr_id))
  const [date, setDate] = useState('')
  const [takenSlots, setTakenSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const today = todayBogota()
  const maxDate = addDays(today, MAX_DAYS_AHEAD)

  useEffect(() => {
    if (!doctorId || !date) return
    let cancelled = false
    getTakenSlots(doctorId, date)
      .then((list) => !cancelled && setTakenSlots(list))
      .catch(() => !cancelled && setError('No pudimos consultar los horarios.'))
    return () => {
      cancelled = true
    }
  }, [doctorId, date])

  const dateOk = date && date >= today && date <= maxDate
  const freeSlots = dateOk ? freeSlotsFor(date, takenSlots) : []
  const idPrefix = `reassign-${appointment.id}`

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!dateOk || !slot) {
      setError('Elige una fecha futura y un horario libre.')
      return
    }
    setSubmitting(true)
    try {
      await reassignAppointment({
        appointment,
        doctorId: Number(doctorId),
        date,
        time: slot,
        staff,
      })
      onDone()
    } catch (err) {
      setError(err.message || 'No pudimos reasignar la cita.')
      setSubmitting(false)
      getTakenSlots(doctorId, date).then(setTakenSlots).catch(() => {})
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form cancel-form" noValidate>
      <div className="field">
        <label htmlFor={`${idPrefix}-doctor`}>Médico</label>
        <select
          id={`${idPrefix}-doctor`}
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value)
            setTakenSlots([])
            setSlot('')
          }}
        >
          {candidates.map((d) => (
            <option key={d.id} value={d.id}>{fullName(d)}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-date`}>Nueva fecha</label>
        <input
          id={`${idPrefix}-date`}
          type="date"
          min={today}
          max={maxDate}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setTakenSlots([])
            setSlot('')
          }}
        />
      </div>

      {dateOk && (
        <fieldset className="field">
          <legend>Nuevo horario</legend>
          {freeSlots.length === 0 ? (
            <p className="hint">No quedan horarios libres ese día.</p>
          ) : (
            <div className="slots">
              {freeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`slot${slot === time ? ' slot-selected' : ''}`}
                  aria-pressed={slot === time}
                  onClick={() => setSlot(time)}
                >
                  {formatTime(time)}
                </button>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="actions">
        <button type="submit" className="button" disabled={submitting || !slot}>
          {submitting ? 'Reasignando…' : 'Confirmar reasignación'}
        </button>
        <button type="button" className="button button-ghost" onClick={onStop} disabled={submitting}>
          Cerrar
        </button>
      </div>
    </form>
  )
}
