import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ArrowRight, BadgeCheck, CircleAlert, Info, ShieldCheck } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { ROLE_LABELS } from '../../lib/labels'
import { fullName } from '../../services/clients'
import { getActiveStaff } from '../../services/admin'

// Entrada al panel: sin funcionario elegido muestra el selector; con funcionario, las pestañas.
export default function AdminGate() {
  const { staff, setStaff } = useStaff()
  if (!staff) return <StaffPicker onPick={setStaff} />

  return (
    <div className="stack">
      <div className="admin-bar">
        <nav className="nav" aria-label="Panel administrativo">
          <NavLink to="/admin/citas">Citas</NavLink>
          <NavLink to="/admin/pacientes">Pacientes</NavLink>
          <NavLink to="/admin/medicos">Médicos</NavLink>
          <NavLink to="/admin/auditoria">Auditoría</NavLink>
        </nav>
        <div className="patient-chip">
          <span className="chip-avatar" aria-hidden="true"><BadgeCheck size={16} /></span>
          <span>{fullName(staff)} · {ROLE_LABELS[staff.staff_role]}</span>
          <button type="button" className="link-button" onClick={() => setStaff(null)}>
            Salir
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}

function StaffPicker({ onPick }) {
  const [staffList, setStaffList] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getActiveStaff()
      .then(setStaffList)
      .catch(() => setError('No pudimos cargar el personal.'))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    const picked = staffList?.find((s) => String(s.id) === selectedId)
    if (!picked) {
      setError('Selecciona un funcionario.')
      return
    }
    onPick(picked)
  }

  return (
    <section className="hero card">
      <span className="hero-icon" aria-hidden="true">
        <ShieldCheck size={28} />
      </span>
      <p className="eyebrow">Personal administrativo</p>
      <h1>Panel administrativo</h1>
      <p className="lead">
        Elige quién eres para que las cancelaciones y reasignaciones queden a tu nombre.
      </p>
      <form onSubmit={handleSubmit} className="form" noValidate>
        <div className="field">
          <label htmlFor="staff">Funcionario</label>
          <select id="staff" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Selecciona un funcionario</option>
            {(staffList ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {fullName(s)} · {ROLE_LABELS[s.staff_role]}
              </option>
            ))}
          </select>
        </div>
        <p className="note">
          <Info size={18} aria-hidden="true" />
          Demostración académica: la base de datos no tiene inicio de sesión, por eso no se pide contraseña.
        </p>
        {error && (
          <p className="alert alert-error" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            {error}
          </p>
        )}
        <button type="submit" className="button button-block">
          Entrar al panel
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>
    </section>
  )
}
