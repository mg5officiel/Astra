// Clé secrète assemblée à runtime pour rendre l'extraction plus difficile
// Ne modifiez pas cet ordre — l'algorithme de vérification en dépend.
const _k = [
	67, 121, 98, 101, 114, 67, 97, 102,  // CyberCaf
	101, 95, 68, 111, 117, 109, 98, 105,  // e_Doumbi
	97, 95, 76, 105, 99, 95, 50, 48,      // a_Lic_20
	50, 53, 95, 83, 101, 99, 114, 51,     // 25_Secr3
	116, 95, 75, 51, 121                  // t_K3y
];

const _secret = () => String.fromCharCode(..._k);

const _enc = new TextEncoder();

async function _importKey(): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		_enc.encode(_secret()),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify']
	);
}

/** Signe une chaîne et retourne la signature en hexadécimal */
export async function hmacSign(data: string): Promise<string> {
	const key = await _importKey();
	const sig = await crypto.subtle.sign('HMAC', key, _enc.encode(data));
	return Array.from(new Uint8Array(sig))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

/** Vérifie si une signature correspond aux données */
export async function hmacVerify(data: string, sigPrefix: string): Promise<boolean> {
	const expected = await hmacSign(data);
	return expected.startsWith(sigPrefix);
}
