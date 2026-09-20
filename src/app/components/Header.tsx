import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Camera, ChevronDown, LogOut, Settings, Palette } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { toast } from 'sonner';

const VIEW_LABELS: Record<string, string> = {
	dashboard: 'Tableau de bord',
	stock: 'Gestion du Stock',
	sales: 'Nouvelle Vente',
	history: 'Historique des Ventes',
	credits: 'Emprunts & Crédit',
	services: 'Prestations de Services',
	accounting: 'Comptabilité',
	expenses: 'Dépenses',
	admin: 'Administration',
	settings: 'Paramètres',
};

export function Header() {
	const { currentUser, theme, currentView, logout, updateCurrentUser, setCurrentView, articles } = useApp();
	const [showMenu, setShowMenu] = useState(false);
	const [showNotif, setShowNotif] = useState(false);
	const fileRef = useRef<HTMLInputElement>(null);

	const lowStockItems = articles.filter(a => a.stock <= a.minStock);

	const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			const base64 = ev.target?.result as string;
			updateCurrentUser({ avatar: base64 });
			toast.success('Photo de profil mise à jour !');
		};
		reader.readAsDataURL(file);
	};

	return (
		<header className={`flex items-center justify-between px-6 py-3 ${theme.header} z-10`}>
			{/* Title */}
			<div>
				<h2 className={`${theme.text} text-base`}>{VIEW_LABELS[currentView] || 'Accueil'}</h2>
				<p className={`${theme.textMuted} text-xs`}>
					{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
				</p>
			</div>

			{/* Right section */}
			<div className="flex items-center gap-3">
				{/* Notifications */}
				<div className="relative">
					<button
						onClick={() => { setShowNotif(!showNotif); setShowMenu(false); }}
						className={`relative p-2 rounded-xl ${theme.card} hover:shadow-md transition-all`}
					>
						<Bell className={`w-4 h-4 ${theme.icon}`} />
						{lowStockItems.length > 0 && (
							<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
								{lowStockItems.length}
							</span>
						)}
					</button>
					<AnimatePresence>
						{showNotif && (
							<motion.div
								initial={{ opacity: 0, y: -10, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -10, scale: 0.95 }}
								className={`absolute right-0 top-full mt-2 w-72 ${theme.card} rounded-2xl p-4 shadow-2xl z-50`}
							>
								<p className={`text-xs font-medium ${theme.text} mb-3`}>Alertes stock</p>
								{lowStockItems.length === 0 ? (
									<p className={`text-xs ${theme.textMuted}`}>Aucune alerte</p>
								) : (
									<div className="space-y-2">
										{lowStockItems.map(a => (
											<div key={a.id} className="flex items-center gap-2">
												<div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
												<p className={`text-xs ${theme.text}`}>{a.name}</p>
												<span className="ml-auto text-xs text-red-500">{a.stock} {a.unit}</span>
											</div>
										))}
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				{/* User menu */}
				<div className="relative">
					<button
						onClick={() => { setShowMenu(!showMenu); setShowNotif(false); }}
						className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${theme.card} hover:shadow-md transition-all`}
					>
						<div className="relative">
							{currentUser?.avatar ? (
								<img src={currentUser.avatar} alt="avatar" className="w-8 h-8 rounded-lg object-cover" />
							) : (
								<div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">
									{currentUser?.name?.[0]?.toUpperCase() || 'U'}
								</div>
							)}
							<div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
						</div>
						<div className="text-left hidden sm:block">
							<p className={`text-xs ${theme.text} leading-tight`}>{currentUser?.name}</p>
							<p className={`text-[10px] ${theme.textMuted}`}>{currentUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</p>
						</div>
						<ChevronDown className={`w-3 h-3 ${theme.textMuted}`} />
					</button>

					<AnimatePresence>
						{showMenu && (
							<motion.div
								initial={{ opacity: 0, y: -10, scale: 0.95 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: -10, scale: 0.95 }}
								className={`absolute right-0 top-full mt-2 w-56 ${theme.card} rounded-2xl p-2 shadow-2xl z-50`}
							>
								<div className={`px-3 py-2 mb-1 border-b ${theme.border}`}>
									<p className={`text-xs ${theme.text}`}>{currentUser?.name}</p>
									<p className={`text-[10px] ${theme.textMuted}`}>{currentUser?.username}</p>
								</div>

								<button
									onClick={() => { fileRef.current?.click(); setShowMenu(false); }}
									className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition text-sm text-left`}
								>
									<Camera className="w-4 h-4" />
									Changer la photo
								</button>

								<button
									onClick={() => { setCurrentView('settings'); setShowMenu(false); }}
									className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition text-sm text-left`}
								>
									<Palette className="w-4 h-4" />
									Changer le thème
								</button>

								<button
									onClick={() => { setCurrentView('settings'); setShowMenu(false); }}
									className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition text-sm text-left`}
								>
									<Settings className="w-4 h-4" />
									Paramètres
								</button>

								<div className={`border-t ${theme.border} mt-1 pt-1`}>
									<button
										onClick={() => { logout(); setShowMenu(false); }}
										className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/10 transition text-sm text-left"
									>
										<LogOut className="w-4 h-4" />
										Déconnexion
									</button>
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

			{/* Click outside handler */}
			{(showMenu || showNotif) && (
				<div className="fixed inset-0 z-40" onClick={() => { setShowMenu(false); setShowNotif(false); }} />
			)}
		</header>
	);
}