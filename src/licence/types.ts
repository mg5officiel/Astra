export interface LicencePayload {
	v: number;       // version du format de clé
	mid: string;     // machine ID cible
	iat: string;     // date d'émission (YYYY-MM-DD)
	sig: string;     // signature HMAC-SHA256
}

export type LicenceStatus =
	| { status: 'checking' }
	| { status: 'valid'; machineId: string }
	| { status: 'invalid'; machineId: string; error: string }
	| { status: 'not_activated'; machineId: string };
