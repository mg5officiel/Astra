// ──────────────────────────────────────────────────────────────────────────
// Sauvegarde automatique sur Google Drive — connexion compte personnel
//
// Pourquoi pas un compte de service (l'ancienne approche) ?
// Google répond "Service Accounts do not have storage quota" : un compte de
// service n'a aucun espace de stockage propre. Les "Drives partagés" qui
// contournent ce problème n'existent que sur les comptes Google Workspace
// payants — pas sur un Gmail personnel. La seule solution autorisée par
// Google pour un compte gratuit est une connexion OAuth classique :
//
//   1) La toute première fois, un onglet de navigateur s'ouvre, pré-rempli
//      avec le compte cible. Un clic sur "Autoriser" suffit.
//   2) Le jeton obtenu (refresh_token) est stocké localement, chiffré.
//      Toutes les sauvegardes suivantes partent automatiquement, en
//      arrière-plan, sans rien redemander.
// ──────────────────────────────────────────────────────────────────────────
const { shell, safeStorage, app } = require('electron');
const { google } = require('googleapis');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');

const config = require('./googleDriveConfig.cjs');

const TOKEN_FILENAME = 'gdrive-tokens.dat';

function getTokenPath() {
	return path.join(app.getPath('userData'), TOKEN_FILENAME);
}

function hasCredentialsConfigured() {
	return Boolean(
		config.CLIENT_ID &&
			config.CLIENT_SECRET &&
			!config.CLIENT_ID.startsWith('VOTRE_') &&
			!config.CLIENT_SECRET.startsWith('VOTRE_')
	);
}

// ── Stockage du jeton (chiffré via le coffre-fort du système si dispo) ────
function saveTokens(tokens) {
	const json = JSON.stringify(tokens);
	const data = safeStorage.isEncryptionAvailable()
		? safeStorage.encryptString(json)
		: Buffer.from(json, 'utf8');
	fs.writeFileSync(getTokenPath(), data);
}

function loadTokens() {
	const tokenPath = getTokenPath();
	if (!fs.existsSync(tokenPath)) return null;
	try {
		const data = fs.readFileSync(tokenPath);
		const json = safeStorage.isEncryptionAvailable()
			? safeStorage.decryptString(data)
			: data.toString('utf8');
		return JSON.parse(json);
	} catch {
		return null; // fichier corrompu / non déchiffrable → on redemandera l'autorisation
	}
}

function clearTokens() {
	const tokenPath = getTokenPath();
	if (fs.existsSync(tokenPath)) fs.unlinkSync(tokenPath);
}

// ── Flux d'autorisation OAuth via un petit serveur local (loopback) ───────
function runInteractiveAuth(oauth2Client) {
	return new Promise((resolve, reject) => {
		const state = crypto.randomBytes(16).toString('hex');
		let settled = false;

		const server = http.createServer(async (req, res) => {
			try {
				const reqUrl = new URL(req.url, 'http://127.0.0.1');
				if (reqUrl.pathname !== '/oauth2callback') {
					res.writeHead(404).end();
					return;
				}

				const returnedState = reqUrl.searchParams.get('state');
				const code = reqUrl.searchParams.get('code');
				const errorParam = reqUrl.searchParams.get('error');

				if (errorParam) {
					res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
					res.end('<p>Connexion annulée. Vous pouvez fermer cet onglet.</p>');
					if (!settled) {
						settled = true;
						reject(new Error(`Autorisation refusée : ${errorParam}`));
					}
					server.close();
					return;
				}

				if (returnedState !== state || !code) {
					res.writeHead(400).end('Requête invalide.');
					return;
				}

				res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				res.end(
					'<html><body style="font-family:sans-serif"><p>✅ Connexion réussie. Vous pouvez fermer cet onglet et revenir à l\'application.</p></body></html>'
				);
				server.close();

				const { tokens } = await oauth2Client.getToken(code);
				oauth2Client.setCredentials(tokens);
				saveTokens(tokens);
				if (!settled) {
					settled = true;
					resolve(oauth2Client);
				}
			} catch (err) {
				if (!settled) {
					settled = true;
					reject(err);
				}
			}
		});

		server.listen(0, '127.0.0.1', () => {
			const port = server.address().port;
			oauth2Client.redirectUri = `http://127.0.0.1:${port}/oauth2callback`;

			const authUrl = oauth2Client.generateAuthUrl({
				access_type: 'offline', // nécessaire pour obtenir un refresh_token
				prompt: 'consent', // force l'écran de consentement (garantit le refresh_token)
				scope: config.SCOPES,
				login_hint: config.TARGET_EMAIL, // pré-remplit l'adresse Gmail
				state,
			});

			shell.openExternal(authUrl);
		});

		server.on('error', (err) => {
			if (!settled) {
				settled = true;
				reject(err);
			}
		});

		// Sécurité : si personne n'autorise rien, on n'attend pas indéfiniment.
		setTimeout(() => {
			if (!settled) {
				settled = true;
				server.close();
				reject(new Error('Délai dépassé : autorisation Google non reçue.'));
			}
		}, 5 * 60 * 1000);
	});
}

function buildOAuth2Client() {
	// redirect_uri définitif assigné dynamiquement (port choisi au moment de
	// l'autorisation) ; une valeur de base est nécessaire à la construction.
	return new google.auth.OAuth2(config.CLIENT_ID, config.CLIENT_SECRET, 'http://127.0.0.1');
}

let cachedClient = null;

async function getAuthorizedClient() {
	if (!hasCredentialsConfigured()) {
		throw new Error(
			'Identifiants Google manquants : renseignez CLIENT_ID et CLIENT_SECRET dans googleDriveConfig.cjs.'
		);
	}

	if (cachedClient) return cachedClient;

	const oauth2Client = buildOAuth2Client();

	// Persiste automatiquement tout jeton renouvelé par la librairie
	// (access_token rafraîchi, voire nouveau refresh_token).
	oauth2Client.on('tokens', (tokens) => {
		saveTokens({ ...(loadTokens() || {}), ...tokens });
	});

	const stored = loadTokens();
	if (stored && stored.refresh_token) {
		oauth2Client.setCredentials(stored);
		cachedClient = oauth2Client;
		return cachedClient;
	}

	cachedClient = await runInteractiveAuth(oauth2Client);
	return cachedClient;
}

// ── Dossier de destination (créé une seule fois) ───────────────────────────
async function getOrCreateBackupFolder(drive) {
	const safeName = config.FOLDER_NAME.replace(/'/g, "\\'");
	const query = [
		`name='${safeName}'`,
		"mimeType='application/vnd.google-apps.folder'",
		'trashed=false',
	].join(' and ');

	const existing = await drive.files.list({
		q: query,
		fields: 'files(id, name)',
		spaces: 'drive',
	});

	if (existing.data.files && existing.data.files.length > 0) {
		return existing.data.files[0].id;
	}

	const created = await drive.files.create({
		requestBody: {
			name: config.FOLDER_NAME,
			mimeType: 'application/vnd.google-apps.folder',
		},
		fields: 'id',
	});
	return created.data.id;
}

async function doUpload(filename, jsonContent) {
	const auth = await getAuthorizedClient();
	const drive = google.drive({ version: 'v3', auth });
	const folderId = await getOrCreateBackupFolder(drive);

	const response = await drive.files.create({
		requestBody: {
			name: filename,
			parents: [folderId],
		},
		media: {
			mimeType: 'application/json',
			body: Readable.from(jsonContent),
		},
		fields: 'id, name, webViewLink',
	});

	return {
		id: response.data.id,
		name: response.data.name,
		webViewLink: response.data.webViewLink,
	};
}

// ── API publique (consommée par main.cjs) ──────────────────────────────────
async function isConfigured() {
	return hasCredentialsConfigured();
}

async function getTargetAccountEmail() {
	return config.TARGET_EMAIL || null;
}

async function uploadBackup(filename, jsonContent) {
	try {
		return await doUpload(filename, jsonContent);
	} catch (err) {
		const message = err && err.message ? err.message : String(err);
		// Jeton révoqué ou expiré → on efface tout et on relance une seule
		// fois une autorisation interactive avant d'abandonner.
		if (message.includes('invalid_grant') || message.includes('No refresh token')) {
			clearTokens();
			cachedClient = null;
			return await doUpload(filename, jsonContent);
		}
		throw err;
	}
}

// Permet de se déconnecter (ex. pour changer de compte Google).
async function disconnect() {
	clearTokens();
	cachedClient = null;
}

module.exports = {
	isConfigured,
	getTargetAccountEmail,
	uploadBackup,
	disconnect,
};
