import { IonContent, IonPage } from '@ionic/react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Search, Calendar, XCircle, Eye, Download, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Sale, StockMovement } from '../../lib/types';
import { generateReceiptPDF } from '../../lib/pdf';
import { toast } from 'sonner';

export default function HistoryPage() {
	const { theme, sales, credits, cancelSale, currentUser, stockMovements } = useApp();
	const isAdmin = currentUser?.role === 'admin';
	const [search, setSearch] = useState('');
	const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
	const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');
	const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
	const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

	const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

	// Combine sales + credits for the day
	const dayCredits = useMemo(() =>
		credits.filter(c => c.date.slice(0, 10) === dateFilter), [credits, dateFilter]);

	const dayRepaid = useMemo(() =>
		credits.filter(c => c.repaidDate?.slice(0, 10) === dateFilter && c.status === 'repaid'), [credits, dateFilter]);

	const filtered = useMemo(() => {
		return sales.filter(s => {
			const matchDate = dateFilter ? s.date.slice(0, 10) === dateFilter : true;
			const matchSearch = s.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
				s.userName.toLowerCase().includes(search.toLowerCase()) ||
				s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()));
			const matchStatus = statusFilter === 'all' ? true : s.status === statusFilter;
			return matchDate && matchSearch && matchStatus;
		}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	}, [sales, dateFilter, search, statusFilter]);

	const dayRevenue = filtered.filter(s => s.status === 'active').reduce((acc, s) => acc + s.totalAmount, 0);
	const repaidAmount = dayRepaid.reduce((acc, c) => acc + c.amount, 0);

	const filteredMovements = useMemo(() =>
		stockMovements
			.filter(m => dateFilter ? m.date.slice(0, 10) === dateFilter : true)
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
	[stockMovements, dateFilter]);

	const reasonLabel: Record<string, { label: string; color: string }> = {
		manual_add:     { label: 'Ajout manuel',     color: 'bg-emerald-100 text-emerald-700' },
		manual_set:     { label: 'Redéfinition',     color: 'bg-amber-100 text-amber-700'    },
		article_edit:   { label: 'Modif. article',   color: 'bg-purple-100 text-purple-700'  },
		article_create: { label: 'Création article', color: 'bg-indigo-100 text-indigo-700'  },
	};

	const handleCancel = (id: string) => {
		setConfirmCancelId(id);
	};

	const confirmCancel = () => {
		if (confirmCancelId) {
			cancelSale(confirmCancelId);
			setConfirmCancelId(null);
		}
	};

	const handleDownload = async (sale: Sale) => {
		await generateReceiptPDF(sale);
		toast.success('Reçu téléchargé');
	};

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="flex flex-col h-full gap-5">
			{/* Filters */}
			<div className={`${theme.card} rounded-2xl p-4 flex flex-wrap items-center gap-3 shrink-0`}>
				<div className="flex items-center gap-2">
					<Calendar className={`w-4 h-4 ${theme.textMuted}`} />
					<input
						type="date"
						value={dateFilter}
						onChange={e => setDateFilter(e.target.value)}
						className={`px-3 py-2 border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none bg-transparent`}
					/>
				</div>
				<div className="relative">
					<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
					<input
						value={search} onChange={e => setSearch(e.target.value)}
						placeholder="Rechercher..."
						className={`pl-9 pr-4 py-2 border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none bg-transparent w-48`}
					/>
				</div>
				<div className="flex gap-1">
					{(['all', 'active', 'cancelled'] as const).map(s => (
						<button
							key={s}
							onClick={() => setStatusFilter(s)}
							className={`px-3 py-2 rounded-xl text-xs transition ${statusFilter === s ? 'bg-indigo-600 text-white' : `border ${theme.border} ${theme.textMuted}`}`}
						>
							{s === 'all' ? 'Tous' : s === 'active' ? 'Actives' : 'Annulées'}
						</button>
					))}
				</div>
			</div>

			{/* Day summary */}
			<div className="grid grid-cols-4 gap-4 shrink-0">
				{[
					{ label: 'Ventes du jour', value: fmt(dayRevenue) + ' FCFA', color: 'text-emerald-500' },
					{ label: 'Remboursements', value: fmt(repaidAmount) + ' FCFA', color: 'text-blue-500' },
					{ label: 'Emprunts', value: dayCredits.length.toString() + ' emprunt(s)', color: 'text-red-500' },
					{ label: 'Transactions', value: filtered.length.toString(), color: 'text-amber-500' },
				].map(({ label, value, color }) => (
					<div key={label} className={`${theme.card} rounded-2xl p-4`}>
						<p className={`text-lg font-bold ${color}`}>{value}</p>
						<p className={`text-xs font-semibold ${theme.textMuted}`}>{label}</p>
					</div>
				))}
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto space-y-5 pr-1">

			{/* Table */}
			<div className={`${theme.card} rounded-2xl overflow-hidden`}>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className={`border-b ${theme.border}`}>
								{['Reçu', 'Date & Heure', 'Caissier', 'Articles', 'Montant', 'Statut', 'Actions'].map(h => (
									<th key={h} className={`text-left font-semibold px-4 py-3 text-xs ${theme.textMuted}`}>{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((sale, i) => (
								<motion.tr
									key={sale.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: i * 0.02 }}
									className={`border-b ${theme.border} hover:bg-white/10 transition ${sale.status === 'cancelled' ? 'opacity-60' : ''}`}
								>
									<td className={`px-4 py-3 text-xs ${theme.text} font-mono`}>{sale.receiptNumber}</td>
									<td className={`px-4 py-3 text-xs ${theme.textMuted}`}>
										{new Date(sale.date).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
									</td>
									<td className={`px-4 py-3 text-xs ${theme.text}`}>{sale.userName}</td>
									<td className={`px-4 py-3 text-xs ${theme.textMuted}`}>{sale.items.length} article(s)</td>
									<td className="px-4 py-3">
										<span className={`text-sm ${sale.status === 'cancelled' ? 'line-through text-gray-400' : 'text-emerald-500'}`}>
											{fmt(sale.totalAmount)} FCFA
										</span>
									</td>
									<td className="px-4 py-3">
										<span className={`text-xs px-2 py-1 rounded-full ${sale.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
											{sale.status === 'active' ? '✓ Active' : '✗ Annulée'}
										</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-1">
											<button
												onClick={() => setSelectedSale(sale)}
												className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
												title="Détails"
											>
												<Eye className="w-3.5 h-3.5" />
											</button>
											<button
												onClick={() => handleDownload(sale)}
												className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition"
												title="Télécharger reçu"
											>
												<Download className="w-3.5 h-3.5" />
											</button>
											{sale.status === 'active' && isAdmin && (
												<button
													onClick={() => handleCancel(sale.id)}
													className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition"
													title="Annuler"
												>
													<XCircle className="w-3.5 h-3.5" />
												</button>
											)}
										</div>
									</td>
								</motion.tr>
							))}
						</tbody>
					</table>
					{filtered.length === 0 && (
						<div className="text-center py-12">
							<History className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
							<p className={`text-sm ${theme.textMuted}`}>Aucune vente pour cette journée</p>
						</div>
					)}
				</div>
			</div>

			{/* Credit history for the day */}
			{(dayCredits.length > 0 || dayRepaid.length > 0) && (
				<div className={`${theme.card} rounded-2xl p-5`}>
					<h3 className={`text-sm ${theme.text} mb-4`}>Emprunts du jour</h3>
					<div className="space-y-2">
						{dayCredits.map(c => (
							<div key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${c.status === 'repaid' ? 'bg-emerald-50/60' : 'bg-amber-50/60'}`}>
								<div>
									<p className={`text-xs font-semibold ${theme.text}`}>
										{c.status === 'repaid' ? 'Emprunt remboursé' : 'Emprunt à crédit'} — {c.clientName}
									</p>
									<p className={`text-[10px] ${theme.textMuted}`}>{c.articleName} · Tél: {c.clientPhone}</p>
								</div>
								<p className={`text-sm font-bold ${c.status === 'repaid' ? 'text-emerald-600' : 'text-amber-600'}`}>
									{fmt(c.amount)} FCFA
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Mouvements de stock du jour */}
			{filteredMovements.length > 0 && (
				<div className={`${theme.card} rounded-2xl overflow-hidden`}>
					<div className="flex items-center gap-2 px-5 py-4 border-b border-inherit">
						<Package className={`w-4 h-4 ${theme.icon}`} />
						<h3 className={`text-sm font-semibold ${theme.text}`}>Mouvements de stock du jour</h3>
						<span className={`ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600`}>{filteredMovements.length}</span>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className={`border-b ${theme.border}`}>
									{['Heure', 'Article', 'Raison', 'Avant', 'Après', 'Variation', 'Par'].map(h => (
										<th key={h} className={`text-left px-4 py-2.5 text-xs font-semibold ${theme.textMuted}`}>{h}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{filteredMovements.map((m, i) => {
									const r = reasonLabel[m.reason] ?? { label: m.reason, color: 'bg-gray-100 text-gray-600' };
									const isPositive = m.delta > 0;
									return (
										<motion.tr
											key={m.id}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: i * 0.02 }}
											className={`border-b ${theme.border} hover:bg-white/10 transition`}
										>
											<td className={`px-4 py-2.5 text-xs ${theme.textMuted}`}>
												{new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
											</td>
											<td className={`px-4 py-2.5 text-xs font-medium ${theme.text}`}>{m.articleName}</td>
											<td className="px-4 py-2.5">
												<span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.color}`}>{r.label}</span>
												{m.note && <span className={`ml-1.5 text-[10px] italic ${theme.textMuted}`}>{m.note}</span>}
											</td>
											<td className={`px-4 py-2.5 text-xs ${theme.textMuted}`}>{m.quantityBefore}</td>
											<td className={`px-4 py-2.5 text-xs font-semibold ${theme.text}`}>{m.quantityAfter}</td>
											<td className="px-4 py-2.5">
												<span className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
													{isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
													{isPositive ? '+' : ''}{m.delta}
												</span>
											</td>
											<td className={`px-4 py-2.5 text-xs ${theme.textMuted}`}>{m.userName}</td>
										</motion.tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}

			</div>{/* end scrollable */}

			{/* Cancel confirm modal */}
			<AnimatePresence>
				{confirmCancelId && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className={`${theme.card} rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center`}
						>
							<div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
								<XCircle className="w-6 h-6 text-red-500" />
							</div>
							<h3 className={`text-base ${theme.text} mb-2`}>Annuler cette vente ?</h3>
							<p className={`text-xs ${theme.textMuted} mb-5`}>Le stock des articles sera restauré. Cette action est irréversible.</p>
							<div className="flex gap-3">
								<button
									onClick={() => setConfirmCancelId(null)}
									className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}
								>
									Garder
								</button>
								<button
									onClick={confirmCancel}
									className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-400 transition"
								>
									Annuler la vente
								</button>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>

			{/* Sale detail modal */}
			<AnimatePresence>
				{selectedSale && (
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className={`${theme.card} rounded-2xl p-6 w-full max-w-md shadow-2xl`}
						>
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className={`text-base ${theme.text}`}>{selectedSale.receiptNumber}</h3>
									<p className={`text-xs ${theme.textMuted}`}>{new Date(selectedSale.date).toLocaleString('fr-FR')}</p>
								</div>
								<button onClick={() => setSelectedSale(null)}><XCircle className={`w-5 h-5 ${theme.textMuted}`} /></button>
							</div>
							<div className="space-y-2 mb-4">
								{selectedSale.items.map((item, i) => (
									<div key={i} className={`flex items-center justify-between p-2.5 rounded-xl ${theme.accent}`}>
										<div>
											<p className={`text-xs ${theme.text}`}>{item.name}</p>
											<p className={`text-[10px] ${theme.textMuted}`}>{item.quantity} × {fmt(item.unitPrice)} FCFA</p>
										</div>
										<p className={`text-sm ${theme.text}`}>{fmt(item.total)} FCFA</p>
									</div>
								))}
							</div>
							<div className={`border-t ${theme.border} pt-3 flex justify-between items-center mb-4`}>
								<span className={`text-sm ${theme.text}`}>Total</span>
								<span className="text-lg text-indigo-600">{fmt(selectedSale.totalAmount)} FCFA</span>
							</div>
							<div className="flex gap-3">
								<button
									onClick={() => { if (selectedSale) handleDownload(selectedSale); }}
									className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition flex items-center justify-center gap-2"
								>
									<Download className="w-4 h-4" />
									Télécharger PDF
								</button>
								<button onClick={() => setSelectedSale(null)} className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}>
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