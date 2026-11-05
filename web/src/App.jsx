import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext'
import { StaffProvider } from './context/StaffContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import MyAppointments from './pages/MyAppointments'
import AdminGate from './pages/admin/AdminGate'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminPatients from './pages/admin/AdminPatients'
import AdminDoctors from './pages/admin/AdminDoctors'

export default function App() {
  return (
    <PatientProvider>
      <StaffProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/agendar" element={<Schedule />} />
              <Route path="/mis-citas" element={<MyAppointments />} />
              <Route path="/admin" element={<AdminGate />}>
                <Route index element={<Navigate to="citas" replace />} />
                <Route path="citas" element={<AdminAppointments />} />
                <Route path="pacientes" element={<AdminPatients />} />
                <Route path="medicos" element={<AdminDoctors />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </StaffProvider>
    </PatientProvider>
  )
}
