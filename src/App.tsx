import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthProvider } from './lib/auth'
import { AccountPage } from './pages/AccountPage'
import { AdminTrainingPage } from './pages/AdminTrainingPage'
import { AuthVerifyPage } from './pages/AuthVerifyPage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { JoinPage } from './pages/JoinPage'
import { LoginPage } from './pages/LoginPage'
import { PostJobPage } from './pages/PostJobPage'
import { ProviderCalendarPage } from './pages/ProviderCalendarPage'
import { ProviderDetailPage } from './pages/ProviderDetailPage'
import { ProviderJobsPage } from './pages/ProviderJobsPage'
import { ProvidersPage } from './pages/ProvidersPage'
import { TrainingPage } from './pages/TrainingPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="post-job" element={<PostJobPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="providers" element={<ProvidersPage />} />
            <Route path="providers/:id" element={<ProviderDetailPage />} />
            <Route path="provider/jobs" element={<ProviderJobsPage />} />
            <Route path="provider/calendar" element={<ProviderCalendarPage />} />
            <Route path="join" element={<JoinPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="auth/verify" element={<AuthVerifyPage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="admin/training" element={<AdminTrainingPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
