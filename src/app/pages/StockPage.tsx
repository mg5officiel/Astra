import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
	Package, Plus, Search, Edit2, Trash2, AlertTriangle,
	X, Save, ChevronDown, PlusCircle, CheckCircle2Icon
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Article } from '../../lib/types';
import { toast } from 'sonner';
import { IonContent, IonPage, IonSearchbar, IonSelect, IonSelectOption } from '@ionic/react';

// Formateur créé une seule fois au niveau module
const fmt = new Intl.NumberFormat('fr-FR').format;

const CATEGORIES = ['Fournitures', 'Informatique', 'Accessoires'];
const UNITES = ['Pièce', 'Paquet', 'Boîte', 'Rouleau'];

function ArticleModal({
	article, onClose, onSave
}: {
	article?: Article;
	onClose: () => void;
	onSave: (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => void;
}) {
	const { theme } = useApp();
	const [form, setForm] = useState({
		name: article?.name || '',
		category: article?.category || CATEGORIES[0],
		price: article?.price || 0,
		stock: article?.stock || 0,
		unit: article?.unit || UNITES[0],
		minStock: article?.minStock || 10,
	});
	const [showCatDrop, setShowCatDrop] = useState(false);
	const [showUnitDrop, setShowUnitDrop] = useState(false);
	const catRef = useRef<HTMLDivElement>(null);
	const unitRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const h = (e: MouseEvent) => {
			if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatDrop(false);
			if (unitRef.current && !unitRef.current.contains(e.target as Node)) setShowUnitDrop(false);
		};
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
					<h3 className={`text-base ${theme.text}`}>{article ? 'Modifier l\'article' : 'Nouvel article'}</h3>
					<button onClick={onClose} className={`${theme.textMuted} hover:${theme.text}`}><X className="w-5 h-5" /></button>
				</div>
				<div className="space-y-4">
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Nom de l'article *</label>
						<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400`}
							placeholder="Ex: Rame de papier A4" />
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Catégorie</label>
							<div className="relative" ref={catRef}>
								<button type="button" onClick={() => setShowCatDrop(v => !v)}
									className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm flex items-center justify-between gap-2`}>
									<span>{form.category}</span>
									<ChevronDown className={`w-4 h-4 ${theme.textMuted} transition-transform ${showCatDrop ? 'rotate-180' : ''}`} />
								</button>
								<AnimatePresence>
									{showCatDrop && (
										<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
											className={`absolute top-full left-0 right-0 mt-1 ${theme.card} border ${theme.border} rounded-xl shadow-xl z-50 overflow-hidden`}>
											{CATEGORIES.map(c => (
												<button key={c} type="button" onClick={() => { setForm({ ...form, category: c }); setShowCatDrop(false); }}
													className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-white/10 transition text-sm ${form.category === c ? 'text-indigo-500 font-semibold' : theme.text}`}>
													{c}
													{form.category === c && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
												</button>
											))}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Unité</label>
							<div className="relative" ref={unitRef}>
								<button type="button" onClick={() => setShowUnitDrop(v => !v)}
									className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm flex items-center justify-between gap-2`}>
									<span>{form.unit}</span>
									<ChevronDown className={`w-4 h-4 ${theme.textMuted} transition-transform ${showUnitDrop ? 'rotate-180' : ''}`} />
								</button>
								<AnimatePresence>
									{showUnitDrop && (
										<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
											className={`absolute top-full left-0 right-0 mt-1 ${theme.card} border ${theme.border} rounded-xl shadow-xl z-50 overflow-hidden`}>
											{UNITES.map(u => (
												<button key={u} type="button" onClick={() => { setForm({ ...form, unit: u }); setShowUnitDrop(false); }}
													className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-white/10 transition text-sm ${form.unit === u ? 'text-indigo-500 font-semibold' : theme.text}`}>
													{u}
													{form.unit === u && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
												</button>
											))}
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Prix (FCFA)</label>
							<input type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: Math.max(0, +e.target.value) })}
								className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`} />
						</div>
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Stock</label>
							<input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: Math.max(0, +e.target.value) })}
								className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`} />
						</div>
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Stock min.</label>
							<input type="number" min="0" value={form.minStock} onChange={e => setForm({ ...form, minStock: Math.max(0, +e.target.value) })}
								className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`} />
						</div>
					</div>
				</div>
				<div className="flex gap-3 mt-6">
					<button onClick={onClose} className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm hover:opacity-80 transition`}>
						Annuler
					</button>
					<button
						onClick={() => { if (!form.name.trim()) return toast.error('Le nom est requis'); onSave(form); onClose(); }}
						className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition flex items-center justify-center gap-2"
					>
						<Save className="w-4 h-4" />
						Enregistrer
					</button>
				</div>
			</motion.div>
		</div>
	);
}

function StockAddModal({ article, onClose }: { article: Article; onClose: () => void }) {
	const { theme, updateStock } = useApp();
	const [qty, setQty] = useState(0);
	const [mode, setMode] = useState<'add' | 'set'>('add');

	const handleSave = () => {
		if (mode === 'add') {
			updateStock(article.id, qty);
			toast.success(`+${qty} ${article.unit} ajouté(s) au stock de ${article.name}`);
		} else {
			updateStock(article.id, qty - article.stock);
			toast.success(`Stock de ${article.name} mis à jour: ${qty} ${article.unit}`);
		}
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className={`${theme.card} rounded-2xl p-6 w-full max-w-sm shadow-2xl`}
			>
				<div className="flex items-center justify-between mb-5">
					<h3 className={`text-base ${theme.text}`}>Mettre à jour le stock</h3>
					<button onClick={onClose}><X className={`w-5 h-5 ${theme.textMuted}`} /></button>
				</div>
				<p className={`text-sm ${theme.textMuted} mb-4`}>{article.name} — Stock actuel: <strong className={theme.text}>{article.stock} {article.unit}</strong></p>
				<div className="flex gap-2 mb-4">
					<button onClick={() => setMode('add')} className={`flex-1 py-2 rounded-xl text-sm transition ${mode === 'add' ? 'bg-indigo-600 text-white' : `${theme.card} ${theme.text} border ${theme.border}`}`}>Ajouter</button>
					<button onClick={() => setMode('set')} className={`flex-1 py-2 rounded-xl text-sm transition ${mode === 'set' ? 'bg-indigo-600 text-white' : `${theme.card} ${theme.text} border ${theme.border}`}`}>Définir</button>
				</div>
				<input type="number" min="0" value={qty} onChange={e => setQty(+e.target.value)}
					className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400`}
					placeholder={mode === 'add' ? 'Quantité à ajouter' : 'Nouvelle quantité'} />
				<div className="flex gap-3 mt-5">
					<button onClick={onClose} className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}>Annuler</button>
					<button onClick={handleSave} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition">Enregistrer</button>
				</div>
			</motion.div>
		</div>
	);
}

export default function StockPage() {
	const { theme, articles, addArticle, updateArticle, deleteArticle, currentUser } = useApp();
	const [search, setSearch] = useState('');
	const [filterCat, setFilterCat] = useState('');
	const [showFilterDrop, setShowFilterDrop] = useState(false);
	const filterRef = useRef<HTMLDivElement>(null);
	const [showModal, setShowModal] = useState(false);
	const [editArticle, setEditArticle] = useState<Article | undefined>();
	const [stockArticle, setStockArticle] = useState<Article | undefined>();
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

	const isAdmin = currentUser?.role === 'admin';

	useEffect(() => {
		const h = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDrop(false); };
		document.addEventListener('mousedown', h);
		return () => document.removeEventListener('mousedown', h);
	}, []);

	const filtered = useMemo(() =>
		articles.filter(a =>
			(a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())) &&
			(!filterCat || a.category === filterCat)
		), [articles, search, filterCat]);

	const stats = useMemo(() => ({
		total: articles.length,
		lowStock: articles.filter(a => a.stock <= a.minStock).length,
		value: fmt(articles.reduce((acc, a) => acc + a.price * a.stock, 0)),
	}), [articles]);

	const catCounts = useMemo(() =>
		Object.fromEntries(CATEGORIES.map(c => [c, {
			count: articles.filter(a => a.category === c).length,
			lowCount: articles.filter(a => a.category === c && a.stock <= a.minStock).length,
		}])), [articles]);

	const handleDelete = useCallback((id: string) => {
		if (!isAdmin) return toast.error('Seul l\'administrateur peut supprimer des articles');
		deleteArticle(id);
		setConfirmDelete(null);
		toast.success('Article supprimé');
	}, [isAdmin, deleteArticle]);

	const handleSave = useCallback((data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
		if (editArticle) {
			updateArticle({ ...editArticle, ...data });
			toast.success('Article mis à jour');
		} else {
			addArticle(data);
			toast.success('Article ajouté');
		}
		setEditArticle(undefined);
		setShowModal(false);
	}, [editArticle, updateArticle, addArticle]);

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="space-y-5">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="relative">
						<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
						<IonSearchbar
							value={search}
							onIonInput={e => setSearch(e.detail.value ?? '')}
							placeholder="Rechercher un article..."
							className="ionic-searchbar"
							aria-label="Rechercher un article"
						/>
					</div>
					<div className="relative" ref={filterRef}>
						<button onClick={() => setShowFilterDrop(v => !v)}
							className={`flex items-center gap-2 px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm min-w-[160px] justify-between`}>
							<span>{filterCat || 'Toutes catégories'}</span>
							<ChevronDown className={`w-4 h-4 ${theme.textMuted} transition-transform ${showFilterDrop ? 'rotate-180' : ''}`} />
						</button>
						<AnimatePresence>
							{showFilterDrop && (
								<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
									className={`absolute top-full left-0 right-0 mt-1 ${theme.card} border ${theme.border} rounded-xl shadow-xl z-50 overflow-hidden`}>
									<button onClick={() => { setFilterCat(''); setShowFilterDrop(false); }}
										className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-white/10 transition text-sm ${!filterCat ? 'text-indigo-500 font-semibold' : theme.text}`}>
										Toutes catégories
										<span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-600">{articles.length}</span>
									</button>
									{CATEGORIES.map(c => {
										const { count, lowCount } = catCounts[c] ?? { count: 0, lowCount: 0 };
										return (
											<button key={c} onClick={() => { setFilterCat(c); setShowFilterDrop(false); }}
												className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-white/10 transition text-sm ${filterCat === c ? 'text-indigo-500 font-semibold' : theme.text}`}>
												<div>
													<p>{c}</p>
													<p className={`text-xs ${theme.textMuted}`}>
														{count} article{count > 1 ? 's' : ''}
														{lowCount > 0 && <span className="text-red-500 ml-1">· {lowCount} stock faible</span>}
													</p>
												</div>
												<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lowCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{count}</span>
											</button>
										);
									})}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
				
					<button
						onClick={() => { setEditArticle(undefined); setShowModal(true); }}
						className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition shadow-lg"
					>
						<Plus className="w-4 h-4" />
						Nouvel article
					</button>
				
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
				{[
					{ label: 'Total articles', value: stats.total },
					{ label: 'Stock faible', value: stats.lowStock, warn: true },
					{ label: 'Valeur stock', value: stats.value + ' FCFA' },
				].map(({ label, value, warn }) => (
					<div key={label} className={`${theme.card} rounded-2xl p-4`}>
						<p className={`text-xl font-bold ${warn && (value as number) > 0 ? 'text-red-500' : theme.text}`}>{value}</p>
						<p className={`text-xs font-semibold ${theme.textMuted}`}>{label}</p>
					</div>
				))}
			</div>

			{/* Table */}
			<div className={`${theme.card} rounded-2xl overflow-hidden`}>
				<div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-290px)]">
					<table className="w-full">
						<thead>
							<tr className={`border-b ${theme.border}`}>
								{['Article', 'Catégorie', 'Prix unitaire', 'Stock', 'Statut', 'Actions'].map(h => (
									<th key={h} className={`text-left px-4 py-3 text-xs ${theme.textMuted} sticky top-0 ${theme.card} z-10`}>{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((art) => {
								const isLow = art.stock <= art.minStock;
								return (
									<tr
										key={art.id}
										className={`border-b ${theme.border} hover:bg-white/10 transition`}
									>
										<td className={`px-4 py-3 text-sm ${theme.text}`}>
											<div className="flex items-center font-semibold gap-2">
												<Package className={`w-4 h-4 ${theme.icon}`} />
												{art.name}
											</div>
										</td>
										<td className="px-4 py-3">
											<span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.badge}`}>{art.category}</span>
										</td>
										<td className={`px-4 py-3 text-sm font-semibold ${theme.text}`}>{fmt(art.price)} FCFA</td>
										<td className="px-4 py-3">
											<span className={`text-sm font-semibold ${isLow ? 'text-red-500' : theme.text}`}>
												{art.stock} {art.unit}
											</span>
										</td>
										<td className="px-4 py-3">
											{isLow ? (
												<span className="flex items-center font-semibold gap-1 text-xs text-red-500">
													<AlertTriangle className="w-3 h-3" /> Stock faible
												</span>
											) : (
												<span className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
													<CheckCircle2Icon className="w-3 h-3" /> Normal
												</span>
											)}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-1">
												<button
													onClick={() => setStockArticle(art)}
													className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition"
													title="Mettre à jour le stock"
												>
													<PlusCircle className="w-3.5 h-3.5" />
												</button>
												{isAdmin && (
													<button
														onClick={() => { setEditArticle(art); setShowModal(true); }}
														className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
														title="Modifier"
													>
														<Edit2 className="w-3.5 h-3.5" />
													</button>
												)}
												{isAdmin && (
													<button
														onClick={() => setConfirmDelete(art.id)}
														className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition"
														title="Supprimer (admin)"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
					{filtered.length === 0 && (
						<div className="text-center py-12">
							<Package className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
							<p className={`text-sm ${theme.textMuted}`}>Aucun article trouvé</p>
						</div>
					)}
				</div>
			</div>

			{/* Modals */}
			<AnimatePresence>
				{showModal && (
					<ArticleModal
						article={editArticle}
						onClose={() => { setShowModal(false); setEditArticle(undefined); }}
						onSave={handleSave}
					/>
				)}
				{stockArticle && (
					<StockAddModal article={stockArticle} onClose={() => setStockArticle(undefined)} />
				)}
				{confirmDelete && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							className={`${theme.card} rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center`}
						>
							<Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
							<h3 className={`text-base ${theme.text} mb-2`}>Supprimer cet article ?</h3>
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