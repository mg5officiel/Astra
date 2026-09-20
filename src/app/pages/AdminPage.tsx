import { IonContent, IonPage } from '@ionic/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Users, Plus, Edit2, Trash2, Eye, EyeOff, X, Save, UserCheck, UserX } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { User, UserRole } from '../../lib/types';
import { hashPassword } from '../../lib/auth';
import { toast } from 'sonner';

function UserModal({ user, onClose, onSave }: {
	user?: User;
	onClose: () => void;
	onSave: (data: Omit<User, 'id' | 'createdAt'>) => void;
}) {
	const { theme } = useApp();
	const [form, setForm] = useState({
		username: user?.username || '',
		name: user?.name || '',
		role: (user?.role || 'user') as UserRole,
		password: '',
		confirmPassword: '',
		avatar: user?.avatar || null as string | null,
	});
	const [showPass, setShowPass] = useState(false);

	const handleSave = () => {
		if (!form.username.trim()) return toast.error('Nom d\'utilisateur requis');
		if (!form.name.trim()) return toast.error('Nom complet requis');
		if (!user && !form.password) return toast.error('Mot de passe requis');
		if (form.password && form.password !== form.confirmPassword) return toast.error('Les mots de passe ne correspondent pas');
		if (form.password && form.password.length < 4) return toast.error('Mot de passe trop court (min 4 caractères)');

		onSave({
			username: form.username,
			name: form.name,
			role: form.role,
			password: form.password ? hashPassword(form.password) : (user?.password || ''),
			avatar: form.avatar,
		});
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className={`${theme.card} rounded-2xl p-6 w-full max-w-md shadow-2xl`}
			>
				<div className="flex items-center justify-between mb-5">
					<h3 className={`text-base ${theme.text}`}>{user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h3>
					<button onClick={onClose}><X className={`w-5 h-5 ${theme.textMuted}`} /></button>
				</div>
				<div className="space-y-4">
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Nom complet *</label>
						<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
							placeholder="Prénom et Nom" />
					</div>
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Nom d'utilisateur (login) *</label>
						<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
							placeholder="email ou identifiant" />
					</div>
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Rôle</label>
						<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}>
							<option value="user">Utilisateur</option>
							<option value="admin">Administrateur</option>
						</select>
					</div>
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>{user ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
						<div className="relative">
							<input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
								className={`w-full px-3 pr-10 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
								placeholder="••••••••" />
							<button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`}>
								{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
							</button>
						</div>
					</div>
					{form.password && (
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Confirmer le mot de passe</label>
							<input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
								className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
								placeholder="••••••••" />
						</div>
					)}
				</div>
				<div className="flex gap-3 mt-6">
					<button onClick={onClose} className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}>Annuler</button>
					<button onClick={handleSave} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition flex items-center justify-center gap-2">
						<Save className="w-4 h-4" />
						Enregistrer
					</button>
				</div>
			</motion.div>
		</div>
	);
}

export default function AdminPage() {
	const { theme, users, currentUser, addUser, updateUser, deleteUser } = useApp();
	const [showModal, setShowModal] = useState(false);
	const [editUser, setEditUser] = useState<User | undefined>();
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

	if (currentUser?.role !== 'admin') {
		return (
			<div className={`${theme.card} rounded-2xl p-12 text-center`}>
				<Shield className={`w-12 h-12 ${theme.textMuted} mx-auto mb-3`} />
				<h3 className={`text-base fond-bold ${theme.text} mb-2`}>Accès refusé</h3>
				<p className={`text-sm ${theme.textMuted}`}>Cette section est réservée aux administrateurs.</p>
			</div>
		);
	}

	const handleSave = (data: Omit<User, 'id' | 'createdAt'>) => {
		if (editUser) {
			updateUser({ ...editUser, ...data });
			toast.success('Utilisateur mis à jour');
		} else {
			// Check for duplicate username
			if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
				return toast.error('Ce nom d\'utilisateur existe déjà');
			}
			addUser(data);
			toast.success('Utilisateur créé');
		}
		setEditUser(undefined);
	};

	const handleDelete = (id: string) => {
		if (id === currentUser?.id) return toast.error('Vous ne pouvez pas supprimer votre propre compte');
		deleteUser(id);
		setConfirmDelete(null);
		toast.success('Utilisateur supprimé');
	};

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="space-y-5">
			{/* Header */}
			<div className={`${theme.card} rounded-2xl p-5 flex items-center justify-between`}>
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
						<Shield className="w-5 h-5 text-indigo-600" />
					</div>
					<div>
						<h3 className={`text-sm font-bold ${theme.text}`}>Panneau d'administration</h3>
						<p className={`text-xs font-semibold ${theme.textMuted}`}>Gérez les utilisateurs et les accès</p>
					</div>
				</div>
				<button
					onClick={() => { setEditUser(undefined); setShowModal(true); }}
					className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition"
				>
					<Plus className="w-4 h-4" />
					Nouvel utilisateur
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className={`text-xl font-bold text-red-500 ${theme.text}`}>{users.length}</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Utilisateurs total</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className="text-xl font-bold text-indigo-500">{users.filter(u => u.role === 'admin').length}</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Administrateurs</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className="text-xl font-bold text-emerald-500">{users.filter(u => u.role === 'user').length}</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Utilisateurs </p>
				</div>
			</div>

			{/* Users table */}
			<div className={`${theme.card} rounded-2xl overflow-hidden`}>
				<div className={`px-5 py-3 border-b ${theme.border}`}>
					<h3 className={`text-sm font-semibold ${theme.text}`}>Liste des utilisateurs</h3>
				</div>
				<div className="divide-y divide-white/10">
					{users.map((user, i) => (
						<motion.div
							key={user.id}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: i * 0.05 }}
							className="flex items-center justify-between px-5 py-4 hover:bg-white/10 transition"
						>
							<div className="flex items-center gap-3">
								<div className="relative">
									{user.avatar ? (
										<img src={user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
									) : (
										<div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
											{user.name[0]?.toUpperCase()}
										</div>
									)}
									{user.id === currentUser?.id && (
										<div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
									)}
								</div>
								<div>
									<div className="flex items-center gap-2">
										<p className={`text-sm font-bold ${theme.text}`}>{user.name}</p>
										{user.id === currentUser?.id && <span className="text-xs font-bold text-emerald-500">(vous)</span>}
									</div>
									<p className={`text-xs font-bold ${theme.textMuted}`}>{user.username}</p>
									<p className={`text-[10px] font-semibold ${theme.textMuted}`}>
										Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<span className={`text-xs px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
									{user.role === 'admin' ? 'Admin' : 'Utilisateur'}
								</span>
								<div className="flex gap-1">
									<button
										onClick={() => { setEditUser(user); setShowModal(true); }}
										className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
									>
										<Edit2 className="w-3.5 h-3.5" />
									</button>
									{user.id !== currentUser?.id && (
										<button
											onClick={() => setConfirmDelete(user.id)}
											className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition"
										>
											<Trash2 className="w-3.5 h-3.5" />
										</button>
									)}
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* Modals */}
			<AnimatePresence>
				{showModal && (
					<UserModal
						user={editUser}
						onClose={() => { setShowModal(false); setEditUser(undefined); }}
						onSave={handleSave}
					/>
				)}
				{confirmDelete && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							className={`${theme.card} rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center`}
						>
							<UserX className="w-10 h-10 text-red-400 mx-auto mb-3" />
							<h3 className={`text-base ${theme.text} mb-2`}>Supprimer cet utilisateur ?</h3>
							<p className={`text-xs ${theme.textMuted} mb-5`}>Cette action est irréversible.</p>
							<div className="flex gap-3">
								<button onClick={() => setConfirmDelete(null)} className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}>Annuler</button>
								<button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-400 transition">Supprimer</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
				</div>
			</IonContent>
		</IonPage>	);
}
