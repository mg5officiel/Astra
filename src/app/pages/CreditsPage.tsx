import { IonContent, IonPage } from '@ionic/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Plus, Phone, User, Package, Clock, CheckCircle, Search, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Credit } from '../../lib/types';
import { toast } from 'sonner';

function CreditModal({ onClose, onSave }: {
	onClose: () => void;
	onSave: (data: Omit<Credit, 'id'>, articleId?: string, quantity?: number) => void;
}) {
	const { theme, currentUser, articles } = useApp();
	const [form, setForm] = useState({
		clientName: '',
		clientPhone: '',
		articleName: '',
		amount: 0,
	});
	const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [articleSearch, setArticleSearch] = useState('');
	const [showArticleDropdown, setShowArticleDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Only articles with stock > 0
	const availableArticles = articles.filter(a => a.stock > 0);
	const filteredArticles = availableArticles.filter(a =>
		a.name.toLowerCase().includes(articleSearch.toLowerCase())
	);

	const selectedArticle = articles.find(a => a.id === selectedArticleId);

	// Close dropdown on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setShowArticleDropdown(false);
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, []);

	const handleSelectArticle = (art: typeof articles[0]) => {
		setSelectedArticleId(art.id);
		setArticleSearch(art.name);
		setForm(f => ({ ...f, articleName: art.name, amount: art.price * quantity }));
		setShowArticleDropdown(false);
	};

	const handleQuantityChange = (qty: number) => {
		setQuantity(qty);
		if (selectedArticle) {
			setForm(f => ({ ...f, amount: selectedArticle.price * qty }));
		}
	};

	const handleManualDesignation = (value: string) => {
		setArticleSearch(value);
		setForm(f => ({ ...f, articleName: value }));
		if (selectedArticleId) {
			// User is typing manually after selecting, deselect article
			setSelectedArticleId(null);
		}
	};

	const handleSave = () => {
		if (!form.clientName.trim()) return toast.error('Nom du client requis');
		if (form.clientPhone && form.clientPhone.length !== 8) return toast.error('Numéro de téléphone invalide (8 chiffres requis)');
		if (!form.articleName.trim()) return toast.error('Désignation requise');
		if (form.amount <= 0) return toast.error('Montant invalide');

		// Validate stock if article selected
		if (selectedArticleId && selectedArticle) {
			if (quantity > selectedArticle.stock) {
				return toast.error(`Stock insuffisant (disponible: ${selectedArticle.stock} ${selectedArticle.unit})`);
			}
			if (selectedArticle.stock === 0) {
				return toast.error('Stock insuffisant — article indisponible');
			}
		}

		onSave(
			{
				clientName: form.clientName,
				clientPhone: form.clientPhone,
				articleName: form.articleName,
				amount: form.amount,
				date: new Date().toISOString(),
				status: 'pending',
				userId: currentUser!.id,
				userName: currentUser!.name,
			},
			selectedArticleId ?? undefined,
			selectedArticleId ? quantity : undefined,
		);
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
					<h3 className={`text-base ${theme.text}`}>Enregistrer un emprunt</h3>
					<button onClick={onClose}><X className={`w-5 h-5 ${theme.textMuted}`} /></button>
				</div>

				<div className="space-y-4">
					{/* Client name + phone */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Nom du client *</label>
							<div className="relative">
								<User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
								<input
									value={form.clientName}
									onChange={e => setForm({ ...form, clientName: e.target.value })}
									className={`w-full pl-9 pr-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
									placeholder="Nom complet"
								/>
							</div>
						</div>
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>Téléphone</label>
							<div className="relative">
								<Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
								<input
									value={form.clientPhone}
									onChange={e => {
										const val = e.target.value.replace(/\D/g, '').slice(0, 8);
										setForm({ ...form, clientPhone: val });
									}}
									className={`w-full pl-9 pr-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none ${
										form.clientPhone.length > 0 && form.clientPhone.length < 8 ? 'border-red-400' : ''
									}`}
									placeholder="ex: 7XXXXXXXX"
									maxLength={8}
									inputMode="numeric"
								/>
							</div>
							{form.clientPhone.length > 0 && form.clientPhone.length < 8 && (
								<p className="text-xs text-red-400 mt-1">8 chiffres requis ({form.clientPhone.length}/8)</p>
							)}
						</div>
					</div>

					{/* Article / Désignation with stock picker */}
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Article / Désignation *</label>
						<div className="relative" ref={dropdownRef}>
							<Package className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
							<input
								value={articleSearch}
								onChange={e => {
									handleManualDesignation(e.target.value);
									setShowArticleDropdown(true);
								}}
								onFocus={() => setShowArticleDropdown(true)}
								className={`w-full pl-9 pr-10 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
								placeholder="Sélectionner ou saisir un article..."
							/>
							<ChevronDown
								className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted} cursor-pointer transition-transform ${showArticleDropdown ? 'rotate-180' : ''}`}
								onClick={() => setShowArticleDropdown(v => !v)}
							/>

							{/* Dropdown */}
							<AnimatePresence>
								{showArticleDropdown && (
									<motion.div
										initial={{ opacity: 0, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -4 }}
										className={`absolute top-full left-0 right-0 mt-1 ${theme.card} border ${theme.border} rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto`}
									>
										{filteredArticles.length === 0 ? (
											<div className={`px-4 py-3 text-xs ${theme.textMuted} text-center`}>
												Aucun article disponible en stock
											</div>
										) : (
											filteredArticles.map(art => (
												<button
													key={art.id}
													onClick={() => handleSelectArticle(art)}
													className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-white/10 transition`}
												>
													<div>
														<p className={`text-sm ${theme.text}`}>{art.name}</p>
														<p className={`text-xs ${theme.textMuted}`}>{art.price.toLocaleString('fr-FR')} FCFA / {art.unit}</p>
													</div>
													<span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${art.stock <= art.minStock ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
														{art.stock} {art.unit}
													</span>
												</button>
											))
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Stock warning if article selected and qty > stock */}
						{selectedArticle && quantity > selectedArticle.stock && (
							<p className="text-xs text-red-500 mt-1 flex items-center gap-1">
								<AlertTriangle className="w-3 h-3" />
								Stock insuffisant (disponible: {selectedArticle.stock} {selectedArticle.unit})
							</p>
						)}
					</div>

					{/* Quantity (only shown if article from stock selected) */}
					{selectedArticleId && selectedArticle && (
						<div>
							<label className={`text-xs ${theme.textMuted} mb-1 block`}>
								Quantité * <span className={`${theme.textMuted}`}>(stock: {selectedArticle.stock} {selectedArticle.unit})</span>
							</label>
							<input
								type="number"
								min={1}
								max={selectedArticle.stock}
								value={quantity}
								onChange={e => handleQuantityChange(Math.max(1, +e.target.value))}
								className={`w-full px-3 py-2.5 ${theme.card} border ${quantity > selectedArticle.stock ? 'border-red-400' : theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
							/>
						</div>
					)}

					{/* Montant */}
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Montant (FCFA) *</label>
						<input
							type="number"
							min="0"
							value={form.amount}
							onChange={e => setForm({ ...form, amount: Math.max(0, +e.target.value) })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
							placeholder="0"
						/>
						{selectedArticle && (
							<p className={`text-xs ${theme.textMuted} mt-1`}>
								Calculé automatiquement: {selectedArticle.price.toLocaleString('fr-FR')} × {quantity} = {(selectedArticle.price * quantity).toLocaleString('fr-FR')} FCFA
							</p>
						)}
					</div>
				</div>

				<div className="flex gap-3 mt-6">
					<button
						onClick={onClose}
						className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}
					>
						Annuler
					</button>
					<button
						onClick={handleSave}
						disabled={!!selectedArticleId && selectedArticle ? quantity > selectedArticle.stock : false}
						className="flex-1 py-2.5 bg-amber-500 disabled:bg-gray-400 text-white rounded-xl text-sm hover:bg-amber-400 transition"
					>
						Enregistrer l'emprunt
					</button>
				</div>
			</motion.div>
		</div>
	);
}

export default function CreditsPage() {
	const { theme, credits, articles, addCredit, repayCredit, updateStock, addSale, currentUser } = useApp();
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState<'all' | 'pending' | 'repaid'>('all');
	const [showModal, setShowModal] = useState(false);

	const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

	const filtered = useMemo(() =>
		credits.filter(c => {
			const matchSearch =
				c.clientName.toLowerCase().includes(search.toLowerCase()) ||
				c.clientPhone.includes(search) ||
				c.articleName.toLowerCase().includes(search.toLowerCase());
			const matchFilter = filter === 'all' ? true : c.status === filter;
			return matchSearch && matchFilter;
		}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[credits, search, filter]
	);

	const totalPending = credits.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.amount, 0);
	const totalRepaid = credits.filter(c => c.status === 'repaid').reduce((acc, c) => acc + c.amount, 0);

	// Save credit: deduct stock immediately, record sale only on repayment
	const handleSaveCredit = (
		data: Omit<Credit, 'id'>,
		articleId?: string,
		quantity?: number,
	) => {
		// Attach articleId + quantity to credit for later repayment handling
		const creditData = {
			...data,
			// Store in existing fields — we pass extras via a cast so no type change needed
			...(articleId ? { linkedArticleId: articleId, linkedQuantity: quantity } : {}),
		} as Omit<Credit, 'id'>;

		addCredit(creditData);

		// Deduct from stock immediately
		if (articleId && quantity) {
			updateStock(articleId, -quantity);
		}

		toast.success('Emprunt enregistré — stock mis à jour');
	};

	// On repayment: add sale to daily totals
	const handleRepay = (credit: typeof credits[0]) => {
		repayCredit(credit.id);

		// Add repayment as a sale so it appears in daily revenue
		addSale({
			date: new Date().toISOString(),
			items: [{
				itemId: (credit as any).linkedArticleId ?? credit.id,
				type: 'service',
				name: credit.articleName,
				quantity: (credit as any).linkedQuantity ?? 1,
				unitPrice: credit.amount / ((credit as any).linkedQuantity ?? 1),
				total: credit.amount,
			}],
			totalAmount: credit.amount,
			userId: currentUser!.id,
			userName: currentUser!.name,
			status: 'active',
		});
	};

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="space-y-5">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="relative">
						<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
						<input
							value={search}
							onChange={e => setSearch(e.target.value)}
							placeholder="Rechercher un client..."
							className={`pl-9 pr-4 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none w-52`}
						/>
					</div>
					<div className="flex gap-1">
						{(['all', 'pending', 'repaid'] as const).map(f => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={`px-3 py-2.5 rounded-xl text-xs transition ${filter === f ? 'bg-amber-500 text-white' : `border ${theme.border} ${theme.textMuted}`}`}
							>
								{f === 'all' ? 'Tous' : f === 'pending' ? 'En cours' : 'Remboursés'}
							</button>
						))}
					</div>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-400 transition shadow-lg"
				>
					<Plus className="w-4 h-4" />
					Nouvel emprunt
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className="text-xl font-bold text-amber-500">{fmt(totalPending)} FCFA</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Total emprunts en cours</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className="text-xl font-bold text-emerald-500">{fmt(totalRepaid)} FCFA</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Total remboursés</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className={`text-xl font-bold text-red-500`}>{credits.filter(c => c.status === 'pending').length}</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Emprunts non remboursés</p>
				</div>
			</div>

			{/* Credits list */}
			<div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
				{filtered.map((credit) => (
					<div
						key={credit.id}
						className={`${theme.card} rounded-2xl p-4 flex items-center justify-between gap-4`}
					>
						<div className="flex items-center gap-3">
							<div className={`w-10 h-10 rounded-xl flex items-center justify-center ${credit.status === 'repaid' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
								{credit.status === 'repaid'
									? <CheckCircle className="w-5 h-5 text-emerald-600" />
									: <Clock className="w-5 h-5 text-amber-600" />
								}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<p className={`text-sm font-semibold ${theme.text}`}>{credit.clientName}</p>
									{credit.clientPhone && (
										<span className={`text-xs font-semibold ${theme.textMuted} flex items-center gap-1`}>
											<Phone className="w-3 h-3" />{credit.clientPhone}
										</span>
									)}
								</div>
								<p className={`text-xs font-semibold ${theme.textMuted}`}>
									{credit.articleName}
									{(credit as any).linkedQuantity && (
										<span className="ml-1 text-indigo-400">× {(credit as any).linkedQuantity}</span>
									)}
								</p>
								<p className={`text-[10px] font-semibold ${theme.textMuted}`}>
									{new Date(credit.date).toLocaleString('fr-FR', {
										day: '2-digit', month: '2-digit', year: 'numeric',
										hour: '2-digit', minute: '2-digit',
									})}
									{credit.status === 'repaid' && (credit as any).repaidDate && (
										<span className="text-emerald-500 ml-2">
											· Remboursé le {new Date((credit as any).repaidDate).toLocaleDateString('fr-FR')}
										</span>
									)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="text-right">
								<p className={`text-base font-semibold ${credit.status === 'repaid' ? 'text-emerald-500' : 'text-amber-500'}`}>
									{fmt(credit.amount)} FCFA
								</p>
								<span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${credit.status === 'repaid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
									{credit.status === 'repaid' ? 'Remboursé' : 'En cours'}
								</span>
							</div>
							{credit.status === 'pending' && (
								<button
									onClick={() => handleRepay(credit)}
									className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs hover:bg-emerald-400 transition shadow-sm"
								>
									Rembourser
								</button>
							)}
						</div>
					</div>
				))}
				{filtered.length === 0 && (
					<div className={`${theme.card} rounded-2xl p-12 text-center`}>
						<CreditCard className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
						<p className={`text-sm ${theme.textMuted}`}>Aucun emprunt trouvé</p>
					</div>
				)}
			</div>

			<AnimatePresence>
				{showModal && (
					<CreditModal
						onClose={() => setShowModal(false)}
						onSave={handleSaveCredit}
					/>
				)}
			</AnimatePresence>
				</div>
			</IonContent>
		</IonPage>	);
}