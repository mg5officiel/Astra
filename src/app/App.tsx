import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { AppProvider, useApp } from '../contexts/AppContext';
import LoginPage from './pages/LoginPage';
import { Layout } from './components/Layout';
import { LicenceModal } from '../licence/LicenceModal';
import { checkLicence } from '../licence/licenceVerifier';
import type { LicenceStatus } from '../licence/types';
import { IonicShell } from './components/IonicShell';

function AppContent() {
  const { currentUser } = useApp();
  const [licenceStatus, setLicenceStatus] = useState<LicenceStatus>({ status: 'checking' });
  useEffect(() => {
    if (!currentUser) { setLicenceStatus({ status: 'checking' }); return; }
    checkLicence().then(setLicenceStatus);
  }, [currentUser]);
  const handleActivated = () => { checkLicence().then(setLicenceStatus); };
  if (!currentUser) return <LoginPage />;
  if (licenceStatus.status === 'checking') return <div className="fixed inset-0 flex items-center justify-center"><p>Vérification de la licence…</p></div>;
  if (licenceStatus.status !== 'valid') return <LicenceModal onActivated={handleActivated} />;
  return <Layout />;
}
export default function App() {
  return <AppProvider><IonicShell><AppContent /></IonicShell><Toaster position="top-right" /></AppProvider>;
}
