import React, { useState, useEffect, useCallback } from 'react';
import {
	Shield,
	Copy,
	Check,
	Key,
	Monitor,
	AlertTriangle,
	CheckCircle,
	Loader2,
	Lock,
} from 'lucide-react';
import { getMachineId } from './machineId.ts';
import { verifyKey, saveLicence } from './licenceVerifier.ts';

interface Props {
	onActivated: () => void;
}

export function LicenceModal({ onActivated }: Props) {
	const [machineId, setMachineId] = useState('');
	const [activationKey, setActivationKey] = useState('');
	const [copied, setCopied] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		setMachineId(getMachineId());
	}, []);

	const copyMachineId = useCallback(() => {
		navigator.clipboard.writeText(machineId).catch(() => {
			// Fallback si clipboard API indisponible
			const el = document.createElement('textarea');
			el.value = machineId;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		});
		setCopied(true);
		setTimeout(() => setCopied(false), 2500);
	}, [machineId]);

	const handleActivate = useCallback(async () => {
		const key = activationKey.trim();
		if (!key) {
			setError('Veuillez saisir votre clé d\'activation.');
			return;
		}
		setIsVerifying(true);
		setError(null);
		try {
			const result = await verifyKey(key);
			if (result.valid) {
				await saveLicence(key);
				setSuccess(true);
				setTimeout(onActivated, 1800);
			} else {
				setError(result.error ?? 'Clé invalide.');
			}
		} catch {
			setError('Erreur lors de la vérification. Réessayez.');
		} finally {
			setIsVerifying(false);
		}
	}, [activationKey, onActivated]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !isVerifying && !success) handleActivate();
		},
		[handleActivate, isVerifying, success]
	);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto py-8"
			style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
		>
			{/* Cercles décoratifs en arrière-plan */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-20"
					style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
				<div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-20"
					style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
			</div>

			{/* Carte principale */}
			<div
				className="relative mx-2 w-full max-w-sm rounded-3xl p-4 shadow-2xl"
				style={{
					background: 'rgba(255,255,255,0.06)',
					backdropFilter: 'blur(24px)',
					border: '1px solid rgba(255,255,255,0.12)',
				}}
			>
				{/* En-tête */}
				<div className="mb-8 flex flex-col items-center text-center">
					<div
						className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
						style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.5)' }}
					>
						<Shield className="h-8 w-8 text-indigo-300" />
					</div>
					<h1 className="text-xl font-semibold text-white">Activation du logiciel</h1>
					<p className="mt-1 text-xs text-slate-400">
						Gestion Cyber — Protection de licence
					</p>
				</div>

				{/* Bloc ID Machine */}
				<div
					className="mb-3 rounded-2xl p-4"
					style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
				>
					<div className="mb-2 flex items-center gap-2">
						<Monitor className="h-4 w-4 text-slate-400" />
						<span className="text-xs font-medium uppercase tracking-widest text-slate-400">
							Votre ID Machine
						</span>
					</div>
					<div className="flex items-center justify-between gap-3">
						<code
							className="flex-1 rounded-xl px-2 py-3 text-center font-mono text-xl font-bold tracking-[0.25em] text-white"
							style={{ background: 'rgba(99,102,241,0.15)', letterSpacing: '0.25em' }}
						>
							{machineId || '········'}
						</code>
						<button
							onClick={copyMachineId}
							title="Copier l'ID Machine"
							className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all"
							style={{
								background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
								border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
							}}
						>
							{copied
								? <Check className="h-5 w-5 text-emerald-400" />
								: <Copy className="h-5 w-5 text-slate-300" />
							}
						</button>
					</div>
					<p className="mt-2 text-center text-xs text-slate-500">
						Envoyez cet ID à l'administrateur pour recevoir votre clé d'activation.
					</p>
				</div>

				{/* Étapes visuelles */}
				

				{/* Saisie de la clé */}
				<div className="mb-4">
					<label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
						<Key className="h-4 w-4" />
						Clé d'activation
					</label>
					<input
						value={activationKey}
						onChange={e => {
							// Supprimer tout ce qui n'est pas alphanumérique
							const raw = e.target.value.replace(/[^BCDFGHJKMNPQRTVWXY2346789]/gi, '').toUpperCase();
							// Insérer les tirets automatiquement tous les 5 caractères
							const formatted = raw.match(/.{1,5}/g)?.join('-') ?? raw;
							// Limiter à 29 caractères (25 + 4 tirets)
							setActivationKey(formatted.slice(0, 29));
							setError(null);
						}}
						onKeyDown={handleKeyDown}
						placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
						disabled={isVerifying || success}
						className="w-full rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none transition-all tracking-widest text-center"
						style={{
							background: 'rgba(255,255,255,0.07)',
							border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
							letterSpacing: '0.15em',
						}}
						onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; }}
						onBlur={e => { e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'; }}
					/>
				</div>

				{/* Message d'erreur */}
				{error && (
					<div
						className="mb-4 flex items-start gap-2 rounded-xl p-3 text-sm text-red-300"
						style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
					>
						<AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
						<span>{error}</span>
					</div>
				)}

				{/* Message de succès */}
				{success && (
					<div
						className="mb-4 flex items-center gap-2 rounded-xl p-3 text-sm text-emerald-300"
						style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
					>
						<CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
						<span>Licence activée avec succès ! Ouverture du logiciel…</span>
					</div>
				)}

				{/* Bouton d'activation */}
				<button
					onClick={handleActivate}
					disabled={isVerifying || success || !activationKey.trim()}
					className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
					style={{
						background: success
							? 'rgba(16,185,129,0.7)'
							: 'linear-gradient(135deg, #6366f1, #4f46e5)',
						boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
					}}
				>
					{isVerifying ? (
						<><Loader2 className="h-4 w-4 animate-spin" /> Vérification…</>
					) : success ? (
						<><CheckCircle className="h-4 w-4" /> Activé</>
					) : (
						<><Lock className="h-4 w-4" /> Activer le logiciel</>
					)}
				</button>

				{/* Contact admin */}
				<p className="mt-5 text-center text-xs text-slate-500">
					Besoin d'aide ?{' '}
					<a
						href="mailto:massamagoita79@gmail.com"
						className="text-indigo-400 transition-colors hover:text-indigo-300"
					>
						Contactez l'administrateur
					</a>
				</p>
			</div>
		</div>
	);
}
