import type { AppData } from './types';
import {
	getUsers, getArticles, getServices, getSales,
	getCredits, getExpenses, getBackupConfig, saveBackupConfig,
	saveUsers, saveArticles, saveServices, saveSales,
	saveCredits, saveExpenses
} from './storage';

export function exportAllData(): AppData {
	return {
		articles: getArticles(),
		services: getServices(),
		sales: getSales(),
		credits: getCredits(),
		expenses: getExpenses(),
		backupConfig: getBackupConfig(),
		version: '1.0.0',
		exportedAt: new Date().toISOString(),
	};
}

export function downloadBackup(onSuccess?: () => void): void {
	const data = exportAllData();
	const date = new Date().toISOString().slice(0, 10);
	const filename = `cyber-cafe-backup-${date}.json`;
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);

	const config = getBackupConfig();
	config.lastBackup = new Date().toISOString();
	saveBackupConfig(config);

	if (onSuccess) onSuccess();
}

export function restoreFromFile(file: File): Promise<void> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data: AppData = JSON.parse(e.target?.result as string);
				if (data.articles) saveArticles(data.articles);
				if (data.services) saveServices(data.services);
				if (data.sales) saveSales(data.sales);
				if (data.credits) saveCredits(data.credits);
				if (data.expenses) saveExpenses(data.expenses);
				if (data.backupConfig) saveBackupConfig(data.backupConfig);
				resolve();
			} catch (err) {
				reject(new Error('Fichier de sauvegarde invalide'));
			}
		};
		reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
		reader.readAsText(file);
	});
}

export function checkAutoBackup(onBackup: () => void): void {
	const config = getBackupConfig();
	if (!config.autoBackupEnabled) return;
	if (!config.lastBackup) {
		downloadBackup(onBackup);
		return;
	}
	const last = new Date(config.lastBackup).getTime();
	const now = Date.now();
	const intervalMs = config.intervalHours * 60 * 60 * 1000;
	if (now - last >= intervalMs) {
		downloadBackup(onBackup);
	}
}

// ── Sauvegarde manuelle vers Google Drive ────────────────────────────────
// Disponible uniquement dans l'application de bureau (Electron), via le
// pont exposé par electron/preload.cjs. N'existe pas en mode navigateur.
export interface GoogleDriveUploadResult {
	ok: boolean;
	error?: string;
	file?: { id: string; name: string; webViewLink?: string };
}

export function isGoogleDriveAvailable(): boolean {
	return typeof window !== 'undefined' && !!window.gdrive;
}

export async function uploadBackupToGoogleDrive(): Promise<GoogleDriveUploadResult> {
	if (!isGoogleDriveAvailable()) {
		return { ok: false, error: "Fonction disponible uniquement dans l'application de bureau." };
	}
	const data = exportAllData();
	const date = new Date().toISOString().slice(0, 10);
	const filename = `cyber-cafe-backup-${date}.json`;
	const json = JSON.stringify(data, null, 2);
	return window.gdrive!.uploadBackup(filename, json);
}