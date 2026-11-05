import { useEffect, useState } from 'react'
import { Stethoscope } from 'lucide-react'
import { getAllSpecialties, getDoctorsWithSpecialties } from '../../services/admin'
import { fullName } from '../../services/clients'

const STATUS_BADGES = { ACTIVO: 'atendida', INACTIVO: 'cancelada', VACACIONES: 'inasistencia' }

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState(null) // null = cargando
  const [specialties, setSpecialties] = useState([])
  const [specialtyId, setSpecialtyId] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDoctorsWithSpecialties(), getAllSpecialties()])
      .then(([doctorList, specialtyList]) => {
        setDoctors(doctorList)
        setSpecialties(specialtyList)
      })
      .catch(() => setError('No pudimos cargar los médicos.'))
  }, [])

  const shown = (doctors ?? []).filter(
    (d) =>
      (!status || d.doctor_status === status) &&
      (!specialtyId || d.specialties.some((s) => String(s.id) === specialtyId)),
  )

  return (
    <div className="stack">
      <section className="card">
        <div className="card-title">
          <span className="title-icon" aria-hidden="true"><Stethoscope size={22} /></span>
          <h1>Médicos</h1>
        </div>
        <div className="filters-grid">
          <div className="field">
            <label htmlFor="d-specialty">Especialidad</label>
            <select id="d-specialty" value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)}>
              <option value="">Todas</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.specialty_name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="d-status">Estado</label>
            <select id="d-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="ACTIVO">Activo</option>
              <option value="VACACIONES">Vacaciones</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>
      </section>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {doctors === null && !error && <p className="muted">Cargando médicos…</p>}

      {doctors && (
        <>
          <p className="muted small" aria-live="polite">
            {shown.length === 0 ? 'No hay médicos con estos filtros.' : `${shown.length} médicos.`}
          </p>
          <div className="doctor-grid">
            {shown.map((d) => (
              <article key={d.id} className="card doctor-card">
                <span className="avatar" aria-hidden="true">
                  {d.first_name[0]}{d.last_name[0]}
                </span>
                <p className="person-name">{fullName(d)}</p>
                <p className="small">
                  {d.specialties.length > 0 ? d.specialties.map((s) => s.name).join(' · ') : 'Sin especialidad'}
                </p>
                <p className="muted small">R.M. {d.medical_registration}</p>
                <p className="muted small">{d.document_type} {d.document_number}</p>
                <span className={`badge badge-${STATUS_BADGES[d.doctor_status]}`}>{d.doctor_status}</span>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
