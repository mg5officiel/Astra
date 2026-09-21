import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Copy, Check, Key, Monitor, AlertTriangle, CheckCircle, Loader2, Lock } from 'lucide-react';
import { getMachineId } from './machineId.ts';
import { verifyKey, saveLicence } from './licenceVerifier.ts';

interface Props { onActivated: () => void; }

export function LicenceModal({ onActivated }: Props) {
	const [machineId, setMachineId] = useState('');
	const [activationKey, setActivationKey] = useState('');
	const [copied, setCopied] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => { setMachineId(getMachineId()); }, []);

	const copyMachineId = useCallback(() => {
		navigator.clipboard.writeText(machineId).catch(() => {
			const el = document.createElement('textarea'); el.value = machineId;
			document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
		});
		setCopied(true); setTimeout(() => setCopied(false), 2500);
	}, [machineId]);

	const handleActivate = useCallback(async () => {
		const key = activationKey.trim();
		if (!key) { setError("Veuillez saisir votre clé d'activation."); return; }
		setIsVerifying(true); setError(null);
		try {
			const result = await verifyKey(key);
			if (result.valid) { await saveLicence(key); setSuccess(true); setTimeout(onActivated, 1800); }
			else setError(result.error ?? 'Clé invalide.');
		} catch { setError('Erreur lors de la vérification. Réessayez.'); }
		finally { setIsVerifying(false); }
	}, [activationKey, onActivated]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isVerifying && !success) handleActivate();
	}, [handleActivate, isVerifying, success]);

	return (
		<div className="licence-overlay fixed inset-0 z-50 flex items-center justify-center overflow-auto py-8">
			<div className="licence-card relative mx-auto w-full max-w-sm rounded-3xl p-4">
				<div className="mb-8 flex flex-col items-center text-center">
					<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
						<Shield className="h-8 w-8 text-indigo-600" />
					</div>
					<h1 className="text-xl font-semibold text-slate-900">Activation du logiciel</h1>
					<p className="licence-muted mt-1 text-xs">Astra — Protection de licence</p>
				</div>

				<div className="mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
					<div className="mb-2 flex items-center gap-2">
						<Monitor className="h-4 w-4 text-slate-500" />
						<span className="licence-label text-xs font-medium uppercase tracking-widest">Votre ID Machine</span>
					</div>
					<div className="flex items-center justify-between gap-3">
						<code className="licence-machine flex-1 rounded-xl border px-2 py-3 text-center font-mono text-xl font-bold tracking-[0.25em]">{machineId || '········'}</code>
						<button onClick={copyMachineId} title="Copier l'ID Machine" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
							{copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5 text-slate-600" />}
						</button>
					</div>
					<p className="licence-muted mt-2 text-center text-xs">Envoyez cet ID à l'administrateur pour recevoir votre clé d'activation.</p>
				</div>

				<div className="mb-4">
					<label className="licence-label mb-2 flex items-center gap-2 text-sm font-medium"><Key className="h-4 w-4" />Clé d'activation</label>
					<input value={activationKey} onChange={e => {
						const raw = e.target.value.replace(/[^BCDFGHJKMNPQRTVWXY2346789]/gi, '').toUpperCase();
						setActivationKey((raw.match(/.{1,5}/g)?.join('-') ?? raw).slice(0, 29)); setError(null);
					}} onKeyDown={handleKeyDown} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" disabled={isVerifying || success} className="licence-input w-full rounded-xl px-4 py-3 font-mono text-sm outline-none transition-all text-center tracking-widest" />
				</div>

				{error && <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /><span>{error}</span></div>}
				{success && <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle className="h-5 w-5 flex-shrink-0" /><span>Licence activée avec succès ! Ouverture du logiciel…</span></div>}

				<button onClick={handleActivate} disabled={isVerifying || success || !activationKey.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all disabled:opacity-50">
					{isVerifying ? <><Loader2 className="h-4 w-4 animate-spin" /> Vérification…</> : success ? <><CheckCircle className="h-4 w-4" /> Activé</> : <><Lock className="h-4 w-4" /> Activer le logiciel</>}
				</button>

				<p className="licence-muted mt-5 text-center text-xs">Besoin d'aide ? <a href="mailto:massamagoita79@gmail.com" className="text-indigo-600 hover:text-indigo-700">Contactez l'administrateur</a></p>
			</div>
		</div>
	);
}
