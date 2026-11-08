import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  Hash,
  Info,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import { usePatient } from '../context/PatientContext'
import Stepper from '../components/Stepper'
import {
  GENERAL_MEDICINE_ID,
  MAX_DAYS_AHEAD,
  OPEN_WEEKDAYS,
} from '../config'
import {
  addDays,
  formatDateLong,
  formatTime,
  freeSlotsFor,
  todayBogota,
  weekday,
} from '../lib/dates'
import { getActiveSpecialties, getDoctorsBySpecialty } from '../services/catalog'
import { fullName } from '../services/clients'
import { validateMedicalOrder } from '../services/orders'
import {
  clientHasActiveAppointmentOn,
  createAppointment,
  getTakenSlots,
} from '../services/appointments'

export default function Schedule() {
  const { patient } = usePatient()

  const [specialties, setSpecialties] = useState([])
  const [specialtyId, setSpecialtyId] = useState('')
  const [doctors, setDoctors] = useState(null) // null = todavía cargando
  const [doctorId, setDoctorId] = useState('')
  const [date, setDate] = useState('')
  const [takenSlots, setTakenSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [orderIssueDate, setOrderIssueDate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)

  const today = todayBogota()
  const maxDate = addDays(today, MAX_DAYS_AHEAD)
  const needsOrder = specialtyId !== '' && Number(specialtyId) !== GENERAL_MEDICINE_ID

  useEffect(() => {
    getActiveSpecialties()
      .then(setSpecialties)
      .catch(() => setError('No pudimos cargar las especialidades.'))
  }, [])

  useEffect(() => {
    if (!specialtyId) return
    let cancelled = false
    getDoctorsBySpecialty(specialtyId)
      .then((list) => !cancelled && setDoctors(list))
      .catch(() => !cancelled && setError('No pudimos cargar los médicos.'))
    return () => {
      cancelled = true
    }
  }, [specialtyId])

  useEffect(() => {
    if (!doctorId || !date) return
    let cancelled = false
    getTakenSlots(doctorId, date)
      .then((list) => !cancelled && setTakenSlots(list))
      .catch(() => !cancelled && setError('No pudimos consultar los horarios.'))
    return () => {
      cancelled = true
    }
  }, [doctorId, date])

  const dateProblem = useMemo(() => {
    if (!date) return ''
    if (date < today) return 'No se puede agendar en fechas pasadas.'
    if (date > maxDate) return `Solo se agenda hasta ${MAX_DAYS_AHEAD} días hacia adelante.`
    if (!OPEN_WEEKDAYS.includes(weekday(date))) return 'La IPS no atiende ese día.'
    return ''
  }, [date, today, maxDate])

  const freeSlots = useMemo(() => {
    if (!doctorId || !date || dateProblem) return []
    return freeSlotsFor(date, takenSlots)
  }, [doctorId, date, dateProblem, takenSlots])

  const selectedDoctor = doctors?.find((d) => String(d.id) === String(doctorId))
  const selectedSpecialty = specialties.find((s) => String(s.id) === String(specialtyId))

  if (!patient) return <Navigate to="/" replace />

  function resetFrom(step) {
    setError('')
    if (step <= 1) {
      setDoctors(null)
      setDoctorId('')
    }
    if (step <= 2) {
      setDate('')
      setTakenSlots([])
      setSlot('')
    }
    if (step <= 3) setSlot('')
  }

  function chooseSpecialty(value) {
    setSpecialtyId(value)
    resetFrom(1)
  }

  function chooseDoctor(value) {
    setDoctorId(value)
    resetFrom(2)
  }

  function chooseDate(value) {
    setDate(value)
    setTakenSlots([])
    resetFrom(3)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!specialtyId || !doctorId || !date || !slot) {
      setError('Completa especialidad, médico, fecha y hora.')
      return
    }
    if (dateProblem) {
      setError(dateProblem)
      return
    }
    if (needsOrder && (!orderNumber.trim() || !orderIssueDate)) {
      setError('Esta especialidad exige el número de la orden médica y su fecha de expedición.')
      return
    }

    setSubmitting(true)
    try {
      if (await clientHasActiveAppointmentOn(patient.id, date)) {
        setError('Ya tienes una cita programada ese día. Elige otra fecha.')
        return
      }

      let orderId = null
      if (needsOrder) {
        const result = await validateMedicalOrder(orderNumber, orderIssueDate)
        if (!result.ok) {
          setError(result.message)
          return
        }
        orderId = result.order.id
      }

      const appointment = await createAppointment({
        clientId: patient.id,
        doctorId: Number(doctorId),
        date,
        time: slot,
        orderId,
      })
      setCreated(appointment)
    } catch (err) {
      setError(err.message || 'No pudimos registrar la cita. Intenta de nuevo.')
      if (doctorId && date) getTakenSlots(doctorId, date).then(setTakenSlots).catch(() => {})
    } finally {
      setSubmitting(false)
    }
  }

  function scheduleAnother() {
    setCreated(null)
    setSpecialtyId('')
    setOrderNumber('')
    setOrderIssueDate('')
    resetFrom(1)
  }

  const steps = ['Especialidad', 'Médico', 'Fecha', 'Hora', needsOrder ? 'Orden médica' : 'Confirmar']
  const currentStep = !specialtyId ? 0 : !doctorId ? 1 : !date || dateProblem ? 2 : !slot ? 3 : 4

  if (created) {
    return (
      <section className="card confirmation" aria-live="polite">
        <span className="success-icon" aria-hidden="true">
          <Check size={36} strokeWidth={3} />
        </span>
        <p className="eyebrow">Cita programada</p>
        <h1>¡Listo, {patient.first_name}!</h1>
        <dl className="summary">
          <div><dt><Stethoscope size={16} aria-hidden="true" />Especialidad</dt><dd>{selectedSpecialty?.specialty_name}</dd></div>
          <div><dt><UserRound size={16} aria-hidden="true" />Médico</dt><dd>{selectedDoctor && fullName(selectedDoctor)}</dd></div>
          <div><dt><CalendarDays size={16} aria-hidden="true" />Fecha</dt><dd>{formatDateLong(date)}</dd></div>
          <div><dt><Clock size={16} aria-hidden="true" />Hora</dt><dd>{formatTime(slot)}</dd></div>
          <div><dt><Hash size={16} aria-hidden="true" />Código de cita</dt><dd>#{created.id}</dd></div>
        </dl>
        <p className="note">
          <Info size={18} aria-hidden="true" />
          Llega con 15 minutos de tolerancia máxima: pasado ese tiempo la cita se marca como incumplida.
        </p>
        <div className="actions">
          <Link to="/mis-citas" className="button">Ver mis citas</Link>
          <button type="button" className="button button-ghost" onClick={scheduleAnother}>
            Agendar otra cita
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="stack">
      <section className="card patient-card">
        <div className="card-title">
          <span className="title-icon" aria-hidden="true"><UserRound size={22} /></span>
          <div>
            <p className="overline">Paciente</p>
            <h1>{fullName(patient)}</h1>
          </div>
        </div>
        <dl className="summary summary-inline">
          <div><dt>Documento</dt><dd>{patient.document_type} {patient.document_number}</dd></div>
          <div><dt>EPS</dt><dd>{patient.eps?.eps_name}</dd></div>
          <div><dt>Régimen</dt><dd>{patient.regime}</dd></div>
          <div><dt>Ciudad</dt><dd>{patient.cities?.city_name}</dd></div>
          <div><dt>Afiliación</dt><dd>{patient.affiliation_status}</dd></div>
        </dl>
      </section>

      <form onSubmit={handleSubmit} className="card form" noValidate>
        <div className="card-title">
          <span className="title-icon" aria-hidden="true"><CalendarDays size={22} /></span>
          <h2>Agendar cita</h2>
        </div>

        <Stepper steps={steps} current={currentStep} />

        <div className="field">
          <label htmlFor="specialty">1. Especialidad</label>
          <select id="specialty" value={specialtyId} onChange={(e) => chooseSpecialty(e.target.value)}>
            <option value="">Selecciona una especialidad</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.specialty_name}</option>
            ))}
          </select>
        </div>

        {specialtyId && (
          <div className="field">
            <label htmlFor="doctor">2. Médico</label>
            <select id="doctor" value={doctorId} onChange={(e) => chooseDoctor(e.target.value)}>
              <option value="">Selecciona un médico</option>
              {(doctors ?? []).map((d) => (
                <option key={d.id} value={d.id}>{fullName(d)}</option>
              ))}
            </select>
            {doctors?.length === 0 && (
              <p className="hint">No hay médicos activos para esta especialidad.</p>
            )}
          </div>
        )}

        {doctorId && (
          <div className="field">
            <label htmlFor="date">3. Fecha</label>
            <input
              id="date"
              type="date"
              min={today}
              max={maxDate}
              value={date}
              onChange={(e) => chooseDate(e.target.value)}
            />
            {dateProblem && <p className="hint hint-error">{dateProblem}</p>}
          </div>
        )}

        {doctorId && date && !dateProblem && (
          <fieldset className="field">
            <legend>4. Hora (cada 20 minutos)</legend>
            {freeSlots.length === 0 ? (
              <p className="hint">No quedan horarios libres ese día. Prueba con otra fecha.</p>
            ) : (
              <div className="slots">
                {freeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`slot${slot === time ? ' slot-selected' : ''}`}
                    aria-pressed={slot === time}
                    onClick={() => setSlot(time)}
                  >
                    {formatTime(time)}
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        )}

        {needsOrder && slot && (
          <fieldset className="field order-box">
            <legend>5. Orden médica</legend>
            <p className="note">
              <Info size={18} aria-hidden="true" />
              Las citas con especialista exigen una orden o remisión vigente, expedida hace menos de 2 meses.
            </p>
            <div className="field">
              <label htmlFor="order-number">Número de orden</label>
              <input
                id="order-number"
                placeholder="OM-00003"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="order-issue">Fecha de expedición</label>
              <input
                id="order-issue"
                type="date"
                max={today}
                value={orderIssueDate}
                onChange={(e) => setOrderIssueDate(e.target.value)}
              />
            </div>
          </fieldset>
        )}

        {error && (
          <p className="alert alert-error" role="alert">
            <CircleAlert size={18} aria-hidden="true" />
            {error}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting || !slot}>
          {submitting ? 'Agendando…' : 'Confirmar cita'}
          {!submitting && <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </form>
    </div>
  )
}
