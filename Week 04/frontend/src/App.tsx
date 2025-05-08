import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import VerificationPage from './pages/VerificationPage';
import TestIntegration from './pages/TestIntegration';
import Profile from './pages/Profile';
import Features from './pages/Features';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MFAVerification from './pages/MFAVerification';
import MFASetup from './pages/MFASetup';
import './styles/global.css';
import './styles/pages/mfa.css'; // Import MFA styles

function App() {
  console.log('App component rendering');
  
  return (
    <AuthProvider>
      <div className="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/features" element={<Features />} />
            <Route path="/test-integration" element={<TestIntegration />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/verify" 
              element={
                <ProtectedRoute>
                  <VerificationPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/mfa-verification" element={<MFAVerification />} />
            <Route path="/mfa-verify" element={<MFAVerification />} />
            <Route path="/mfa-setup" element={<MFASetup />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
