// ============================================================
// App.tsx — Main application with routing
// ============================================================
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import LandSearchPage from './pages/LandSearchPage';
import LandProfilePage from './pages/LandProfilePage';
import DeedVerificationPage from './pages/DeedVerificationPage';
import MutationPage from './pages/MutationPage';
import TrackApplicationPage from './pages/TrackApplicationPage';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PublicViewPage from './pages/PublicViewPage';

import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/search" element={<LandSearchPage />} />
              <Route path="/land/:id" element={<LandProfilePage />} />
              <Route path="/land/:id/public" element={<PublicViewPage />} />
              <Route path="/deed-verify" element={<DeedVerificationPage />} />
              <Route path="/mutation" element={<MutationPage />} />
              <Route path="/track" element={<TrackApplicationPage />} />
              <Route path="/track/:appId" element={<TrackApplicationPage />} />
              
              {/* Role-protected routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/*"
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
