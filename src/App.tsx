import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/login/LoginPage'
import NewContractPage from './pages/register/NewContractPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/subscribe" element={<NewContractPage />} />
    </Routes>
  )
}
