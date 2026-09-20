import { IonContent, IonPage } from '@ionic/react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingDown, Plus, Trash2, Search, Calendar, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { Expense } from '../../lib/types';
import { toast } from 'sonner';

function ExpenseModal({ onClose, onSave }: {
	onClose: () => void;
	onSave: (data: Omit<Expense, 'id'>) => void;
}) {
	const { theme, currentUser } = useApp();
	const [form, setForm] = useState({ label: '', amount: 0 });

	const handleSave = () => {
		if (!form.label.trim()) return toast.error('Libellé requis');
		if (form.amount <= 0) return toast.error('Montant invalide');
		onSave({
			label: form.label,
			amount: form.amount,
			date: new Date().toISOString(),
			userId: currentUser!.id,
			userName: currentUser!.name,
		});
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className={`${theme.card} rounded-2xl p-6 w-full max-w-sm shadow-2xl`}
			>
				<div className="flex items-center justify-between mb-5">
					<h3 className={`text-base ${theme.text}`}>Nouvelle dépense</h3>
					<button onClick={onClose}><X className={`w-5 h-5 ${theme.textMuted}`} /></button>
				</div>
				<div className="space-y-4">
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Libellé *</label>
						<input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none focus:ring-2 focus:ring-red-400`}
							placeholder="Ex: Achat d'encre pour imprimante" />
					</div>
					<div>
						<label className={`text-xs ${theme.textMuted} mb-1 block`}>Montant (FCFA) *</label>
						<input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Math.max(0, +e.target.value) })}
							className={`w-full px-3 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none`}
							placeholder="0" />
					</div>
					<p className={`text-xs ${theme.textMuted}`}>
						Date & heure: {new Date().toLocaleString('fr-FR')}
					</p>
				</div>
				<div className="flex gap-3 mt-6">
					<button onClick={onClose} className={`flex-1 py-2.5 ${theme.card} border ${theme.border} ${theme.text} rounded-xl text-sm`}>Annuler</button>
					<button onClick={handleSave} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-400 transition">
						Enregistrer
					</button>
				</div>
			</motion.div>
		</div>
	);
}

export default function ExpensesPage() {
	const { theme, expenses, addExpense, deleteExpense, sales, credits, currentUser } = useApp();
	const isAdmin = currentUser?.role === 'admin';
	const [search, setSearch] = useState('');
	const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
	const [showModal, setShowModal] = useState(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

	const filtered = useMemo(() =>
		expenses.filter(e =>
			(!dateFilter || e.date.slice(0, 10) === dateFilter) &&
			(e.label.toLowerCase().includes(search.toLowerCase()) || e.userName.toLowerCase().includes(search.toLowerCase()))
		).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[expenses, dateFilter, search]
	);

	const todayExpenses = filtered.reduce((acc, e) => acc + e.amount, 0);
	const todaySales = useMemo(() =>
		sales.filter(s => s.date.slice(0, 10) === dateFilter && s.status === 'active')
			.reduce((acc, s) => acc + s.totalAmount, 0), [sales, dateFilter]);
	const todayRepaid = useMemo(() =>
		credits.filter(c => c.status === 'repaid' && c.repaidDate?.slice(0, 10) === dateFilter)
			.reduce((acc, c) => acc + c.amount, 0), [credits, dateFilter]);
	const net = todaySales + todayRepaid - todayExpenses;

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="space-y-5">
			{/* Controls */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<Calendar className={`w-4 h-4 ${theme.textMuted}`} />
						<input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
							className={`px-3 py-2.5 border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none bg-transparent`} />
					</div>
					<div className="relative">
						<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
						<input value={search} onChange={e => setSearch(e.target.value)}
							placeholder="Rechercher..."
							className={`pl-9 pr-4 py-2.5 ${theme.card} border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none w-48`} />
					</div>
				</div>
				<button
					onClick={() => setShowModal(true)}
					className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm hover:bg-red-400 transition shadow-lg"
				>
					<Plus className="w-4 h-4" />
					Nouvelle dépense
				</button>
			</div>

			{/* Summary */}
			<div className="grid grid-cols-4 gap-4">
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className="text-lg font-bold text-emerald-500">{fmt(todaySales)} FCFA</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Recettes du jour</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className="text-lg font-bold text-blue-500">{fmt(todayRepaid)} FCFA</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Remboursements</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4`}>
					<p className="text-lg font-bold text-red-500">-{fmt(todayExpenses)} FCFA</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Dépenses du jour</p>
				</div>
				<div className={`${theme.card} rounded-2xl p-4 border-2 ${net >= 0 ? 'border-emerald-300' : 'border-red-300'}`}>
					<p className={`text-lg ${net >= 0 ? 'font-bold text-indigo-600' : 'font-bold text-red-500'}`}>{fmt(net)} FCFA</p>
					<p className={`text-xs font-semibold ${theme.textMuted}`}>Montant restant net</p>
				</div>
			</div>

			{/* Expenses list */}
			<div className={`${theme.card} rounded-2xl overflow-hidden`}>
				<div className={`px-5 py-3 border-b ${theme.border} flex items-center justify-between`}>
					<h3 className={`text-sm font-semibold ${theme.text}`}>Dépenses</h3>
					<span className={`text-xs ${theme.textMuted}`}>{filtered.length} entrée(s)</span>
				</div>
				<div className="divide-y divide-white/10 overflow-y-auto max-h-[420px]">
					{filtered.map((exp, i) => (
						<motion.div
							key={exp.id}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: i * 0.03 }}
							className="flex items-center justify-between px-5 py-3.5 hover:bg-white/10 transition group"
						>
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
									<TrendingDown className="w-4 h-4 text-red-500" />
								</div>
								<div>
									<p className={`text-sm font-semibold ${theme.text}`}>{exp.label}</p>
									<p className={`text-xs font-semibold ${theme.textMuted}`}>
										{new Date(exp.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
										{' · '}{exp.userName}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<p className="text-sm font-bold text-red-500">-{fmt(exp.amount)} FCFA</p>
								{isAdmin && (
								<button
									onClick={() => setConfirmDeleteId(exp.id)}
									className="p-1.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition opacity-0 group-hover:opacity-100"
								>
									<Trash2 className="w-3.5 h-3.5" />
								</button>
								)}
							</div>
						</motion.div>
					))}
					{filtered.length === 0 && (
						<div className="text-center py-10">
							<TrendingDown className={`w-8 h-8 ${theme.textMuted} mx-auto mb-2`} />
							<p className={`text-sm ${theme.textMuted}`}>Aucune dépense pour ce jour</p>
						</div>
					)}
				</div>
			</div>

			{/* New expense modal */}
			<AnimatePresence>
				{showModal && (
					<ExpenseModal
						onClose={() => setShowModal(false)}
						onSave={(data) => { addExpense(data); toast.success('Dépense enregistrée'); setShowModal(false); }}
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
							<h3 className={`text-base ${theme.text} mb-2`}>Supprimer cette dépense ?</h3>
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
										deleteExpense(confirmDeleteId);
										toast.success('Dépense supprimée');
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