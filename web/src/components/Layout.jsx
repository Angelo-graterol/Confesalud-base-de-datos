import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { usePatient } from '../context/PatientContext'
import { fullName } from '../services/clients'

export default function Layout() {
  const { patient, setPatient } = usePatient()
  const navigate = useNavigate()

  function leave() {
    setPatient(null)
    navigate('/')
  }

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Consfesalud, inicio">
          <span className="brand-mark" aria-hidden="true">+</span>
          Consfesalud
        </Link>
        {patient && (
          <nav className="nav" aria-label="Principal">
            <NavLink to="/agendar">Agendar</NavLink>
            <NavLink to="/mis-citas">Mis citas</NavLink>
          </nav>
        )}
        {patient && (
          <div className="patient-chip">
            <span>{fullName(patient)}</span>
            <button type="button" className="link-button" onClick={leave}>
              Cambiar paciente
            </button>
          </div>
        )}
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">Consfesalud I.P.S. · Ocaña · Proyecto académico, datos de prueba</footer>
    </>
  )
}
