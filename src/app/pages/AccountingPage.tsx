import { IonContent, IonPage } from '@ionic/react';
import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calculator, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AccountingPage() {
	const { theme, sales, credits, expenses } = useApp();
	const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
	const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
	const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');

	const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

	const getDateRange = () => {
		const now = new Date();
		if (period === 'day') {
			return { from: now.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
		} else if (period === 'week') {
			const start = new Date(now);
			start.setDate(now.getDate() - now.getDay());
			return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
		} else {
			return { from: now.toISOString().slice(0, 8) + '01', to: now.toISOString().slice(0, 10) };
		}
	};

	const range = period === 'day' ? { from: dateFrom, to: dateTo } : getDateRange();

	const periodSales = useMemo(() =>
		sales.filter(s => {
			const d = s.date.slice(0, 10);
			return s.status === 'active' && d >= range.from && d <= range.to;
		}), [sales, range]);

	const periodExpenses = useMemo(() =>
		expenses.filter(e => {
			const d = e.date.slice(0, 10);
			return d >= range.from && d <= range.to;
		}), [expenses, range]);

	const periodRepaid = useMemo(() =>
		credits.filter(c => c.status === 'repaid' && c.repaidDate && c.repaidDate.slice(0, 10) >= range.from && c.repaidDate.slice(0, 10) <= range.to),
		[credits, range]
	);

	const totalSales = periodSales.reduce((acc, s) => acc + s.totalAmount, 0);
	const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
	const totalRepaid = periodRepaid.reduce((acc, c) => acc + c.amount, 0);
	const totalPendingCredits = credits.filter(c => c.status === 'pending').reduce((acc, c) => acc + c.amount, 0);
	const netProfit = totalSales + totalRepaid - totalExpenses;

	// Daily chart for the period
	const chartData = useMemo(() => {
		const days: { [key: string]: { recettes: number; dépenses: number; remboursements: number } } = {};
		const start = new Date(range.from);
		const end = new Date(range.to);
		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			const key = d.toISOString().slice(0, 10);
			days[key] = { recettes: 0, dépenses: 0, remboursements: 0 };
		}
		periodSales.forEach(s => { if (days[s.date.slice(0, 10)]) days[s.date.slice(0, 10)].recettes += s.totalAmount; });
		periodExpenses.forEach(e => { if (days[e.date.slice(0, 10)]) days[e.date.slice(0, 10)].dépenses += e.amount; });
		periodRepaid.forEach(c => { if (c.repaidDate && days[c.repaidDate.slice(0, 10)]) days[c.repaidDate.slice(0, 10)].remboursements += c.amount; });
		return Object.entries(days).map(([date, values]) => ({
			date: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
			...values,
		}));
	}, [periodSales, periodExpenses, periodRepaid, range]);

	return (
		<IonPage>
			<IonContent fullscreen className="ion-content-app">
						<div className="flex flex-col h-full gap-5">
			{/* Period selector — fixe */}
			<div className={`${theme.card} rounded-2xl p-4 flex flex-wrap items-center gap-4 shrink-0`}>
				<div className="flex gap-1">
					{(['day', 'week', 'month'] as const).map(p => (
						<button key={p} onClick={() => setPeriod(p)}
							className={`px-4 py-2 rounded-xl text-sm transition ${period === p ? 'bg-indigo-600 text-white' : `border ${theme.border} ${theme.textMuted}`}`}>
							{p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
						</button>
					))}
				</div>
				{period === 'day' && (
					<div className="flex items-center gap-2">
						<input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
							className={`px-3 py-2 border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none bg-transparent`} />
						<span className={theme.textMuted}>→</span>
						<input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
							className={`px-3 py-2 border ${theme.border} rounded-xl ${theme.text} text-sm focus:outline-none bg-transparent`} />
					</div>
				)}
			</div>

			{/* Scrollable content */}
			<div className="flex-1 overflow-y-auto space-y-5 pr-1">

			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{[
					{ label: 'Recettes', value: totalSales, color: 'text-emerald-500', icon: TrendingUp, bg: 'bg-emerald-100' },
					{ label: 'Remboursements', value: totalRepaid, color: 'text-blue-500', icon: DollarSign, bg: 'bg-blue-100' },
					{ label: 'Dépenses', value: totalExpenses, color: 'text-red-400', icon: TrendingDown, bg: 'bg-red-100' },
					{ label: 'Bénéfice net', value: netProfit, color: netProfit >= 0 ? 'text-emerald-600' : 'text-red-500', icon: Calculator, bg: netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100' },
				].map(({ label, value, color, icon: Icon, bg }) => (
					<motion.div key={label} whileHover={{ y: -2 }} className={`${theme.card} rounded-2xl p-5`}>
						<div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
							<Icon className={`w-5 h-5 ${color}`} />
						</div>
						<p className={`text-xl font-bold ${color}`}>{fmt(value)}</p>
						<p className={`text-xs font-semibold ${theme.textMuted}`}>{label}</p>
					</motion.div>
				))}
			</div>

			{/* Chart */}
			<div className={`${theme.card} rounded-2xl p-5`}>
				<h3 className={`text-sm font-semibold ${theme.text} mb-4`}>Évolution des recettes et dépenses</h3>
				<ResponsiveContainer width="100%" height={250}>
					<BarChart data={chartData}>
						<CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
						<XAxis dataKey="date" tick={{ fontSize: 10 }} />
						<YAxis tick={{ fontSize: 10 }} />
						<Tooltip formatter={(v: number) => fmt(v)} />
						<Legend />
						<Bar dataKey="recettes" fill="#6366f1" radius={[4, 4, 0, 0]} />
						<Bar dataKey="remboursements" fill="#3b82f6" radius={[4, 4, 0, 0]} />
						<Bar dataKey="dépenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>

			{/* Credit balance */}
			<div className={`${theme.card} rounded-2xl p-5`}>
				<h3 className={`text-sm font-semibold ${theme.text} mb-4`}>Balance des emprunts</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className={`${theme.accent} rounded-xl p-4`}>
						<p className="text-lg font-bold text-amber-500">{fmt(totalPendingCredits)}</p>
						<p className={`text-xs font-semibold ${theme.textMuted}`}>Emprunts à recouvrer</p>
					</div>
					<div className={`${theme.accent} rounded-xl p-4`}>
						<p className="text-lg font-bold text-emerald-500">{fmt(totalRepaid)}</p>
						<p className={`text-xs font-semibold ${theme.textMuted}`}>Recouvré sur la période</p>
					</div>
				</div>
			</div>

			{/* Expense breakdown */}
			<div className={`${theme.card} rounded-2xl p-5`}>
				<h3 className={`text-sm font-semibold ${theme.text} mb-4`}>Détail des dépenses</h3>
				{periodExpenses.length === 0 ? (
					<p className={`text-xs ${theme.textMuted} text-center py-4`}>Aucune dépense sur cette période</p>
				) : (
					<div className="space-y-2">
						{periodExpenses.map(exp => (
							<div key={exp.id} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/40">
								<div>
									<p className={`text-xs font-bold ${theme.text}`}>{exp.label}</p>
									<p className={`text-[10px] font-bold ${theme.textMuted}`}>
										{new Date(exp.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
										{' · '}{exp.userName}
									</p>
								</div>
								<p className="text-sm font-bold text-red-500">-{fmt(exp.amount)}</p>
							</div>
						))}
					</div>
				)}
			</div>

			</div>{/* end scrollable */}
				</div>
			</IonContent>
		</IonPage>	);
}