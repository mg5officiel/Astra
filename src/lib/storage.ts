import type { User, Article, Service, Sale, Credit, Expense, BackupConfig, StockMovement } from './types';
import { hashPassword } from './auth';
import { DEFAULT_ADMIN_CREDENTIALS } from '../data/credentials';

const KEYS = {
	USERS: 'cybercafe_users',
	ARTICLES: 'cybercafe_articles',
	SERVICES: 'cybercafe_services',
	SALES: 'cybercafe_sales',
	CREDITS: 'cybercafe_credits',
	EXPENSES: 'cybercafe_expenses',
	STOCK_MOVEMENTS: 'cybercafe_stock_movements',
	BACKUP_CONFIG: 'cybercafe_backup_config',
	THEME: 'cybercafe_theme',
};

function getItem<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

function setItem<T>(key: string, value: T): void {
	localStorage.setItem(key, JSON.stringify(value));
}

// ── USERS ──────────────────────────────────────────────────────────────
export function getUsers(): User[] {
	return getItem<User[]>(KEYS.USERS, []);
}
export function saveUsers(users: User[]): void {
	setItem(KEYS.USERS, users);
}
export function addUser(user: User): void {
	const users = getUsers();
	users.push(user);
	saveUsers(users);
}
export function updateUser(updated: User): void {
	const users = getUsers().map(u => u.id === updated.id ? updated : u);
	saveUsers(users);
}
export function deleteUser(id: string): void {
	saveUsers(getUsers().filter(u => u.id !== id));
}

// ── ARTICLES ───────────────────────────────────────────────────────────
export function getArticles(): Article[] {
	return getItem<Article[]>(KEYS.ARTICLES, []);
}
export function saveArticles(articles: Article[]): void {
	setItem(KEYS.ARTICLES, articles);
}
export function addArticle(article: Article): void {
	const articles = getArticles();
	articles.push(article);
	saveArticles(articles);
}
export function updateArticle(updated: Article): void {
	saveArticles(getArticles().map(a => a.id === updated.id ? updated : a));
}
export function deleteArticle(id: string): void {
	saveArticles(getArticles().filter(a => a.id !== id));
}

// ── SERVICES ───────────────────────────────────────────────────────────
export function getServices(): Service[] {
	return getItem<Service[]>(KEYS.SERVICES, []);
}
export function saveServices(services: Service[]): void {
	setItem(KEYS.SERVICES, services);
}
export function addService(service: Service): void {
	const services = getServices();
	services.push(service);
	saveServices(services);
}
export function updateService(updated: Service): void {
	saveServices(getServices().map(s => s.id === updated.id ? updated : s));
}
export function deleteService(id: string): void {
	saveServices(getServices().filter(s => s.id !== id));
}

// ── SALES ──────────────────────────────────────────────────────────────
export function getSales(): Sale[] {
	return getItem<Sale[]>(KEYS.SALES, []);
}
export function saveSales(sales: Sale[]): void {
	setItem(KEYS.SALES, sales);
}
export function addSale(sale: Sale): void {
	const sales = getSales();
	sales.push(sale);
	saveSales(sales);
}
export function updateSale(updated: Sale): void {
	saveSales(getSales().map(s => s.id === updated.id ? updated : s));
}

// ── CREDITS ────────────────────────────────────────────────────────────
export function getCredits(): Credit[] {
	return getItem<Credit[]>(KEYS.CREDITS, []);
}
export function saveCredits(credits: Credit[]): void {
	setItem(KEYS.CREDITS, credits);
}
export function addCredit(credit: Credit): void {
	const credits = getCredits();
	credits.push(credit);
	saveCredits(credits);
}
export function updateCredit(updated: Credit): void {
	saveCredits(getCredits().map(c => c.id === updated.id ? updated : c));
}

// ── EXPENSES ───────────────────────────────────────────────────────────
export function getExpenses(): Expense[] {
	return getItem<Expense[]>(KEYS.EXPENSES, []);
}
export function saveExpenses(expenses: Expense[]): void {
	setItem(KEYS.EXPENSES, expenses);
}
export function addExpense(expense: Expense): void {
	const expenses = getExpenses();
	expenses.push(expense);
	saveExpenses(expenses);
}
export function deleteExpense(id: string): void {
	saveExpenses(getExpenses().filter(e => e.id !== id));
}

// ── STOCK MOVEMENTS ────────────────────────────────────────────────────
export function getStockMovements(): StockMovement[] {
	return getItem<StockMovement[]>(KEYS.STOCK_MOVEMENTS, []);
}
export function addStockMovement(movement: StockMovement): void {
	const movements = getStockMovements();
	movements.push(movement);
	setItem(KEYS.STOCK_MOVEMENTS, movements);
}

// ── BACKUP CONFIG ──────────────────────────────────────────────────────
export function getBackupConfig(): BackupConfig {
	return getItem<BackupConfig>(KEYS.BACKUP_CONFIG, {
		intervalHours: 12,
		lastBackup: null,
		autoBackupEnabled: true,
	});
}
export function saveBackupConfig(config: BackupConfig): void {
	setItem(KEYS.BACKUP_CONFIG, config);
}

// ── THEME ──────────────────────────────────────────────────────────────
export function getStoredTheme(): string {
	return localStorage.getItem(KEYS.THEME) || 'glass-light';
}
export function saveTheme(theme: string): void {
	localStorage.setItem(KEYS.THEME, theme);
}

// ── INIT ───────────────────────────────────────────────────────────────
export function initializeStorage(): void {
	const users = getUsers();
	
	// Toujours synchroniser l'admin par défaut avec credentials.ts
	const existingAdmin = users.find(u => u.role === 'admin' && u.id === 'admin-001');
	const defaultAdmin: User = {
		id: 'admin-001',
		username: DEFAULT_ADMIN_CREDENTIALS.username,
		password: hashPassword(DEFAULT_ADMIN_CREDENTIALS.password),
		name: DEFAULT_ADMIN_CREDENTIALS.name,
		role: DEFAULT_ADMIN_CREDENTIALS.role,
		avatar: existingAdmin?.avatar ?? null, // conserve la photo de profil
		createdAt: existingAdmin?.createdAt ?? new Date().toISOString(),
	};

	if (!existingAdmin) {
		saveUsers([defaultAdmin, ...users]);
	} else {
		// Met à jour username/password/name si credentials.ts a changé
		saveUsers(users.map(u => u.id === 'admin-001' ? defaultAdmin : u));
	}
}

// ── GENERATE ID ────────────────────────────────────────────────────────
export function generateId(prefix = ''): string {
	return `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateReceiptNumber(): string {
	const now = new Date();
	const date = now.toISOString().slice(0, 10).replace(/-/g, '');
	const rand = Math.floor(Math.random() * 9000) + 1000;
	return `REC-${date}-${rand}`;
}