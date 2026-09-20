import { IonContent, IonPage } from '@ionic/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, Plus, Edit2, Trash2, Search, X, Save, ChevronDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Service } from '../../lib/types';
import { toast } from 'sonner';

const CATEGORIES = ['Informatique', 'Photo', 'Internet', 'Autre'];

function ServiceModal({ service, onClose, onSave }: {
	service?: Service;
	onClose: () => void;
	onSave: (data: Omit<Service, 'id' | 'createdAt'>) => void;
}) {
	const { theme } = useApp();
	const [form, setForm] = useState({
		name: service?.name || '',
		category: service?.category || CATEGORIES[0],
		price: service?.price || 0,
		description: service?.description || '',
	});
	const [showCatDrop, setShowCatDrop] = useState(false);
	const catRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const h = (e: MouseEvent) => { if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatDrop(false); };
		document.addEventListener('mousedown', h);
		return () => document.removeEventListener('mousedown', h);
	}, []);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className={`${theme.card} rounded-2xl p-6 w-full max-w-md shadow-2xl`}
			>
				<div className="flex items-center justify-between mb-5">
					<h3 className={`text-base ${theme.text}`}>{service ? 'Modifier la prestation' : 'Nouvelle prestation'}</h3>
					<button onClick={onClose}><X className={`w-5 h-5 ${theme.textMuted}`} /></button>
				</div>
				<div className="space-y-4">
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Nom de la prestation *</label>
						<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none focus:ring-2 focus:ring-amber-400`}
							placeholder="Ex: Installation Windows 11" />
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Catégorie</label>
							<div className="relative" ref={catRef}>
								<button
									type="button"
									onClick={() => setShowCatDrop(v => !v)}
									className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none flex items-center justify-between gap-2`}
								>
									<span>{form.category}</span>
									<ChevronDown className={`w-4 h-4 ${theme.textMuted} transition-transform ${showCatDrop ? 'rotate-180' : ''}`} />
								</button>
								<AnimatePresence>
									{showCatDrop && (
										<motion.div
											initial={{ opacity: 0, y: -4 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -4 }}
											className={`absolute top-full left-0 right-0 mt-1 ${theme.card} border ${theme.border} rounded-xl shadow-xl z-50 overflow-hidden`}
										>
											{CATEGORIES.map(c => (
												<button
													key={c}
													type="button"
													onClick={() => { setForm({ ...form, category: c }); setShowCatDrop(false); }}
													className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-white/10 transition text-sm ${form.category === c ? 'text-amber-500 font-semibold' : theme.text}`}
												>
													{c}
													{form.category === c && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
												</button>
											))}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Prix (FCFA)</label>
							<input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: Math.max(0, +e.target.value) })}
								className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`} />
						</div>
					</div>
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Description</label>
						<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
							rows={3}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none resize-none`}
							placeholder="Description de la prestation..." />
					</div>
				</div>
				<div className="flex gap-3 mt-6">
					<button onClick={onClose} className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}>Annuler</button>
					<button
						onClick={() => {
							if (!form.name.trim()) return toast.error('Le nom est requis');
							onSave(form);
							onClose();
						}}
						className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-400 transition flex items-center justify-center gap-2"
					>
						<Save className="w-4 h-4" />
						Enregistrer
					</button>
				</div>
			</motion.div>
		</div>
	);
}



export default function ServicesPage() {
	const { theme, services, addService, updateService, deleteService, currentUser } = useApp();
	const isAdmin = currentUser?.role === 'admin';
	const [search, setSearch] = useState('');
	const [filterCat, setFilterCat] = useState('');
	const [showFilterDrop, setShowFilterDrop] = useState(false);
	const filterRef = useRef<HTMLDivElement>(null);
	const [showModal, setShowModal] = useState(false);
	const [editService, setEditService] = useState<Service | undefined>();
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	useEffect(() => {
		const h = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDrop(false); };
		document.addEventListener('mousedown', h);
		return () => document.removeEventListener('mousedown', h);
	}, []);

	const filtered = services.filter(s =>
		s.name.toLowerCase().includes(search.toLowerCase()) &&
		(!filterCat || s.category === filterCat)
	);

	const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);


	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="space-y-5">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="relative">
						<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
						<input value={search} onChange={e => setSearch(e.target.value)}
							placeholder="Rechercher..."
							className={`pl-9 pr-4 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none w-52`} />
					</div>
					<div className="relative" ref={filterRef}>
						<button
							onClick={() => setShowFilterDrop(v => !v)}
							className={`flex items-center gap-2 px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm min-w-[160px] justify-between`}
						>
							<span>{filterCat || 'Toutes catégories'}</span>
							<ChevronDown className={`w-4 h-4 ${theme.textMuted} transition-transform ${showFilterDrop ? 'rotate-180' : ''}`} />
						</button>
						<AnimatePresence>
							{showFilterDrop && (
								<motion.div
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									className={`absolute top-full left-0 right-0 mt-1 ${theme.card} border ${theme.border} rounded-xl shadow-xl z-50 overflow-hidden`}
								>
									<button
										onClick={() => { setFilterCat(''); setShowFilterDrop(false); }}
										className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-white/10 transition text-sm ${!filterCat ? 'text-amber-500 font-semibold' : theme.text}`}
									>
										Toutes catégories
										<span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-600">{services.length}</span>
									</button>
									{CATEGORIES.map(c => {
										const count = services.filter(s => s.category === c).length;
										return (
											<button
												key={c}
												onClick={() => { setFilterCat(c); setShowFilterDrop(false); }}
												className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-white/10 transition text-sm ${filterCat === c ? 'text-amber-500 font-semibold' : theme.text}`}
											>
												<div>
													<p>{c}</p>
													<p className={`text-xs ${theme.textMuted}`}>{count} prestation{count > 1 ? 's' : ''}</p>
												</div>
												<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${filterCat === c ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>{count}</span>
											</button>
										);
									})}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
				<button
					onClick={() => { setEditService(undefined); setShowModal(true); }}
					className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-400 transition shadow-lg"
				>
					<Plus className="w-4 h-4" />
					Nouvelle prestation
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className={`text-xl font-bold ${theme.text}`}>{services.length}</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Prestations disponibles</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className={`text-xl font-bold ${theme.text}`}>{CATEGORIES.length}</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Catégories</p>
				</div>
			</div>

			{/* Cards */}
			<div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
				{filtered.map((svc, i) => (
					<motion.div
						key={svc.id}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: i * 0.03 }}
						className={`${theme.card} rounded-2xl p-4 flex items-center justify-between gap-4`}
					>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100">
								<Wrench className="w-5 h-5 text-amber-600" />
							</div>
							<div>
								<p className={`text-sm font-semibold ${theme.text}`}>{svc.name}</p>
								{svc.description && (
									<p className={`text-xs font-semibold ${theme.textMuted}`}>{svc.description}</p>
								)}
								<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${theme.badge}`}>{svc.category}</span>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<p className="text-base font-semibold text-purple-500">{fmt(svc.price)} FCFA</p>
							<div className="flex gap-1">
								{isAdmin && (
									<button
										onClick={() => { setEditService(svc); setShowModal(true); }}
										className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
									>
										<Edit2 className="w-3.5 h-3.5" />
									</button>
								)}
								{isAdmin && (
									<button
										onClick={() => setConfirmDeleteId(svc.id)}
										className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								)}
							</div>
						</div>
					</motion.div>
				))}
				{filtered.length === 0 && (
					<div className={`${theme.card} rounded-2xl p-12 text-center`}>
						<Wrench className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
						<p className={`text-sm ${theme.textMuted}`}>Aucune prestation trouvée</p>
					</div>
				)}
			</div>

			{/* Service form modal */}
			<AnimatePresence>
				{showModal && (
					<ServiceModal
						service={editService}
						onClose={() => { setShowModal(false); setEditService(undefined); }}
						onSave={(data) => {
							if (editService) { updateService({ ...editService, ...data }); toast.success('Prestation mise à jour'); }
							else { addService(data); toast.success('Prestation ajoutée'); }
							setEditService(undefined);
							setShowModal(false);
						}}
					/>
				)}
			</AnimatePresence>

			{/* Delete confirm modal */}
			<AnimatePresence>
				{confirmDeleteId && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className={`${theme.card} rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center`}
						>
							<div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
								<Trash2 className="w-6 h-6 text-red-500" />
							</div>
							<h3 className={`text-base ${theme.text} mb-2`}>Supprimer cette prestation ?</h3>
							<p className={`text-xs ${theme.textMuted} mb-5`}>Cette action est irréversible.</p>
							<div className="flex gap-3">
								<button
									onClick={() => setConfirmDeleteId(null)}
									className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}
								>
									Annuler
								</button>
								<button
									onClick={() => {
										deleteService(confirmDeleteId);
										toast.success('Prestation supprimée');
										setConfirmDeleteId(null);
									}}
									className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-400 transition"
								>
									Supprimer
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