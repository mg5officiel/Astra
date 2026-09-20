import type { User } from './types';

const SESSION_KEY = 'cybercafe_session';

// Simple hash – acceptable for local offline app
export function hashPassword(password: string): string {
	const salt = import.meta.env.VITE_PASSWORD_SALT || 'change-me-in-production';
	const combined = salt + password + salt + password.length;
	let hash = 0;
	for (let i = 0; i < combined.length; i++) {
		const char = combined.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return btoa(Math.abs(hash).toString(16) + combined.length.toString(16));
}

export function verifyPassword(plain: string, hashed: string): boolean {
	return hashPassword(plain) === hashed;
}

export function getSession(): User | null {
	try {
		const raw = sessionStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as User;
	} catch {
		return null;
	}
}

export function setSession(user: User): void {
	sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
	sessionStorage.removeItem(SESSION_KEY);
}

export function isAdmin(user: User | null): boolean {
	return user?.role === 'admin';
}
