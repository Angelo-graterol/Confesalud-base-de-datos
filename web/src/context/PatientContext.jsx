import { createContext, useContext, useState } from 'react'

const PatientContext = createContext(null)
const STORAGE_KEY = 'confesalud.patient'

// El paciente identificado se guarda en sessionStorage para que sobreviva a recargar
// la página (se borra al cerrar la pestaña). No hay login: la BD no tiene autenticación.
function readStoredPatient() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function PatientProvider({ children }) {
  const [patient, setPatientState] = useState(readStoredPatient)

  function setPatient(next) {
    setPatientState(next)
    try {
      if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // sin almacenamiento disponible: la sesión vive solo en memoria
    }
  }

  return <PatientContext.Provider value={{ patient, setPatient }}>{children}</PatientContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePatient() {
  return useContext(PatientContext)
}
