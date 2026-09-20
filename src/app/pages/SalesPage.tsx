import { IonContent, IonPage } from '@ionic/react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, Trash2, Package, Wrench, Receipt, X, Search } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { SaleItem } from '../../lib/types';
import { generateReceiptPDF } from '../../lib/pdf';
import { toast } from 'sonner';

interface CartItem extends SaleItem {
	key: string;
}

export default function SalesPage() {
	const { theme, articles, services, addSale, currentUser } = useApp();
	const [cart, setCart] = useState<CartItem[]>([]);
	const [tab, setTab] = useState<'articles' | 'services'>('articles');
	const [search, setSearch] = useState('');
	const [showReceipt, setShowReceipt] = useState(false);
	const [lastSale, setLastSale] = useState<ReturnType<typeof addSale> | null>(null);

		// Stock effectif = stock réel − quantité déjà dans le panier
	const getEffectiveStock = (articleId: string, realStock: number) => {
		const inCart = cart.find(c => c.itemId === articleId && c.type === 'article');
		return realStock - (inCart?.quantity ?? 0);
	};

	const filteredArticles = useMemo(() =>
		articles.filter(a =>
			a.name.toLowerCase().includes(search.toLowerCase()) && getEffectiveStock(a.id, a.stock) > 0
		), [articles, search, cart]);

	const filteredServices = useMemo(() =>
		services.filter(s =>
			s.name.toLowerCase().includes(search.toLowerCase())
		), [services, search]);

	const total = cart.reduce((acc, item) => acc + item.total, 0);

	const addToCart = (item: Omit<CartItem, 'key' | 'total'>) => {
		const existing = cart.find(c => c.itemId === item.itemId && c.type === item.type);
		if (existing) {
			if (item.type === 'article') {
				const art = articles.find(a => a.id === item.itemId);
				if (art && existing.quantity >= art.stock) {
					return toast.error(`Stock insuffisant (max: ${art.stock})`);
				}
			}
			setCart(cart.map(c =>
				c.itemId === item.itemId && c.type === item.type
					? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unitPrice }
					: c
			));
		} else {
			setCart([...cart, { ...item, key: `${item.type}-${item.itemId}`, quantity: 1, total: item.unitPrice }]);
		}
	};

	const updateQty = (key: string, qty: number) => {
		if (qty <= 0) {
			setCart(cart.filter(c => c.key !== key));
		} else {
			setCart(cart.map(c => {
				if (c.key !== key) return c;
				if (c.type === 'article') {
					const art = articles.find(a => a.id === c.itemId);
					if (art && qty > art.stock) { toast.error(`Stock insuffisant`); return c; }
				}
				return { ...c, quantity: qty, total: qty * c.unitPrice };
			}));
		}
	};

	const handleSale = () => {
		if (cart.length === 0) return toast.error('Le panier est vide');
		const sale = addSale({
			date: new Date().toISOString(),
			items: cart,
			totalAmount: total,
			userId: currentUser!.id,
			userName: currentUser!.name,
			status: 'active',
		});
		setLastSale(sale);
		setShowReceipt(true);
		setCart([]);
		toast.success('Vente enregistrée !');
	};

	const handleDownloadPDF = async () => {
		if (!lastSale) return;
		await generateReceiptPDF(lastSale);
		toast.success('Reçu téléchargé !');
	};

	const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="flex flex-col lg:flex-row gap-5 min-h-full">
			{/* Products panel */}
			<div className="flex-1 space-y-4">
				{/* Tabs & Search */}
				<div className={`${theme.card} rounded-2xl p-4 space-y-3`}>
					<div className="flex gap-2">
						<button
							onClick={() => setTab('articles')}
							className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${tab === 'articles' ? 'bg-indigo-600 text-white' : `${theme.card} ${theme.text} border ${theme.border}`}`}
						>
							<Package className="w-4 h-4" /> Articles
						</button>
						<button
							onClick={() => setTab('services')}
							className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition ${tab === 'services' ? 'bg-indigo-600 text-white' : `${theme.card} ${theme.text} border ${theme.border}`}`}
						>
							<Wrench className="w-4 h-4" /> Prestations
						</button>
					</div>
					<div className="relative">
						<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
						<input
							value={search} onChange={e => setSearch(e.target.value)}
							placeholder={tab === 'articles' ? 'Rechercher un article...' : 'Rechercher une prestation...'}
							className={`w-full pl-9 pr-4 py-2.5 bg-transparent border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400`}
						/>
					</div>
				</div>

				{/* Products grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-340px)] lg:max-h-[calc(100vh-290px)] pr-1">
					{tab === 'articles'
						? filteredArticles.map(art => (
								<button
									key={art.id}
									onClick={() => addToCart({ itemId: art.id, type: 'article', name: art.name, quantity: 1, unitPrice: art.price })}
									className={`${theme.card} ${theme.cardHover} rounded-2xl p-4 text-left transition`}
								>
									<div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mb-2">
										<Package className="w-4 h-4 text-indigo-600" />
									</div>
									<p className={`text-sm ${theme.text} mb-1 line-clamp-2`}>{art.name}</p>
									<p className="text-sm text-indigo-600">{fmt(art.price)} FCFA</p>
									<p className={`text-xs ${art.stock <= art.minStock ? 'text-red-400' : theme.textMuted}`}>
										Stock: {art.stock} {art.unit}
									</p>
								</button>
							))
						: filteredServices.map(svc => (
								<button
									key={svc.id}
									onClick={() => addToCart({ itemId: svc.id, type: 'service', name: svc.name, quantity: 1, unitPrice: svc.price })}
									className={`${theme.card} ${theme.cardHover} rounded-2xl p-4 text-left transition`}
								>
									<div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
										<Wrench className="w-4 h-4 text-amber-600" />
									</div>
									<p className={`text-sm ${theme.text} mb-1 line-clamp-2`}>{svc.name}</p>
									<p className="text-sm text-amber-600">{fmt(svc.price)} FCFA</p>
									<p className={`text-xs ${theme.textMuted}`}>{svc.category}</p>
								</button>
							))}
					{((tab === 'articles' && filteredArticles.length === 0) || (tab === 'services' && filteredServices.length === 0)) && (
						<div className={`col-span-3 ${theme.card} rounded-2xl p-8 text-center`}>
							<p className={`text-sm ${theme.textMuted}`}>Aucun résultat</p>
						</div>
					)}
				</div>
			</div>

			{/* Cart */}
			<div className={`w-full lg:w-80 flex-shrink-0 ${theme.card} rounded-2xl flex flex-col`}>
				<div className={`p-4 border-b ${theme.border}`}>
					<div className="flex items-center gap-2">
						<ShoppingCart className={`w-5 h-5 ${theme.icon}`} />
						<h3 className={`text-sm ${theme.text}`}>Panier ({cart.length})</h3>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-3">
					{cart.length === 0 ? (
						<div className="text-center py-8">
							<ShoppingCart className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
							<p className={`text-xs ${theme.textMuted}`}>Panier vide</p>
						</div>
					) : (
						cart.map(item => (
							<div key={item.key} className={`p-3 rounded-xl bg-white/30 border ${theme.border}`}>
								<div className="flex items-start justify-between gap-2 mb-2">
									<p className={`text-xs ${theme.text} leading-tight flex-1`}>{item.name}</p>
									<button onClick={() => setCart(cart.filter(c => c.key !== item.key))} className="text-red-400 hover:text-red-500">
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
								{/* Price display (read-only) */}
								<div className="mb-2">
									<p className={`text-[10px] ${theme.textMuted}`}>
										Prix unitaire : <span className={`${theme.text}`}>{fmt(item.unitPrice)} FCFA</span>
									</p>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-1.5">
										<button onClick={() => updateQty(item.key, item.quantity - 1)} className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
											<Minus className="w-3 h-3 text-gray-600" />
										</button>
										<input
											type="number"
											value={item.quantity}
											onChange={e => updateQty(item.key, +e.target.value)}
											className={`w-10 text-center text-xs ${theme.card} border ${theme.border} rounded-lg ${theme.text} focus:outline-none py-1`}
										/>
										<button onClick={() => updateQty(item.key, item.quantity + 1)} className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center hover:bg-indigo-200">
											<Plus className="w-3 h-3 text-indigo-600" />
										</button>
									</div>
									<p className="text-sm text-indigo-600">{fmt(item.total)} F</p>
								</div>
							</div>
						))
					)}
				</div>

				{/* Total & checkout */}
				<div className={`p-4 border-t ${theme.border} space-y-3`}>
					<div className="flex justify-between items-center">
						<span className={`text-sm ${theme.textMuted}`}>Total</span>
						<span className={`text-xl text-indigo-600`}>{fmt(total)} FCFA</span>
					</div>
					<button
						onClick={handleSale}
						disabled={cart.length === 0}
						className="w-full py-3 bg-indigo-600 disabled:bg-gray-400 text-white rounded-xl text-sm hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-lg"
					>
						<Receipt className="w-4 h-4" />
						Encaisser & Générer reçu
					</button>
					{cart.length > 0 && (
						<button onClick={() => setCart([])} className={`w-full py-2 ${theme.textMuted} hover:text-red-400 text-xs transition`}>
							Vider le panier
						</button>
					)}
				</div>
			</div>

			{/* Receipt Modal */}
			<AnimatePresence>
				{showReceipt && lastSale && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							className={`${theme.card} rounded-2xl p-2 w-full max-w-sm shadow-2xl`}
						>
							<div className="text-center mb-3">
								<div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-1">
									<Receipt className="w-7 h-7 text-emerald-600" />
								</div>
								<h3 className={`text-base ${theme.text} mb-1`}>Vente enregistrée !</h3>
								<p className={`text-xs ${theme.textMuted}`}>{lastSale.receiptNumber}</p>
							</div>

							<div className={`${theme.accent} rounded-xl p-4 mb-5 space-y-2 overflow-x-auto overflow-y-auto max-h-[calc(100vh-340px)] lg:max-h-[calc(100vh-290px)]`}>
								{lastSale.items.map((item, i) => (
									<div key={i} className="flex justify-between text-xs">
										<span className={theme.textMuted}>{item.name} × {item.quantity}</span>
										<span className={theme.text}>{fmt(item.total)} F</span>
									</div>
								))}
								<div className={`border-t ${theme.border} pt-2 flex justify-between`}>
									<span className={`text-sm ${theme.text}`}>Total</span>
									<span className="text-sm text-indigo-600">{fmt(lastSale.totalAmount)} FCFA</span>
								</div>
							</div>

							<div className="space-y-2">
								<button
									onClick={handleDownloadPDF}
									className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition flex items-center justify-center gap-2"
								>
									Télécharger le reçu PDF
								</button>
								<button
									onClick={() => setShowReceipt(false)}
									className={`w-full py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm hover:opacity-80 transition`}
								>
									Fermer
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