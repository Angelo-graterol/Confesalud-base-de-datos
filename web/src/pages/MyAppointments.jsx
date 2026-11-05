import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { usePatient } from '../context/PatientContext'
import { formatDateLong, formatTime, nowBogota } from '../lib/dates'
import { cancelAppointment, getClientAppointments } from '../services/appointments'
import { fullName } from '../services/clients'

const STATUS_LABELS = {
  PROGRAMADA: 'Programada',
  ATENDIDA: 'Atendida',
  CANCELADA: 'Cancelada',
  INASISTENCIA: 'Inasistencia',
}

const CANCELLED_BY_LABELS = {
  PACIENTE: 'el paciente',
  MEDICO: 'el médico',
  ADMINISTRATIVO: 'el personal administrativo',
}

const MIN_REASON_LENGTH = 5

export default function MyAppointments() {
  const { patient } = usePatient()
  const [appointments, setAppointments] = useState(null) // null = cargando
  const [loadError, setLoadError] = useState('')
  const [cancelingId, setCancelingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!patient) return
    let cancelled = false
    getClientAppointments(patient.id)
      .then((list) => {
        if (cancelled) return
        setAppointments(list)
        setLoadError('')
      })
      .catch(() => !cancelled && setLoadError('No pudimos cargar tus citas. Intenta de nuevo.'))
    return () => {
      cancelled = true
    }
  }, [patient, reloadKey])

  if (!patient) return <Navigate to="/" replace />

  const now = nowBogota()
  const isUpcoming = (a) => a.appointment_status === 'PROGRAMADA' && a.assignment_date >= now
  const upcoming = (appointments ?? []).filter(isUpcoming).reverse()
  const history = (appointments ?? []).filter((a) => !isUpcoming(a))

  return (
    <div className="stack">
      <section className="card">
        <p className="eyebrow">Paciente</p>
        <h1>Mis citas</h1>
        <p className="lead">{fullName(patient)}</p>
        <Link to="/agendar" className="button button-inline">Agendar una cita</Link>
      </section>

      {loadError && <p className="alert alert-error" role="alert">{loadError}</p>}
      {appointments === null && !loadError && <p className="muted">Cargando tus citas…</p>}

      {appointments && (
        <>
          <section aria-labelledby="upcoming-title" className="stack">
            <h2 id="upcoming-title">Próximas</h2>
            {upcoming.length === 0 && (
              <p className="card muted">No tienes citas próximas programadas.</p>
            )}
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                appointment={a}
                canCancel
                canceling={cancelingId === a.id}
                onStartCancel={() => setCancelingId(a.id)}
                onStopCancel={() => setCancelingId(null)}
                onCancelled={() => {
                  setCancelingId(null)
                  setReloadKey((key) => key + 1)
                }}
              />
            ))}
          </section>

          <section aria-labelledby="history-title" className="stack">
            <h2 id="history-title">Historial</h2>
            {history.length === 0 && <p className="card muted">Aún no tienes historial de citas.</p>}
            {history.map((a) => (
              <AppointmentCard key={a.id} appointment={a} />
            ))}
          </section>
        </>
      )}
    </div>
  )
}

function AppointmentCard({ appointment: a, canCancel, canceling, onStartCancel, onStopCancel, onCancelled }) {
  const [date, time] = a.assignment_date.split('T')
  const cancellation = a.cancellations?.[0] ?? a.cancellations ?? null

  return (
    <article className="card appointment">
      <div className="appointment-head">
        <div>
          <h3>{formatDateLong(date)}</h3>
          <p className="appointment-time">{formatTime(time.slice(0, 5))}</p>
        </div>
        <span className={`badge badge-${a.appointment_status.toLowerCase()}`}>
          {STATUS_LABELS[a.appointment_status]}
        </span>
      </div>

      <p className="appointment-doctor">{a.doctors ? fullName(a.doctors) : 'Médico sin datos'}</p>
      <p className="muted small">
        Cita #{a.id}
        {a.medical_orders && ` · Orden ${a.medical_orders.order_number}`}
      </p>

      {a.appointment_status === 'CANCELADA' && cancellation?.reason && (
        <p className="muted small">
          Cancelada por {CANCELLED_BY_LABELS[cancellation.cancelled_by] ?? cancellation.cancelled_by}:
          {' '}«{cancellation.reason}»
        </p>
      )}

      {canCancel && !canceling && (
        <button type="button" className="button button-ghost" onClick={onStartCancel}>
          Cancelar cita
        </button>
      )}
      {canCancel && canceling && (
        <CancelForm appointmentId={a.id} onStop={onStopCancel} onDone={onCancelled} />
      )}
    </article>
  )
}

function CancelForm({ appointmentId, onStop, onDone }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(`Escribe el motivo de la cancelación (mínimo ${MIN_REASON_LENGTH} letras).`)
      return
    }
    setSubmitting(true)
    try {
      await cancelAppointment({ appointmentId, reason })
      onDone()
    } catch (err) {
      setError(err.message || 'No pudimos cancelar la cita. Intenta de nuevo.')
      setSubmitting(false)
    }
  }

  const fieldId = `reason-${appointmentId}`

  return (
    <form onSubmit={handleSubmit} className="form cancel-form" noValidate>
      <div className="field">
        <label htmlFor={fieldId}>Motivo de la cancelación</label>
        <textarea
          id={fieldId}
          rows={3}
          maxLength={200}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <p className="hint">Al cancelar, el horario queda libre para otros pacientes.</p>
      </div>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      <div className="actions">
        <button type="submit" className="button button-danger" disabled={submitting}>
          {submitting ? 'Cancelando…' : 'Confirmar cancelación'}
        </button>
        <button type="button" className="button button-ghost" onClick={onStop} disabled={submitting}>
          Mantener cita
        </button>
      </div>
    </form>
  )
}
