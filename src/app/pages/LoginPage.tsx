import { useState } from 'react';
import { IonButton, IonContent, IonInput, IonItem, IonLabel, IonPage } from '@ionic/react';
import { motion } from 'motion/react';
import { Monitor, Lock, User, Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { toast } from 'sonner';

export default function LoginPage() {
	const { login } = useApp();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [showPass, setShowPass] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		await new Promise(r => setTimeout(r, 600));
		const ok = login(username.trim(), password);
		setLoading(false);
		if (!ok) {
			setError('Identifiants incorrects. Veuillez réessayer.');
			toast.error('Connexion échouée');
		} else {
			toast.success('Connexion réussie !');
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
			{/* Background blobs */}
			<div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
			<div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

			<motion.div
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: 'easeOut' }}
				className="max-w-md"
			>
				{/* Logo card */}
				<div className="max-w-xs bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl">
					{/* Header */}
					<div className="text-center mb-3">
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.2, type: 'spring' }}
							className="inline-flex items-center justify-center w-15 h-15 bg-indigo-600/80 backdrop-blur rounded-2xl mb-1 shadow-lg"
						>
							<Monitor className="w-6 h-6 text-white" />
						</motion.div>
						<h1 className="text-xl text-white mb-1">GESTION CYBER</h1>
						<p className="text-indigo-200 text-xs">Librairie Papeterie Doumbiala</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className="space-y-3">
						<div>
							<IonLabel position="stacked" className="text-xs text-indigo-200 mb-1 block">Nom d'utilisateur</IonLabel>
							<div className="relative">
								<User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
								<IonItem lines="none" className="login-field">
									<IonInput type="text" value={username} onIonInput={e => setUsername(e.detail.value ?? '')} placeholder="Votre identifiant" autocomplete="username" />
								</IonItem>
							</div>
						</div>

						<div>
							<IonLabel position="stacked" className="text-xs text-indigo-200 mb-1 block">Mot de passe</IonLabel>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
								<IonItem lines="none" className="login-field">
									<IonInput type={showPass ? 'text' : 'password'} value={password} onIonInput={e => setPassword(e.detail.value ?? '')} placeholder="Votre mot de passe" autocomplete="current-password" />
								</IonItem>
								<button
									type="button"
									onClick={() => setShowPass(!showPass)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition"
								>
									{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>

						{error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className="bg-red-500/20 border border-red-400/30 text-red-300 text-sm rounded-xl px-4 py-3"
							>
								{error}
							</motion.div>
						)}

						<IonButton type="submit" disabled={loading} expand="block" className="login-submit">
							{loading ? (
								<>
									<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									Connexion...
								</>
							) : (
								<>
									<Lock className="w-4 h-4" />
									Se connecter
								</>
							)}
						</IonButton>
					</form>

					<p className="text-center text-indigo-400/60 text-xs mt-2">
						© 2026 Astra-Sys. Tous droits réservés.
					</p>
				</div>
			</motion.div>
		</div>
	);
}
