import { IonContent, IonPage } from '@ionic/react';
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
	ShoppingCart, TrendingUp, CreditCard,
	AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ title, value, subtitle, icon: Icon, color, onClick }: {
	title: string; value: string; subtitle?: string;
	icon: React.ElementType; color: string; onClick?: () => void;
}) {
	const { theme } = useApp();
	return (
		<motion.div
			whileHover={{ y: -3, scale: 1.01 }}
			onClick={onClick}
			className={`${theme.card} ${theme.cardHover} rounded-2xl p-5 cursor-pointer transition-all`}
		>
			<div className="flex items-start justify-between mb-3">
				<div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
					<Icon className="w-5 h-5 text-white" />
				</div>
				<ArrowUpRight className={`w-4 h-4 ${theme.textMuted}`} />
			</div>
			<p className={`text-2xl font-bold ${theme.text} mb-0.5`}>{value}</p>
			<p className={`text-xs font-semibold ${theme.textMuted}`}>{title}</p>
			{subtitle && <p className={`text-xs font-semibold text-emerald-500 mt-1`}>{subtitle}</p>}
		</motion.div>
	);
}

export default function Dashboard() {
	const { theme, sales, credits, articles, services, expenses, setCurrentView } = useApp();

	const today = new Date().toISOString().slice(0, 10);

	const todaySales = useMemo(() =>
		sales.filter(s => s.date.slice(0, 10) === today && s.status === 'active'), [sales, today]);

	const todayRevenue = useMemo(() =>
		todaySales.reduce((acc, s) => acc + s.totalAmount, 0), [todaySales]);

	const todayExpenses = useMemo(() =>
		expenses.filter(e => e.date.slice(0, 10) === today).reduce((acc, e) => acc + e.amount, 0), [expenses, today]);

	const pendingCredits = useMemo(() =>
		credits.filter(c => c.status === 'pending'), [credits]);

	const pendingCreditTotal = useMemo(() =>
		pendingCredits.reduce((acc, c) => acc + c.amount, 0), [pendingCredits]);

	const lowStockItems = useMemo(() =>
		articles.filter(a => a.stock <= a.minStock), [articles]);

	const repaidToday = useMemo(() =>
		credits.filter(c => c.status === 'repaid' && c.repaidDate?.slice(0, 10) === today)
			.reduce((acc, c) => acc + c.amount, 0), [credits, today]);

	const netRevenue = todayRevenue + repaidToday - todayExpenses;

	// Weekly chart data
	const weekData = useMemo(() => {
		const data = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const dateStr = d.toISOString().slice(0, 10);
			const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' });
			const revenue = sales
				.filter(s => s.date.slice(0, 10) === dateStr && s.status === 'active')
				.reduce((acc, s) => acc + s.totalAmount, 0);
			const exp = expenses.filter(e => e.date.slice(0, 10) === dateStr).reduce((acc, e) => acc + e.amount, 0);
			data.push({ day: dayLabel, recettes: revenue, dépenses: exp });
		}
		return data;
	}, [sales, expenses]);

	const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="space-y-6">
			{/* Stats grid */}
			<div className="grid grid-cols-2 sm:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					title="Recettes du jour"
					value={fmt(todayRevenue)}
					subtitle={`Net: ${fmt(netRevenue)}`}
					icon={TrendingUp}
					color="bg-emerald-500"
					onClick={() => setCurrentView('accounting')}
				/>
				<StatCard
					title="Ventes aujourd'hui"
					value={todaySales.length.toString()}
					subtitle="transactions actives"
					icon={ShoppingCart}
					color="bg-indigo-500"
					onClick={() => setCurrentView('history')}
				/>
				<StatCard
					title="Emprunts en cours"
					value={fmt(pendingCreditTotal)}
					subtitle={`${pendingCredits.length} emprunt(s)`}
					icon={CreditCard}
					color="bg-amber-500"
					onClick={() => setCurrentView('credits')}
				/>
				<StatCard
					title="Alertes stock"
					value={lowStockItems.length.toString()}
					subtitle="article(s) en rupture"
					icon={AlertTriangle}
					color={lowStockItems.length > 0 ? 'bg-red-500' : 'bg-gray-400'}
					onClick={() => setCurrentView('stock')}
				/>
			</div>

			{/* Chart + Summary */}
			<div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
				{/* Chart */}
				<div className={`lg:col-span-2 ${theme.card} rounded-2xl p-5`}>
					<h3 className={`text-sm font-semibold ${theme.text} mb-4`}>Recettes des 7 derniers jours</h3>
					<ResponsiveContainer width="100%" height={200}>
						<AreaChart data={weekData}>
							<defs>
								<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
							<XAxis dataKey="day" tick={{ fontSize: 11 }} />
							<YAxis tick={{ fontSize: 11 }} />
							<Tooltip formatter={(v: number) => fmt(v)} />
							<Area type="monotone" dataKey="recettes" stroke="#6366f1" fill="url(#colorRevenue)" strokeWidth={2} />
							<Area type="monotone" dataKey="dépenses" stroke="#f59e0b" fill="url(#colorExp)" strokeWidth={2} />
						</AreaChart>
					</ResponsiveContainer>
				</div>

				{/* Summary */}
				<div className={`${theme.card} rounded-2xl p-5 space-y-4`}>
					<h3 className={`text-sm font-semibold ${theme.text}`}>Résumé du jour</h3>
					<div className="space-y-3">
						{[
							{ label: 'Ventes', value: fmt(todayRevenue), color: 'text-emerald-500' },
							{ label: 'Remboursements', value: fmt(repaidToday), color: 'text-blue-500' },
							{ label: 'Dépenses', value: `- ${fmt(todayExpenses)}`, color: 'text-red-400' },
							{ label: 'Net', value: fmt(netRevenue), color: netRevenue >= 0 ? 'text-emerald-600' : 'text-red-500' },
						].map(({ label, value, color }) => (
							<div key={label} className="flex items-center justify-between">
								<p className={`text-xs font-semibold ${theme.textMuted}`}>{label}</p>
								<p className={`text-sm font-bold ${color}`}>{value}</p>
							</div>
						))}
						<div className={`border-t ${theme.border} pt-3`}>
							<div className="flex items-center justify-between">
								<p className={`text-xs font-semibold ${theme.textMuted}`}>Stock articles</p>
								<p className={`text-sm font-bold ${theme.text}`}>{articles.length}</p>
							</div>
							<div className="flex items-center justify-between">
								<p className={`text-xs font-semibold ${theme.textMuted}`}>Prestations</p>
								<p className={`text-sm font-bold ${theme.text}`}>{services.length}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Recent sales + Low stock */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Recent sales */}
				<div className={`${theme.card} rounded-2xl p-5`}>
					<div className="flex items-center justify-between mb-4">
						<h3 className={`text-sm font-semibold ${theme.text}`}>Ventes récentes</h3>
						<button onClick={() => setCurrentView('history')} className={`text-xs font-semibold ${theme.primaryText} hover:underline`}>Voir tout</button>
					</div>
					<div className="space-y-2">
						{todaySales.slice(-5).reverse().map(sale => (
							<div key={sale.id} className={`flex items-center justify-between p-2.5 rounded-xl ${theme.accent}`}>
								<div>
									<p className={`text-xs font-semibold ${theme.text}`}>{sale.receiptNumber}</p>
									<p className={`text-[10px] font-semibold ${theme.textMuted}`}>{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
								</div>
								<p className="text-sm font-bold text-emerald-500">{fmt(sale.totalAmount)}</p>
							</div>
						))}
						{todaySales.length === 0 && (
							<p className={`text-xs font-semibold ${theme.textMuted} text-center py-4`}>Aucune vente aujourd'hui</p>
						)}
					</div>
				</div>

				{/* Low stock alerts */}
				<div className={`${theme.card} rounded-2xl p-5`}>
					<div className="flex items-center justify-between mb-4">
						<h3 className={`text-sm font-semibold ${theme.text}`}>Stock faible</h3>
						<button onClick={() => setCurrentView('stock')} className={`text-xs font-semibold ${theme.primaryText} hover:underline`}>Gérer</button>
					</div>
					<div className="space-y-2">
						{lowStockItems.slice(0, 5).map(art => (
							<div key={art.id} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/60">
								<div className="flex items-center gap-2">
									<AlertTriangle className="w-3 h-3 text-red-400" />
									<p className={`text-xs font-semibold ${theme.text}`}>{art.name}</p>
								</div>
								<div className="text-right">
									<p className="text-xs font-bold text-red-500">{art.stock} {art.unit}</p>
									<p className={`text-[10px] font-semibold ${theme.textMuted}`}>Min: {art.minStock}</p>
								</div>
							</div>
						))}
						{lowStockItems.length === 0 && (
							<p className={`text-xs font-semibold ${theme.textMuted} text-center py-4`}>Tous les stocks sont suffisants ✓</p>
						)}
					</div>
				</div>
			</div>
				</div>
			</IonContent>
		</IonPage>	);
}