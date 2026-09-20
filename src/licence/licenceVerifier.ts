import { getMachineId } from './machineId';
import { hmacSign, hmacVerify } from './crypto';
import type { LicenceStatus } from './types';

// ── IndexedDB ─────────────────────────────────────────── (inchangé)
const DB_NAME = '__ccsm__';
const STORE = 'lic';
const KEY = 'k';

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => req.result.createObjectStore(STORE);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function saveLicence(key: string): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put(key.trim(), KEY);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function getSavedLicence(): Promise<string | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readonly');
		const req = tx.objectStore(STORE).get(KEY);
		req.onsuccess = () => resolve(req.result ?? null);
		req.onerror = () => reject(req.error);
	});
}

export async function clearLicence(): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).delete(KEY);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

// ── Helpers nouveau format ──────────────────────────────────────────────
const CHARS = 'BCDFGHJKMNPQRTVWXY2346789';

function fromBase25(str: string): string {
	const flat = str.replace(/-/g, '').padStart(25, CHARS[0]);
	let num = BigInt(0);
	for (const c of flat) {
		num = num * BigInt(CHARS.length) + BigInt(CHARS.indexOf(c));
	}
	return num.toString(16).padStart(24, '0');
}

// ── verifyKey ───────────────────────────────────────────────────────────
export async function verifyKey(
	key: string
): Promise<{ valid: boolean; error?: string }> {
	const clean = key.trim().toUpperCase();

	if (!/^[BCDFGHJKMNPQRTVWXY2346789]{5}(-[BCDFGHJKMNPQRTVWXY2346789]{5}){4}$/.test(clean)) {
		return { valid: false, error: 'Format de clé invalide.' };
	}

	const hex = fromBase25(clean);
	const mid = hex.slice(0, 8);
	const dateHex = hex.slice(8, 16);
	const sigPrefix = hex.slice(16, 24);

	const iat = `${dateHex.slice(0, 4)}-${dateHex.slice(4, 6)}-${dateHex.slice(6, 8)}`;

	const currentMid = getMachineId();
	if (mid !== currentMid) {
		return {
			valid: false,
			error: `Cette clé est pour la machine « ${mid} », pas cette machine (« ${currentMid} »).`,
		};
	}

	const dataToVerify = `v=1|mid=${mid}|iat=${iat}`;
	const sigOk = await hmacVerify(dataToVerify, sigPrefix);

	if (!sigOk) {
		return { valid: false, error: 'Clé invalide ou falsifiée.' };
	}

	return { valid: true };
}

// ── checkLicence ────────────────────────────────────────────────────────
export async function checkLicence(): Promise<LicenceStatus> {
	const mid = getMachineId();
	const saved = await getSavedLicence();

	if (!saved) {
		return { status: 'not_activated', machineId: mid };
	}

	const result = await verifyKey(saved);

	if (result.valid) {
		return { status: 'valid', machineId: mid };
	}

	return { status: 'invalid', machineId: mid, error: result.error ?? 'Clé invalide.' };
}