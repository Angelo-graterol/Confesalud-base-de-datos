import { useEffect, useMemo, useState } from 'react'
import { STATUS_LABELS } from '../../lib/labels'
import { averageByDoctor, formatDays, summarize } from '../../lib/waitTimes'
import { getAuditLog, getDoctorsWithSpecialties, getWaitTimes } from '../../services/admin'
import { fullName } from '../../services/clients'

const FIELD_LABELS = {
  assignment_date: 'Fecha asignada',
  appointment_status: 'Estado',
  arrival_time: 'Hora de llegada',
  channel: 'Canal',
  observation: 'Nota',
  dtr_id: 'Médico (id)',
  stf_id: 'Funcionario (id)',
  mor_id: 'Orden (id)',
  cet_id: 'Paciente (id)',
  request_date: 'Fecha de solicitud',
}

const OPERATION_LABELS = { INSERT: 'Creada', UPDATE: 'Modificada', DELETE: 'Eliminada' }

export default function AdminAudit() {
  return (
    <div className="stack">
      <WaitTimes />
      <AuditLog />
    </div>
  )
}

function WaitTimes() {
  const [filters, setFilters] = useState({ from: '', to: '', status: '' })
  const [appointments, setAppointments] = useState(null) // null = cargando
  const [doctors, setDoctors] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getDoctorsWithSpecialties().then(setDoctors).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    getWaitTimes(filters)
      .then((rows) => {
        if (cancelled) return
        setAppointments(rows)
        setError('')
      })
      .catch(() => !cancelled && setError('No pudimos calcular los tiempos.'))
    return () => {
      cancelled = true
    }
  }, [filters])

  function updateFilter(name, value) {
    setAppointments(null)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  const summary = useMemo(() => (appointments ? summarize(appointments) : null), [appointments])
  const byDoctor = useMemo(() => (appointments ? averageByDoctor(appointments) : []), [appointments])
  const doctorName = (id) => {
    const doctor = doctors.find((d) => d.id === id)
    return doctor ? fullName(doctor) : `Médico #${id}`
  }
  const maxBucket = summary ? Math.max(...summary.buckets.map((b) => b.count)) : 0

  return (
    <section className="card" aria-labelledby="wait-title">
      <h1 id="wait-title">Tiempos de oportunidad</h1>
      <p className="muted">
        Días que pasan entre que el paciente solicita la cita y la fecha en que se le asigna.
      </p>

      <div className="filters-grid">
        <div className="field">
          <label htmlFor="w-from">Solicitadas desde</label>
          <input id="w-from" type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="w-to">Solicitadas hasta</label>
          <input id="w-to" type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="w-status">Estado</label>
          <select id="w-status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {appointments === null && !error && <p className="muted">Calculando…</p>}
      {appointments && !summary && <p className="muted">No hay citas con estos filtros.</p>}

      {summary && (
        <>
          <dl className="stats">
            <div><dt>Citas</dt><dd>{summary.count}</dd></div>
            <div><dt>Espera promedio</dt><dd>{formatDays(summary.average)} días</dd></div>
            <div><dt>Mediana</dt><dd>{formatDays(summary.median)} días</dd></div>
            <div><dt>Espera máxima</dt><dd>{formatDays(summary.max)} días</dd></div>
          </dl>

          <h2>Distribución</h2>
          <ul className="bars">
            {summary.buckets.map((bucket) => (
              <li key={bucket.label}>
                <span className="bar-label">{bucket.label}</span>
                <span className="bar-track" aria-hidden="true">
                  <span
                    className="bar-fill"
                    style={{ width: maxBucket ? `${(bucket.count / maxBucket) * 100}%` : 0 }}
                  />
                </span>
                <span className="bar-value">
                  {bucket.count} <span className="muted">({Math.round((bucket.count / summary.count) * 100)} %)</span>
                </span>
              </li>
            ))}
          </ul>

          <h2>Espera promedio por médico</h2>
          <ul className="rank">
            {byDoctor.map((row) => (
              <li key={row.doctorId}>
                <span>{doctorName(row.doctorId)}</span>
                <span className="muted small">{row.count} citas</span>
                <strong>{formatDays(row.average)} días</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function AuditLog() {
  const [filters, setFilters] = useState({ aptId: '', operation: '' })
  const [result, setResult] = useState(null) // null = cargando
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    getAuditLog(filters)
      .then((data) => {
        if (cancelled) return
        setResult(data)
        setError('')
      })
      .catch(() => !cancelled && setError('No pudimos consultar la auditoría.'))
    return () => {
      cancelled = true
    }
  }, [filters])

  function updateFilter(name, value) {
    setResult(null)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  return (
    <section className="card" aria-labelledby="audit-title">
      <h2 id="audit-title">Registro de cambios en las citas</h2>
      <p className="muted">
        Cada vez que se crea, modifica o elimina una cita, la base de datos guarda el cambio.
      </p>

      <div className="filters-grid">
        <div className="field">
          <label htmlFor="a-apt">Número de cita</label>
          <input
            id="a-apt"
            inputMode="numeric"
            value={filters.aptId}
            onChange={(e) => updateFilter('aptId', e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="field">
          <label htmlFor="a-op">Operación</label>
          <select id="a-op" value={filters.operation} onChange={(e) => updateFilter('operation', e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(OPERATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {result === null && !error && <p className="muted">Cargando…</p>}
      {result && (
        <>
          <p className="muted small" aria-live="polite">
            {result.total === 0
              ? 'No hay registros con estos filtros.'
              : `Mostrando los ${result.rows.length} más recientes de ${result.total} registros.`}
          </p>
          <ul className="audit-list">
            {result.rows.map((row) => (
              <li key={row.id}>
                <div className="audit-head">
                  <strong>Cita #{row.apt_id}</strong>
                  <span className={`badge badge-${row.operation === 'DELETE' ? 'cancelada' : row.operation === 'UPDATE' ? 'programada' : 'atendida'}`}>
                    {OPERATION_LABELS[row.operation]}
                  </span>
                  <span className="muted small">{formatTimestamp(row.changed_at)} · {row.changed_by}</span>
                </div>
                <AuditChanges row={row} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function AuditChanges({ row }) {
  if (row.operation === 'INSERT') {
    return <p className="small">Cita creada para el {formatValue(row.new_data.assignment_date)}.</p>
  }
  if (row.operation === 'DELETE') {
    return <p className="small">Cita eliminada (estaba para el {formatValue(row.old_data.assignment_date)}).</p>
  }
  const changed = Object.keys(row.new_data).filter(
    (key) => JSON.stringify(row.old_data[key]) !== JSON.stringify(row.new_data[key]),
  )
  return (
    <ul className="changes small">
      {changed.map((key) => (
        <li key={key}>
          {FIELD_LABELS[key] ?? key}: <span className="muted">{formatValue(row.old_data[key])}</span> →{' '}
          <strong>{formatValue(row.new_data[key])}</strong>
        </li>
      ))}
    </ul>
  )
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}T/.test(text) ? text.slice(0, 16).replace('T', ' ') : text
}

function formatTimestamp(value) {
  return new Date(value).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' })
}
