import { useState } from 'react'

const MIN_REASON_LENGTH = 5

// Formulario de cancelación compartido por "Mis citas" y el panel administrativo.
// onSubmit(reason) hace la cancelación; si lanza un error, se muestra aquí.
export default function CancelForm({ appointmentId, onSubmit, onStop, onDone }) {
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
      await onSubmit(reason)
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
