export type UserRole = 'admin' | 'user';
export type SaleStatus = 'active' | 'cancelled';
export type CreditStatus = 'pending' | 'repaid';

export interface User {
	id: string;
	username: string;
	password: string; // hashed
	name: string;
	role: UserRole;
	avatar: string | null; // base64
	createdAt: string;
}

export interface Article {
	id: string;
	name: string;
	category: string;
	price: number;
	stock: number;
	unit: string;
	minStock: number;
	createdAt: string;
	updatedAt: string;
}

export interface Service {
	id: string;
	name: string;
	category: string;
	price: number;
	description: string;
	createdAt: string;
}

export interface SaleItem {
	itemId: string;
	type: 'article' | 'service';
	name: string;
	quantity: number;
	unitPrice: number;
	total: number;
}

export interface Sale {
	id: string;
	receiptNumber: string;
	date: string;
	items: SaleItem[];
	totalAmount: number;
	userId: string;
	userName: string;
	status: SaleStatus;
	cancelledAt?: string;
}

export interface Credit {
	id: string;
	clientName: string;
	clientPhone: string;
	articleName: string;
	amount: number;
	date: string;
	status: CreditStatus;
	repaidDate?: string;
	userId: string;
	userName: string;
}

export interface Expense {
	id: string;
	label: string;
	amount: number;
	date: string;
	userId: string;
	userName: string;
}

export type StockMovementReason = 'manual_add' | 'manual_set' | 'article_edit' | 'article_create';

export interface StockMovement {
	id: string;
	articleId: string;
	articleName: string;
	reason: StockMovementReason;
	quantityBefore: number;
	quantityAfter: number;
	delta: number;
	date: string;
	userId: string;
	userName: string;
	note?: string;
}

export interface BackupConfig {
	intervalHours: number;
	lastBackup: string | null;
	autoBackupEnabled: boolean;
}

export interface AppData {
	articles: Article[];
	services: Service[];
	sales: Sale[];
	credits: Credit[];
	expenses: Expense[];
	backupConfig: BackupConfig;
	version: string;
	exportedAt: string;
}

export type ThemeName = 'glass-light' | 'glass-dark' | 'glass-blue' | 'ocean' | 'purple' | 'emerald' | 'sunset';

export interface Theme {
	name: ThemeName;
	label: string;
	bg: string;
	sidebar: string;
	header: string;
	card: string;
	cardHover: string;
	primary: string;
	primaryText: string;
	accent: string;
	text: string;
	textMuted: string;
	border: string;
	badge: string;
	icon: string;
}