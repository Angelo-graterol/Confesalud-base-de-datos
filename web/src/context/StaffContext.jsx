import { createContext, useContext, useState } from 'react'

const StaffContext = createContext(null)
const STORAGE_KEY = 'confesalud.staff'

// El funcionario que opera el panel administrativo. La BD no tiene login, así que se
// elige de la lista de funcionarios activos (sin contraseña) y se guarda en sessionStorage.
function readStoredStaff() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function StaffProvider({ children }) {
  const [staff, setStaffState] = useState(readStoredStaff)

  function setStaff(next) {
    setStaffState(next)
    try {
      if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // sin almacenamiento disponible: la sesión vive solo en memoria
    }
  }

  return <StaffContext.Provider value={{ staff, setStaff }}>{children}</StaffContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStaff() {
  return useContext(StaffContext)
}
