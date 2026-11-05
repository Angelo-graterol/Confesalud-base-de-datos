import { useEffect, useState } from 'react'
import { searchClients } from '../../services/admin'
import { fullName } from '../../services/clients'

const GENDER_LABELS = { M: 'Masculino', F: 'Femenino', O: 'Otro' }

export default function AdminPatients() {
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null) // null = cargando
  const [error, setError] = useState('')

  // Espera un momento después de escribir para no consultar en cada tecla.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text), 300)
    return () => clearTimeout(timer)
  }, [text])

  useEffect(() => {
    let cancelled = false
    searchClients(query)
      .then((data) => {
        if (cancelled) return
        setResult(data)
        setError('')
      })
      .catch(() => !cancelled && setError('No pudimos consultar los pacientes.'))
    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <div className="stack">
      <section className="card">
        <h1>Pacientes</h1>
        <div className="field">
          <label htmlFor="patient-search">Buscar por documento o nombre</label>
          <input
            id="patient-search"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
          />
        </div>
      </section>

      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {result === null && !error && <p className="muted">Cargando pacientes…</p>}

      {result && (
        <>
          <p className="muted small" aria-live="polite">
            {result.total === 0
              ? 'No encontramos pacientes.'
              : `Mostrando ${result.rows.length} de ${result.total} pacientes.`}
          </p>
          {result.rows.map((c) => (
            <details key={c.id} className="card person">
              <summary>
                <span className="person-name">{fullName(c)}</span>
                <span className="muted small">{c.document_type} {c.document_number}</span>
                <span className={`badge badge-${c.affiliation_status === 'ACTIVO' ? 'atendida' : 'cancelada'}`}>
                  {c.affiliation_status}
                </span>
              </summary>
              <dl className="summary summary-inline">
                <div><dt>EPS</dt><dd>{c.eps?.eps_name}</dd></div>
                <div><dt>Régimen</dt><dd>{c.regime}</dd></div>
                <div><dt>Nacimiento</dt><dd>{c.birth_date}</dd></div>
                <div><dt>Género</dt><dd>{GENDER_LABELS[c.gender] ?? c.gender}</dd></div>
                <div><dt>Teléfono</dt><dd>{c.phone || '—'}</dd></div>
                <div><dt>Correo</dt><dd>{c.email || '—'}</dd></div>
                <div><dt>Dirección</dt><dd>{c.address || '—'}</dd></div>
                <div><dt>Ciudad</dt><dd>{c.cities?.city_name}</dd></div>
                <div><dt>Zona</dt><dd>{c.zone}</dd></div>
                <div><dt>Ocupación</dt><dd>{c.occupation || '—'}</dd></div>
                <div><dt>Nivel educativo</dt><dd>{c.education_level || '—'}</dd></div>
              </dl>
            </details>
          ))}
        </>
      )}
    </div>
  )
}
