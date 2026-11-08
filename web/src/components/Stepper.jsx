import { Check } from 'lucide-react'

// Indicador de pasos. `current` es el índice (0..n-1) del paso en curso;
// los anteriores se marcan como hechos.
export default function Stepper({ steps, current }) {
  return (
    <ol className="stepper" aria-label="Pasos para agendar">
      {steps.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'pending'
        return (
          <li
            key={label}
            className={`step step-${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="step-dot" aria-hidden="true">
              {state === 'done' ? <Check size={16} strokeWidth={3} /> : index + 1}
            </span>
            <span>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
