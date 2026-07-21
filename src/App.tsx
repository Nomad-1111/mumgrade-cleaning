import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { JoinPage } from './pages/JoinPage'
import { PostJobPage } from './pages/PostJobPage'
import { ProviderDetailPage } from './pages/ProviderDetailPage'
import { ProvidersPage } from './pages/ProvidersPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="post-job" element={<PostJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="providers/:id" element={<ProviderDetailPage />} />
          <Route path="join" element={<JoinPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
