import { useState } from 'react';
import { IonButton, IonContent, IonInput, IonItem, IonPage } from '@ionic/react';
import { motion } from 'motion/react';
import { Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const ok = login(username.trim(), password);
    setLoading(false);
    if (!ok) {
      setError('Identifiants incorrects. Veuillez réessayer.');
      toast.error('Connexion échouée');
    } else {
      toast.success('Connexion réussie');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="login-content">
        <div className="login-page">
          <motion.main className="login-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="login-brand-card" aria-label="Logo Astra">
              <div className="login-brand-icon">
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <path d="M50 10 88 88 50 70 12 88 50 10Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" />
                  <path d="M30 63 50 28 70 63" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M38 54h24" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <h1 className="login-title">Astra</h1>
            <p className="login-subtitle">Gestion Scolaire &amp; Administrative</p>

            <section className="login-card" aria-labelledby="login-heading">
              <h2 id="login-heading" className="login-card-title">Connexion</h2>
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <User className="login-field-icon" aria-hidden="true" />
                  <IonItem lines="none" className="login-input">
                    <IonInput type="text" value={username} onIonInput={(event) => setUsername(event.detail.value ?? '')} placeholder="Nom d'utilisateur" autocomplete="username" required />
                  </IonItem>
                </div>

                <div className="relative">
                  <Lock className="login-field-icon" aria-hidden="true" />
                  <IonItem lines="none" className="login-input">
                    <IonInput type={showPass ? 'text' : 'password'} value={password} onIonInput={(event) => setPassword(event.detail.value ?? '')} placeholder="Mot de passe" autocomplete="current-password" required />
                  </IonItem>
                  <button type="button" className="login-password-toggle" onClick={() => setShowPass((value) => !value)} aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    {showPass ? <EyeOff /> : <Eye />}
                  </button>
                </div>

                {error && <div className="login-error" role="alert">{error}</div>}

                <IonButton type="submit" expand="block" className="login-submit" disabled={loading}>
                  {loading ? 'Connexion...' : <>Se connecter <ArrowRight aria-hidden="true" /></>}
                </IonButton>
              </form>
            </section>

            <p className="login-footer">Astra • Système de Gestion Scolaire</p>
          </motion.main>
        </div>
      </IonContent>
    </IonPage>
  );
}
