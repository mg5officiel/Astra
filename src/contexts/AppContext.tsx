import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { User, Article, Service, Sale, Credit, Expense, BackupConfig, ThemeName, StockMovement, StockMovementReason } from '../lib/types';
import * as storage from '../lib/storage';
import { getSession, setSession, clearSession, verifyPassword } from '../lib/auth';
import { getTheme } from '../lib/themes';
import { downloadBackup, checkAutoBackup } from '../lib/backup';
import { toast } from 'sonner';

if (typeof window !== 'undefined') {
	storage.initializeStorage();
}

// ── Types ──────────────────────────────────────────────────────────────
interface AppContextType {
	// Auth
	currentUser: User | null;
	login: (username: string, password: string) => boolean;
	logout: () => void;

	// Data
	users: User[];
	articles: Article[];
	services: Service[];
	sales: Sale[];
	credits: Credit[];
	expenses: Expense[];
	stockMovements: StockMovement[];
	backupConfig: BackupConfig;

	// User actions
	addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
	updateUser: (user: User) => void;
	deleteUser: (id: string) => void;
	updateCurrentUser: (updates: Partial<User>) => void;

	// Article actions
	addArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => void;
	updateArticle: (article: Article) => void;
	deleteArticle: (id: string) => void;
	updateStock: (id: string, qty: number, reason?: StockMovementReason, note?: string) => void;

	// Service actions
	addService: (service: Omit<Service, 'id' | 'createdAt'>) => void;
	updateService: (service: Service) => void;
	deleteService: (id: string) => void;

	// Sale actions
	addSale: (sale: Omit<Sale, 'id' | 'receiptNumber'>) => Sale;
	cancelSale: (id: string) => void;

	// Credit actions
	addCredit: (credit: Omit<Credit, 'id'>) => void;
	repayCredit: (id: string) => void;

	// Expense actions
	addExpense: (expense: Omit<Expense, 'id'>) => void;
	deleteExpense: (id: string) => void;

	// Backup
	updateBackupConfig: (config: BackupConfig) => void;
	triggerBackup: () => void;

	// Theme
	theme: ReturnType<typeof getTheme>;
	themeName: ThemeName | string;
	setThemeName: (name: ThemeName | string) => void;

	// Navigation
	currentView: string;
	setCurrentView: (view: string) => void;

	// Reload trigger
	refresh: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
	const [currentUser, setCurrentUser] = useState<User | null>(getSession());
	const [users, setUsers] = useState<User[]>([]);
	const [articles, setArticles] = useState<Article[]>([]);
	const [services, setServices] = useState<Service[]>([]);
	const [sales, setSales] = useState<Sale[]>([]);
	const [credits, setCredits] = useState<Credit[]>([]);
	const [expenses, setExpenses] = useState<Expense[]>([]);
	const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
	const [backupConfig, setBackupConfig] = useState<BackupConfig>(storage.getBackupConfig());
	const [themeName, setThemeNameState] = useState<string>(storage.getStoredTheme());
	const [currentView, setCurrentView] = useState('dashboard');
	const autoBackupRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const loadData = useCallback(() => {
		setUsers(storage.getUsers());
		setArticles(storage.getArticles());
		setServices(storage.getServices());
		setSales(storage.getSales());
		setCredits(storage.getCredits());
		setExpenses(storage.getExpenses());
		setStockMovements(storage.getStockMovements());
		setBackupConfig(storage.getBackupConfig());
	}, []);

	useEffect(() => {
		storage.initializeStorage();
		loadData();
	}, [loadData]);

	// Auto-backup
	useEffect(() => {
		if (autoBackupRef.current) clearInterval(autoBackupRef.current);
		const cfg = storage.getBackupConfig();
		if (cfg.autoBackupEnabled) {
			autoBackupRef.current = setInterval(() => {
				checkAutoBackup(() => toast.success('Sauvegarde automatique effectuée !'));
			}, 60 * 60 * 1000); // check every hour
		}
		return () => {
			if (autoBackupRef.current) clearInterval(autoBackupRef.current);
		};
	}, [backupConfig.intervalHours, backupConfig.autoBackupEnabled]);

	const login = (username: string, password: string): boolean => {
		const allUsers = storage.getUsers();
		const user = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
		if (!user) return false;
		if (!verifyPassword(password, user.password)) return false;
		setSession(user);
		setCurrentUser(user);
		return true;
	};

	const logout = () => {
		clearSession();
		setCurrentUser(null);
		setCurrentView('dashboard');
	};

	// ── Users ──────────────────────────────────────────────────────────
	const addUser = (data: Omit<User, 'id' | 'createdAt'>) => {
		const user: User = { ...data, id: storage.generateId('usr-'), createdAt: new Date().toISOString() };
		storage.addUser(user);
		setUsers(storage.getUsers());
	};

	const updateUser = (user: User) => {
		storage.updateUser(user);
		setUsers(storage.getUsers());
		if (currentUser?.id === user.id) {
			setSession(user);
			setCurrentUser(user);
		}
	};

	const deleteUser = (id: string) => {
		storage.deleteUser(id);
		setUsers(storage.getUsers());
	};

	const updateCurrentUser = (updates: Partial<User>) => {
		if (!currentUser) return;
		const updated = { ...currentUser, ...updates };
		storage.updateUser(updated);
		setSession(updated);
		setCurrentUser(updated);
		setUsers(storage.getUsers());
	};

	// ── Helper mouvement de stock ──────────────────────────────────────
	const recordMovement = (
		article: Article,
		before: number,
		after: number,
		reason: StockMovementReason,
		note?: string
	) => {
		const user = storage.getUsers().find(u => u.id === getSession()?.id) ?? getSession();
		if (!user) return;
		storage.addStockMovement({
			id: storage.generateId('stk-'),
			articleId: article.id,
			articleName: article.name,
			reason,
			quantityBefore: before,
			quantityAfter: after,
			delta: after - before,
			date: new Date().toISOString(),
			userId: user.id,
			userName: (user as User).name,
			note,
		});
		setStockMovements(storage.getStockMovements());
	};

	// ── Articles ───────────────────────────────────────────────────────
	const addArticle = (data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
		const now = new Date().toISOString();
		const article: Article = { ...data, id: storage.generateId('art-'), createdAt: now, updatedAt: now };
		storage.addArticle(article);
		setArticles(storage.getArticles());
		if (data.stock > 0) recordMovement(article, 0, data.stock, 'article_create');
	};

	const updateArticle = (article: Article) => {
		const before = storage.getArticles().find(a => a.id === article.id)?.stock ?? article.stock;
		storage.updateArticle({ ...article, updatedAt: new Date().toISOString() });
		setArticles(storage.getArticles());
		if (before !== article.stock) recordMovement(article, before, article.stock, 'article_edit');
	};

	const deleteArticle = (id: string) => {
		storage.deleteArticle(id);
		setArticles(storage.getArticles());
	};

	const updateStock = (id: string, qtyChange: number, reason: StockMovementReason = 'manual_add', note?: string) => {
		const art = storage.getArticles().find(a => a.id === id);
		if (!art) return;
		const newStock = Math.max(0, art.stock + qtyChange);
		storage.updateArticle({ ...art, stock: newStock, updatedAt: new Date().toISOString() });
		setArticles(storage.getArticles());
		recordMovement(art, art.stock, newStock, reason, note);
	};

	// ── Services ───────────────────────────────────────────────────────
	const addService = (data: Omit<Service, 'id' | 'createdAt'>) => {
		const service: Service = { ...data, id: storage.generateId('svc-'), createdAt: new Date().toISOString() };
		storage.addService(service);
		setServices(storage.getServices());
	};

	const updateService = (service: Service) => {
		storage.updateService(service);
		setServices(storage.getServices());
	};

	const deleteService = (id: string) => {
		storage.deleteService(id);
		setServices(storage.getServices());
	};

	// ── Sales ──────────────────────────────────────────────────────────
	const addSale = (data: Omit<Sale, 'id' | 'receiptNumber'>): Sale => {
		const sale: Sale = {
			...data,
			id: storage.generateId('sale-'),
			receiptNumber: storage.generateReceiptNumber(),
		};
		storage.addSale(sale);
		// Decrease stock for article items directly in storage
		sale.items.forEach(item => {
			if (item.type === 'article') {
				const art = storage.getArticles().find(a => a.id === item.itemId);
				if (!art) return;
				storage.updateArticle({ ...art, stock: Math.max(0, art.stock - item.quantity), updatedAt: new Date().toISOString() });
			}
		});
		// Reload both sales and articles in one pass so UI updates atomically
		setSales(storage.getSales());
		setArticles(storage.getArticles());
		return sale;
	};
 
	const cancelSale = (id: string) => {
		const allSales = storage.getSales();
		const sale = allSales.find(s => s.id === id);
		if (!sale || sale.status === 'cancelled') return;
		const updated = { ...sale, status: 'cancelled' as const, cancelledAt: new Date().toISOString() };
		storage.updateSale(updated);
		// Restore stock directly in storage
		sale.items.forEach(item => {
			if (item.type === 'article') {
				const art = storage.getArticles().find(a => a.id === item.itemId);
				if (!art) return;
				storage.updateArticle({ ...art, stock: art.stock + item.quantity, updatedAt: new Date().toISOString() });
			}
		});
		setSales(storage.getSales());
		setArticles(storage.getArticles());
		toast.success('Vente annulée avec succès');
	};

	// ── Credits ────────────────────────────────────────────────────────
	const addCredit = (data: Omit<Credit, 'id'>) => {
		const credit: Credit = { ...data, id: storage.generateId('crd-') };
		storage.addCredit(credit);
		setCredits(storage.getCredits());
	};

	const repayCredit = (id: string) => {
		const allCredits = storage.getCredits();
		const credit = allCredits.find(c => c.id === id);
		if (!credit || credit.status === 'repaid') return;
		const updated = { ...credit, status: 'repaid' as const, repaidDate: new Date().toISOString() };
		storage.updateCredit(updated);
		setCredits(storage.getCredits());
		toast.success(`Remboursement de ${credit.clientName} enregistré`);
	};

	// ── Expenses ───────────────────────────────────────────────────────
	const addExpense = (data: Omit<Expense, 'id'>) => {
		const expense: Expense = { ...data, id: storage.generateId('exp-') };
		storage.addExpense(expense);
		setExpenses(storage.getExpenses());
	};

	const deleteExpense = (id: string) => {
		storage.deleteExpense(id);
		setExpenses(storage.getExpenses());
	};

	// ── Backup ─────────────────────────────────────────────────────────
	const updateBackupConfig = (config: BackupConfig) => {
		storage.saveBackupConfig(config);
		setBackupConfig(config);
	};

	const triggerBackup = () => {
		downloadBackup(() => {
			loadData();
			toast.success('Sauvegarde téléchargée avec succès !');
		});
	};

	// ── Theme ─────────────────────────────────────────────────────────
	const setThemeName = (name: ThemeName | string) => {
		storage.saveTheme(name);
		setThemeNameState(name);
	};

	const theme = getTheme(themeName);

	const refresh = loadData;

	return (
		<AppContext.Provider value={{
			currentUser, login, logout,
			users, articles, services, sales, credits, expenses, stockMovements, backupConfig,
			addUser, updateUser, deleteUser, updateCurrentUser,
			addArticle, updateArticle, deleteArticle, updateStock,
			addService, updateService, deleteService,
			addSale, cancelSale,
			addCredit, repayCredit,
			addExpense, deleteExpense,
			updateBackupConfig, triggerBackup,
			theme, themeName, setThemeName,
			currentView, setCurrentView,
			refresh,
		}}>
			{children}
		</AppContext.Provider>
	);
}

export function useApp(): AppContextType {
	const ctx = useContext(AppContext);
	if (!ctx) throw new Error('useApp must be used within AppProvider');
	return ctx;
}