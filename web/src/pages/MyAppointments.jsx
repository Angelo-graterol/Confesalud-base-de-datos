import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CircleAlert,
  History,
} from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import { formatDateLong, formatTime, nowBogota } from '../lib/dates'
import { cancelAppointment, getClientAppointments } from '../services/appointments'
import { fullName } from '../services/clients'
import { CANCELLED_BY_LABELS, STATUS_LABELS } from '../lib/labels'
import CancelForm from '../components/CancelForm'

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
      <section className="card header-row">
        <div className="card-title">
          <span className="title-icon" aria-hidden="true"><CalendarCheck size={22} /></span>
          <div>
            <h1>Mis citas</h1>
            <p className="overline">{fullName(patient)}</p>
          </div>
        </div>
        <Link to="/agendar" className="button">
          <CalendarPlus size={18} aria-hidden="true" />
          Agendar una cita
        </Link>
      </section>

      {loadError && (
        <p className="alert alert-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          {loadError}
        </p>
      )}
      {appointments === null && !loadError && <p className="muted">Cargando tus citas…</p>}

      {appointments && (
        <>
          <section aria-labelledby="upcoming-title" className="stack">
            <h2 id="upcoming-title" className="section-title">
              <CalendarClock size={22} aria-hidden="true" />
              Próximas
            </h2>
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
            <h2 id="history-title" className="section-title">
              <History size={22} aria-hidden="true" />
              Historial
            </h2>
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
        <button type="button" className="button button-danger-ghost" onClick={onStartCancel}>
          Cancelar cita
        </button>
      )}
      {canCancel && canceling && (
        <CancelForm
          appointmentId={a.id}
          onSubmit={(reason) => cancelAppointment({ appointmentId: a.id, reason })}
          onStop={onStopCancel}
          onDone={onCancelled}
        />
      )}
    </article>
  )
}
