import { IonContent, IonPage } from '@ionic/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
	Settings, Palette, Save, Download, Upload, Clock, RefreshCw,
	Camera, Lock, Eye, EyeOff, Bell, Database, Shield, CheckCircle,
	Cloud
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { THEMES } from '../../lib/themes';
import { downloadBackup, restoreFromFile, uploadBackupToGoogleDrive } from '../../lib/backup';
import { hashPassword, verifyPassword } from '../../lib/auth';
import { toast } from 'sonner';

export default function SettingsPage() {
	const { theme, themeName, setThemeName, backupConfig, updateBackupConfig, currentUser, updateCurrentUser } = useApp();
	const [backupInterval, setBackupInterval] = useState(backupConfig.intervalHours);
	const [autoBackup, setAutoBackup] = useState(backupConfig.autoBackupEnabled);
	const [restoring, setRestoring] = useState(false);
	const [confirmRestoreFile, setConfirmRestoreFile] = useState<File | null>(null);
	const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
	const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
	const fileRef = useRef<HTMLInputElement>(null);
	const avatarRef = useRef<HTMLInputElement>(null);

	// Sauvegarde Google Drive (automatique, disponible uniquement dans l'app de bureau)
	const [gdriveAvailable, setGdriveAvailable] = useState(false);
	const [gdriveConfigured, setGdriveConfigured] = useState(false);
	const [gdriveTargetEmail, setGdriveTargetEmail] = useState<string | null>(null);
	const [gdriveUploading, setGdriveUploading] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined' || !window.gdrive) return;
		setGdriveAvailable(true);
		window.gdrive.isConfigured().then(setGdriveConfigured);
		window.gdrive.getTargetEmail().then(setGdriveTargetEmail);
	}, []);

	const handleUploadGoogle = async () => {
		setGdriveUploading(true);
		const res = await uploadBackupToGoogleDrive();
		setGdriveUploading(false);
		if (res.ok) {
			toast.success('Sauvegarde envoyée sur Google Drive !');
		} else {
			toast.error(res.error || "Échec de l'envoi vers Google Drive");
		}
	};

	const handleSaveBackup = () => {
		updateBackupConfig({ ...backupConfig, intervalHours: backupInterval, autoBackupEnabled: autoBackup });
		toast.success('Configuration de sauvegarde mise à jour');
	};

	const handleManualBackup = () => {
		downloadBackup(() => toast.success('Sauvegarde téléchargée avec succès !'));
	};

	// Step 1: capture the file and open the modal (no window.confirm)
	const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setConfirmRestoreFile(file);
		if (fileRef.current) fileRef.current.value = '';
	};

	// Step 2: called when user confirms in the modal
	const handleConfirmRestore = async () => {
		if (!confirmRestoreFile) return;
		const file = confirmRestoreFile;
		setConfirmRestoreFile(null);
		setRestoring(true);
		try {
			await restoreFromFile(file);
			toast.success('Données restaurées avec succès ! Rechargez la page.');
			setTimeout(() => window.location.reload(), 1500);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Erreur inconnue';
			toast.error(msg);
		}
		setRestoring(false);
	};

	const handleChangePassword = () => {
		if (!passwordForm.current) return toast.error('Mot de passe actuel requis');
		if (!verifyPassword(passwordForm.current, currentUser!.password)) return toast.error('Mot de passe actuel incorrect');
		if (!passwordForm.newPass) return toast.error('Nouveau mot de passe requis');
		if (passwordForm.newPass.length < 4) return toast.error('Mot de passe trop court (min 4 car.)');
		if (passwordForm.newPass !== passwordForm.confirm) return toast.error('Les mots de passe ne correspondent pas');
		updateCurrentUser({ password: hashPassword(passwordForm.newPass) });
		setPasswordForm({ current: '', newPass: '', confirm: '' });
		toast.success('Mot de passe modifié avec succès !');
	};

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			updateCurrentUser({ avatar: ev.target?.result as string });
			toast.success('Photo de profil mise à jour !');
		};
		reader.readAsDataURL(file);
	};

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
			{/* Profile */}
			<div className={`${theme.card} rounded-2xl p-6`}>
				<div className="flex items-center gap-3 mb-5">
					<Camera className={`w-5 h-5 ${theme.icon}`} />
					<h3 className={`text-sm ${theme.text}`}>Profil utilisateur</h3>
				</div>
				<div className="flex items-center gap-4 mb-5">
					<div className="relative group cursor-pointer" onClick={() => avatarRef.current?.click()}>
						{currentUser?.avatar ? (
							<img src={currentUser.avatar} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
						) : (
							<div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl">
								{currentUser?.name?.[0]?.toUpperCase()}
							</div>
						)}
						<div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
							<Camera className="w-5 h-5 text-white" />
						</div>
					</div>
					<div>
						<p className={`text-sm font-bold ${theme.text}`}>{currentUser?.name}</p>
						<p className={`text-xs font-semibold ${theme.textMuted}`}>{currentUser?.username}</p>
						<p className={`text-xs ${theme.badge} mt-1 inline-block px-2 py-0.5 rounded-full`}>
							{currentUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
						</p>
					</div>
				</div>
				<button
					onClick={() => avatarRef.current?.click()}
					className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} ${theme.text} rounded-xl text-sm hover:bg-white/10 transition`}
				>
					<Camera className="w-4 h-4" />
					Changer la photo de profil
				</button>
				<input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
			</div>

			{/* Change password */}
			<div className={`${theme.card} rounded-2xl p-6`}>
				<div className="flex items-center gap-3 mb-5">
					<Lock className={`w-5 h-5 ${theme.icon}`} />
					<h3 className={`text-sm ${theme.text}`}>Changer le mot de passe</h3>
				</div>
				<div className="space-y-3">
					{([
						{ key: 'current', label: 'Mot de passe actuel', field: 'current' as const },
						{ key: 'new', label: 'Nouveau mot de passe', field: 'newPass' as const },
						{ key: 'confirm', label: 'Confirmer le nouveau', field: 'confirm' as const },
					]).map(({ key, label, field }) => (
						<div key={key}>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>{label}</label>
							<div className="relative">
								<input
									type={showPass[key as keyof typeof showPass] ? 'text' : 'password'}
									value={passwordForm[field]}
									onChange={e => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
									className={`w-full px-3 pr-10 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
									placeholder="••••••••"
								/>
								<button
									type="button"
									onClick={() => setShowPass({ ...showPass, [key]: !showPass[key as keyof typeof showPass] })}
									className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`}
								>
									{showPass[key as keyof typeof showPass] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
						</div>
					))}
					<button
						onClick={handleChangePassword}
						className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition mt-2"
					>
						<Save className="w-4 h-4" />
						Changer le mot de passe
					</button>
				</div>
			</div>

			{/* Theme */}
			<div className={`${theme.card} rounded-2xl p-6`}>
				<div className="flex items-center gap-3 mb-5">
					<Palette className={`w-5 h-5 ${theme.icon}`} />
					<h3 className={`text-sm ${theme.text}`}>Thème de l'interface</h3>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-1 sm:grid-cols-3 gap-3">
					{THEMES.map(t => (
						<motion.button
							key={t.name}
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => { setThemeName(t.name); toast.success(`Thème "${t.label}" appliqué`); }}
							className={`relative p-4 rounded-xl border-2 transition ${themeName === t.name ? 'border-indigo-500' : `${theme.border}`}`}
						>
							<div className={`h-8 rounded-lg mb-2 ${t.bg}`} />
							<p className={`text-xs ${theme.text} text-center`}>{t.label}</p>
							{themeName === t.name && (
								<div className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
									<CheckCircle className="w-3 h-3 text-white" />
								</div>
							)}
						</motion.button>
					))}
				</div>
			</div>

			{/* Backup */}
			<div className={`${theme.card} rounded-2xl p-6`}>
				<div className="flex items-center gap-3 mb-5">
					<Database className={`w-5 h-5 ${theme.icon}`} />
					<h3 className={`text-sm ${theme.text}`}>Sauvegarde des données</h3>
				</div>

				<div className="space-y-4">
					{/* Auto backup toggle */}
					<div className="flex items-center justify-between">
						<div>
							<p className={`text-sm ${theme.text}`}>Sauvegarde automatique</p>
							<p className={`text-xs ${theme.textMuted}`}>Téléchargement automatique toutes les X heures</p>
						</div>
						<button
							onClick={() => setAutoBackup(!autoBackup)}
							className={`w-12 h-6 rounded-full transition-colors ${autoBackup ? 'bg-indigo-600' : 'bg-gray-300'} relative`}
						>
							<div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoBackup ? 'translate-x-6 left-0' : 'left-1'}`} />
						</button>
					</div>

					{/* Interval */}
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Intervalle de sauvegarde (heures)</label>
						<div className="flex items-center gap-3">
							<input
								type="number"
								min={1}
								max={168}
								value={backupInterval}
								onChange={e => setBackupInterval(+e.target.value)}
								className={`w-24 px-3 py-2 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
							/>
							<span className={`text-xs ${theme.textMuted}`}>
								Dernière sauvegarde: {backupConfig.lastBackup
									? new Date(backupConfig.lastBackup).toLocaleString('fr-FR')
									: 'Jamais'}
							</span>
						</div>
					</div>

					<button onClick={handleSaveBackup} className={`flex items-center gap-2 px-4 py-2.5 border ${theme.border} ${theme.text} rounded-xl text-sm hover:bg-white/10 transition`}>
						<Save className="w-4 h-4" />
						Enregistrer la configuration
					</button>

					{/* Actions */}
					<div className={`border-t ${theme.border} pt-4 space-y-3`}>
						<h4 className={`text-xs ${theme.text} mb-3`}>Actions de sauvegarde</h4>
						<button
							onClick={handleManualBackup}
							className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition"
						>
							<Download className="w-4 h-4" />
							<div className="text-left">
								<p className="text-sm">Sauvegarde manuelle</p>
								<p className="text-xs opacity-70">Télécharger cyber-cafe-backup-{new Date().toISOString().slice(0, 10)}.json</p>
							</div>
						</button>

						<button
							onClick={() => fileRef.current?.click()}
							disabled={restoring}
							className={`w-full flex items-center gap-3 px-4 py-3 border ${theme.border} ${theme.text} rounded-xl text-sm hover:bg-white/10 transition`}
						>
							<Upload className="w-4 h-4" />
							<div className="text-left">
								<p className="text-sm">{restoring ? 'Restauration...' : 'Restaurer depuis un fichier'}</p>
								<p className={`text-xs ${theme.textMuted}`}>Sélectionner un fichier .json de sauvegarde</p>
							</div>
						</button>

						<input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
					</div>
				</div>
			</div>

			{/* Google Drive backup */}
			<div className={`${theme.card} rounded-2xl p-6`}>
				<div className="flex items-center gap-3 mb-5">
					<Cloud className={`w-5 h-5 ${theme.icon}`} />
					<h3 className={`text-sm ${theme.text}`}>Sauvegarde sur Google Drive</h3>
				</div>

				{!gdriveAvailable ? (
					<p className={`text-xs ${theme.textMuted}`}>
						Disponible uniquement dans l'application de bureau.
					</p>
				) : (
					<div className="space-y-4">
						<p className={`text-xs ${theme.textMuted}`}>
							Envoie une copie du fichier de sauvegarde vers Google Drive
							{gdriveTargetEmail ? <> (compte <span className={theme.text}>{gdriveTargetEmail}</span>)</> : null}
							{' '}dès que vous avez accès à internet. Le logiciel reste utilisable hors ligne le reste du temps.
						</p>

						{!gdriveConfigured && (
							<p className="text-[10px] text-amber-500">
								Sauvegarde Google Drive non configurée. Contactez le support technique de l'application.
							</p>
						)}

						<button
							onClick={handleUploadGoogle}
							disabled={!gdriveConfigured || gdriveUploading}
							className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 disabled:bg-gray-400 text-white rounded-xl text-sm hover:bg-indigo-500 transition"
						>
							<Upload className="w-4 h-4" />
							{gdriveUploading ? 'Envoi en cours...' : 'Sauvegarder sur Google Drive'}
						</button>
					</div>
				)}
			</div>

			{/* App info */}
			<div className={`${theme.card} rounded-2xl p-5`}>
				<div className="flex items-center gap-3 mb-3">
					<Shield className={`w-5 h-5 ${theme.icon}`} />
					<h3 className={`text-sm ${theme.text}`}>Informations système</h3>
				</div>
				<div className="space-y-2">
					{[
						{ label: 'Version', value: '1.0.5' },
						{ label: 'Mode', value: 'Hors ligne' },
						{ label: 'Stockage', value: 'Disque-dur de l\'ordinateur' },
						{ label: 'Déconnexion auto', value: 'À la fermeture du logiciel' },
					].map(({ label, value }) => (
						<div key={label} className="flex items-center justify-between py-1">
							<p className={`text-xs ${theme.textMuted}`}>{label}</p>
							<p className={`text-xs ${theme.text}`}>{value}</p>
						</div>
					))}
				</div>
			</div>

			{/* Modal de confirmation de restauration — remplace window.confirm */}
			<AnimatePresence>
				{confirmRestoreFile && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className={`${theme.card} rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center`}
						>
							<Upload className="w-10 h-10 text-orange-400 mx-auto mb-3" />
							<h3 className={`text-base ${theme.text} mb-2`}>Restaurer les données ?</h3>
							<p className={`text-xs ${theme.textMuted} mb-1`}>Fichier sélectionné :</p>
							<p className={`text-xs font-semibold ${theme.text} mb-4 break-all`}>
								{confirmRestoreFile.name}
							</p>
							<p className={`text-xs ${theme.textMuted} mb-5`}>
								Les données actuelles seront remplacées. Cette action est irréversible.
							</p>
							<div className="flex gap-3">
								<button
									onClick={() => setConfirmRestoreFile(null)}
									className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}
								>
									Annuler
								</button>
								<button
									onClick={handleConfirmRestore}
									className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm hover:bg-orange-400 transition"
								>
									Restaurer
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
				</div>
			</IonContent>
		</IonPage>	);
}