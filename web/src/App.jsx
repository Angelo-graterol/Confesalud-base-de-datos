import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PatientProvider } from './context/PatientContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Schedule from './pages/Schedule'
import MyAppointments from './pages/MyAppointments'

export default function App() {
  return (
    <PatientProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/agendar" element={<Schedule />} />
            <Route path="/mis-citas" element={<MyAppointments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PatientProvider>
  )
}
