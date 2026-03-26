import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import LandingPage from './pages/landing/LandingPage'
import LoginPage from './pages/login/LoginPage'
import NewContractPage from './pages/register/NewContractPage'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/subscribe" element={<NewContractPage />} />
      </Routes>
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        toastOptions={{
          classNames: {
            toast: 'bg-slate-800 border border-white/10 text-slate-100 text-sm',
          },
        }}
      />
    </>
  )
}
