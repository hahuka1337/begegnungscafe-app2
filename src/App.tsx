
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './services/store';
import { Layout, OnboardingModal, Button, Input } from './components/Shared';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import Groups from './pages/Groups';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Admin from './pages/Admin';
import RoomBookingPage from './pages/RoomBooking';
import CheckIn from './pages/CheckIn';
import Cafe from './pages/Cafe';
import Coworking from './pages/Coworking';

const Login = () => {
  const { login, signup } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name) {
          alert("Bitte Namen eingeben");
          setLoading(false);
          return;
        }
        await signup(email, password, name);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-stone-100">
        <h1 className="text-2xl font-bold text-primary-900 mb-2 text-center">{isLogin ? 'Anmelden' : 'Registrieren'}</h1>
        <p className="text-stone-500 text-center mb-6 text-sm">
            {isLogin ? 'Willkommen zurück im Begegnungscafé' : 'Werde Teil der Community'}
        </p>
        
        <div className="space-y-4">
          {!isLogin && (
              <Input 
                label="Dein Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Max Mustermann"
              />
          )}
          <Input 
            label="E-Mail" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="user@example.com"
            type="email"
          />
          <Input 
            label="Passwort" 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Lädt...' : (isLogin ? 'Einloggen' : 'Account erstellen')}
          </Button>
        </div>
        
        <div className="mt-4 text-center">
            <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-xs text-primary-600 hover:underline"
            >
                {isLogin ? 'Noch keinen Account? Registrieren' : 'Bereits registriert? Anmelden'}
            </button>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { currentUser, isLoading } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    // Onboarding logic
    try {
      const seen = localStorage.getItem('onboarding_seen');
      if (!seen) setShowOnboarding(true);
    } catch (e) {}
  }, []);

  if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50 text-primary-800">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-sm font-medium">Lade Begegnungscafé...</p>
        </div>
      );
  }

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem('onboarding_seen', 'true'); } catch (e) {}
  };

  return (
    <Layout>
      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cafe" element={<Cafe />} />
        <Route path="/coworking" element={<Coworking />} />
        <Route path="/events" element={<Events />} />
        <Route path="/groups" element={currentUser ? <Groups /> : <Navigate to="/login" />} />
        <Route path="/rooms" element={currentUser ? <RoomBookingPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:userId" element={currentUser ? <UserProfile /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/checkin" element={currentUser ? <CheckIn /> : <Navigate to="/login" />} />
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/impressum" element={<div className="p-4">Impressum Platzhalter</div>} />
        <Route path="/datenschutz" element={<div className="p-4">Datenschutzerklärung Platzhalter</div>} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
