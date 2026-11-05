import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePatient } from '../context/PatientContext'
import { DOCUMENT_TYPES, checkEligibility, findClientByDocument } from '../services/clients'

export default function Home() {
  const { setPatient } = usePatient()
  const navigate = useNavigate()
  const [documentType, setDocumentType] = useState('CC')
  const [documentNumber, setDocumentNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!documentNumber.trim()) {
      setError('Escribe el número de documento.')
      return
    }
    setLoading(true)
    try {
      const client = await findClientByDocument(documentType, documentNumber)
      if (!client) {
        setError('No encontramos un paciente con ese documento.')
        return
      }
      const eligibility = checkEligibility(client)
      if (!eligibility.ok) {
        setError(eligibility.message)
        return
      }
      setPatient(client)
      navigate('/agendar')
    } catch {
      setError('No pudimos consultar la base de datos. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="hero card">
      <p className="eyebrow">Gestión de citas</p>
      <h1>Agenda tu cita médica con calma</h1>
      <p className="lead">
        Ingresa tu documento para ver tus datos y elegir especialidad, médico y horario.
      </p>

      <form onSubmit={handleSubmit} className="form" noValidate>
        <div className="field">
          <label htmlFor="document-type">Tipo de documento</label>
          <select
            id="document-type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.value} · {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="document-number">Número de documento</label>
          <input
            id="document-number"
            inputMode="numeric"
            autoComplete="off"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'home-error' : undefined}
          />
        </div>

        {error && (
          <p id="home-error" className="alert alert-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Buscando…' : 'Continuar'}
        </button>
      </form>
      <p className="hint staff-link">
        ¿Eres personal de la IPS? <Link to="/admin">Entrar al panel administrativo</Link>
      </p>
    </section>
  )
}
