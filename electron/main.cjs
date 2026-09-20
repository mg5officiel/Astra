const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const gdrive = require('./googleDrive.cjs');

const isDev = process.env.NODE_ENV === 'development';

function isTrustedSender(event) {
	const url = event.senderFrame?.url || '';
	return isDev ? url.startsWith('http://localhost:5173') : url.startsWith('file://');
}

function createWindow() {
	const win = new BrowserWindow({
		width: 1280,
		height: 800,
		minWidth: 1024,
		minHeight: 600,
		title: 'MonLogiciel',
		icon: path.join(__dirname, 'icons/icon.ico'),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
			webSecurity: true,
			allowRunningInsecureContent: false,
			preload: path.join(__dirname, 'preload.cjs'),
		},
		autoHideMenuBar: true,
		show: false,
	});

	win.webContents.setWindowOpenHandler(({ url }) => {
		if (/^https:\/\//i.test(url)) shell.openExternal(url);
		return { action: 'deny' };
	});

	win.webContents.on('will-navigate', (event, url) => {
		const trusted = isDev ? url.startsWith('http://localhost:5173') : url.startsWith('file://');
		if (!trusted) event.preventDefault();
	});

	if (isDev) {
		win.loadURL('http://localhost:5173');
		win.webContents.openDevTools();
	} else {
		win.loadFile(path.join(__dirname, '../dist/index.html'));
	}

	win.once('ready-to-show', () => win.show());
}

// IPC : toutes les opérations sensibles passent par une allowlist et vérifient l'émetteur.
ipcMain.handle('gdrive:is-configured', (event) => {
	if (!isTrustedSender(event)) throw new Error('Émetteur IPC non autorisé');
	return gdrive.isConfigured();
});

ipcMain.handle('gdrive:target-email', (event) => {
	if (!isTrustedSender(event)) throw new Error('Émetteur IPC non autorisé');
	return gdrive.getTargetAccountEmail();
});

ipcMain.handle('gdrive:upload-backup', async (event, filename, jsonContent) => {
	if (!isTrustedSender(event)) throw new Error('Émetteur IPC non autorisé');
	if (typeof filename !== 'string' || !/^[a-zA-Z0-9._-]+\.json$/i.test(filename)) {
		throw new Error('Nom de fichier de sauvegarde invalide');
	}
	if (typeof jsonContent !== 'string' || jsonContent.length > 25 * 1024 * 1024) {
		throw new Error('Contenu de sauvegarde invalide ou trop volumineux');
	}
	try {
		const file = await gdrive.uploadBackup(filename, jsonContent);
		return { ok: true, file };
	} catch (err) {
		return { ok: false, error: err instanceof Error ? err.message : 'Erreur de sauvegarde' };
	}
});

ipcMain.handle('gdrive:disconnect', async (event) => {
	if (!isTrustedSender(event)) throw new Error('Émetteur IPC non autorisé');
	await gdrive.disconnect();
	return { ok: true };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
