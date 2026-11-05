import { useEffect, useState } from 'react'
import CancelForm from '../../components/CancelForm'
import ReassignForm from '../../components/ReassignForm'
import { REASSIGN_ROLES } from '../../config'
import { useStaff } from '../../context/StaffContext'
import { addDays, formatDateLong, formatTime, nowBogota, todayBogota } from '../../lib/dates'
import { CANCELLED_BY_LABELS, STATUS_LABELS } from '../../lib/labels'
import { cancelAppointment } from '../../services/appointments'
import {
  getAllSpecialties,
  getDoctorsWithSpecialties,
  searchAppointments,
} from '../../services/admin'
import { fullName } from '../../services/clients'

export default function AdminAppointments() {
  const { staff } = useStaff()
  const today = todayBogota()

  const [filters, setFilters] = useState({
    from: today,
    to: addDays(today, 7),
    doctorId: '',
    specialtyId: '',
    status: '',
  })
  const [specialties, setSpecialties] = useState([])
  const [doctors, setDoctors] = useState([])
  const [result, setResult] = useState(null) // null = cargando
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [action, setAction] = useState(null) // { id, type: 'cancel' | 'reassign' }

  useEffect(() => {
    Promise.all([getAllSpecialties(), getDoctorsWithSpecialties()])
      .then(([specialtyList, doctorList]) => {
        setSpecialties(specialtyList)
        setDoctors(doctorList)
      })
      .catch(() => setError('No pudimos cargar los filtros.'))
  }, [])

  useEffect(() => {
    let cancelled = false
    searchAppointments(filters)
      .then((data) => {
        if (cancelled) return
        setResult(data)
        setError('')
      })
      .catch(() => !cancelled && setError('No pudimos consultar las citas.'))
    return () => {
      cancelled = true
    }
  }, [filters, reloadKey])

  function updateFilter(name, value) {
    setResult(null)
    setAction(null)
    setFilters((current) => {
      const next = { ...current, [name]: value }
      // Si el médico elegido no tiene la especialidad nueva, se quita el filtro de médico.
      if (name === 'specialtyId' && value && next.doctorId) {
        const doctor = doctors.find((d) => String(d.id) === next.doctorId)
        if (!doctor?.specialties.some((s) => String(s.id) === value)) next.doctorId = ''
      }
      return next
    })
  }

  function refresh() {
    setAction(null)
    setReloadKey((key) => key + 1)
  }

  const doctorOptions = filters.specialtyId
    ? doctors.filter((d) => d.specialties.some((s) => String(s.id) === filters.specialtyId))
    : doctors
  const canReassign = REASSIGN_ROLES.includes(staff.staff_role)
  const now = nowBogota()

  return (
    <div className="stack">
      <form className="card filters" onSubmit={(e) => e.preventDefault()}>
        <h1>Citas</h1>
        <div className="filters-grid">
          <div className="field">
            <label htmlFor="f-from">Desde</label>
            <input id="f-from" type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-to">Hasta</label>
            <input id="f-to" type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="f-specialty">Especialidad</label>
            <select id="f-specialty" value={filters.specialtyId} onChange={(e) => updateFilter('specialtyId', e.target.value)}>
              <option value="">Todas</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.specialty_name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-doctor">Médico</label>
            <select id="f-doctor" value={filters.doctorId} onChange={(e) => updateFilter('doctorId', e.target.value)}>
              <option value="">Todos</option>
              {doctorOptions.map((d) => (
                <option key={d.id} value={d.id}>{fullName(d)}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-status">Estado</label>
            <select id="f-status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {result === null && !error && <p className="muted">Cargando citas…</p>}

      {result && (
        <>
          <p className="muted small" aria-live="polite">
            {result.total === 0
              ? 'No hay citas con estos filtros.'
              : `Mostrando ${result.rows.length} de ${result.total} citas.`}
          </p>
          {result.rows.map((a) => {
            const [date, time] = a.assignment_date.split('T')
            const editable = a.appointment_status === 'PROGRAMADA' && a.assignment_date >= now
            const cancellation = a.cancellations
            return (
              <article key={a.id} className="card appointment">
                <div className="appointment-head">
                  <div>
                    <h3>{formatDateLong(date)}</h3>
                    <p className="appointment-time">{formatTime(time.slice(0, 5))}</p>
                  </div>
                  <span className={`badge badge-${a.appointment_status.toLowerCase()}`}>
                    {STATUS_LABELS[a.appointment_status]}
                  </span>
                </div>
                <p className="appointment-doctor">
                  {a.clients ? fullName(a.clients) : 'Paciente sin datos'}
                  <span className="muted small"> · {a.clients?.document_type} {a.clients?.document_number}</span>
                </p>
                <p>Con {a.doctors ? fullName(a.doctors) : 'médico sin datos'}</p>
                <p className="muted small">
                  Cita #{a.id} · {a.channel.toLowerCase()}
                  {a.medical_orders && ` · Orden ${a.medical_orders.order_number}`}
                </p>
                {a.observation && <p className="muted small">Nota: {a.observation}</p>}
                {a.appointment_status === 'CANCELADA' && cancellation?.reason && (
                  <p className="muted small">
                    Cancelada por {CANCELLED_BY_LABELS[cancellation.cancelled_by] ?? cancellation.cancelled_by}:
                    {' '}«{cancellation.reason}»
                  </p>
                )}

                {editable && action?.id !== a.id && (
                  <div className="actions">
                    <button type="button" className="button button-ghost" onClick={() => setAction({ id: a.id, type: 'cancel' })}>
                      Cancelar
                    </button>
                    {canReassign && (
                      <button type="button" className="button button-ghost" onClick={() => setAction({ id: a.id, type: 'reassign' })}>
                        Reasignar
                      </button>
                    )}
                  </div>
                )}
                {editable && action?.id === a.id && action.type === 'cancel' && (
                  <CancelForm
                    appointmentId={a.id}
                    onSubmit={(reason) =>
                      cancelAppointment({
                        appointmentId: a.id,
                        reason,
                        cancelledBy: 'ADMINISTRATIVO',
                        staffId: staff.id,
                      })
                    }
                    onStop={() => setAction(null)}
                    onDone={refresh}
                  />
                )}
                {editable && action?.id === a.id && action.type === 'reassign' && (
                  <ReassignForm
                    appointment={a}
                    doctors={doctors}
                    staff={staff}
                    onStop={() => setAction(null)}
                    onDone={refresh}
                  />
                )}
              </article>
            )
          })}
        </>
      )}
    </div>
  )
}
