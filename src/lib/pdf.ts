import type { Sale } from './types';

// ─── Palette ───────────────────────────────────────────────────────────────
const INDIGO   = [63,  63, 235] as const;   // #3F3FEB — couleur principale
const INDIGO_L = [232, 232, 252] as const;  // fond léger entête tableau
const INDIGO_M = [180, 180, 245] as const;  // bordures / lignes
const WHITE    = [255, 255, 255] as const;
const DARK     = [25,  25,  50]  as const;  // texte principal
const MUTED    = [120, 120, 150] as const;  // texte secondaire
const TOTAL_BG = [238, 242, 255] as const;  // fond total

function rgbToHex([r, g, b]: readonly number[]): string {
	return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Rasterise un SVG (string) en PNG data-URL utilisable par doc.addImage.
// Nécessite un environnement navigateur (Image + canvas), ce qui est le cas
// puisque ce module est chargé côté client au moment de générer le PDF.
function svgToPngDataUrl(svgMarkup: string, pxSize = 200): Promise<string> {
	return new Promise((resolve, reject) => {
		const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
		const url = URL.createObjectURL(svgBlob);
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = pxSize;
			canvas.height = pxSize;
			const ctx = canvas.getContext('2d');
			if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Canvas 2D non disponible')); return; }
			ctx.drawImage(img, 0, 0, pxSize, pxSize);
			URL.revokeObjectURL(url);
			resolve(canvas.toDataURL('image/png'));
		};
		img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
		img.src = url;
	});
}

// Icône gauche : boîte / fournitures (façon étagère de la boutique)
function packageIconSvg(hex: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${hex}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
		<path d="M21 8l-9-5-9 5 9 5 9-5z"/>
		<path d="M3 8v8l9 5 9-5V8"/>
		<path d="M12 13v8"/>
	</svg>`;
}

// Icône droite : imprimante
function printerIconSvg(hex: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${hex}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
		<path d="M6 9V2h12v7"/>
		<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
		<rect x="6" y="14" width="12" height="8"/>
	</svg>`;
}

function fmt(n: number): string {

	const sign = n < 0 ? '-' : '';
	const abs = Math.round(Math.abs(n));
	return sign + abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function numberToWords(n: number): string {
	// Conversion simplifiée en toutes lettres (FCFA)
	if (n === 0) return 'zéro franc CFA';
	const unites = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
		'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
	const dizaines = ['','','vingt','trente','quarante','cinquante',
		'soixante','soixante','quatre-vingt','quatre-vingt'];

	function belowThousand(num: number): string {
		if (num === 0) return '';
		if (num < 20) return unites[num];
		const d = Math.floor(num / 10);
		const u = num % 10;
		if (d === 7) return u === 1 ? 'soixante et onze' : `soixante-${unites[10 + u]}`;
		if (d === 8) return u === 0 ? 'quatre-vingts' : `quatre-vingt-${unites[u]}`;
		if (d === 9) return `quatre-vingt-${unites[10 + u]}`;
		if (u === 0) return dizaines[d];
		if (u === 1 && d !== 8) return `${dizaines[d]} et un`;
		return `${dizaines[d]}-${unites[u]}`;
	}

	function convert(num: number): string {
		if (num >= 1_000_000) {
			const m = Math.floor(num / 1_000_000);
			const r = num % 1_000_000;
			return `${m === 1 ? 'un million' : `${convert(m)} millions`}${r ? ` ${convert(r)}` : ''}`;
		}
		if (num >= 1000) {
			const k = Math.floor(num / 1000);
			const r = num % 1000;
			return `${k === 1 ? 'mille' : `${convert(k)} mille`}${r ? ` ${convert(r)}` : ''}`;
		}
		if (num >= 100) {
			const c = Math.floor(num / 100);
			const r = num % 100;
			return `${c === 1 ? 'cent' : `${unites[c]} cent${r ? '' : 's'}`}${r ? ` ${belowThousand(r)}` : ''}`;
		}
		return belowThousand(num);
	}

	const words = convert(Math.round(n));
	return `${words.charAt(0).toUpperCase() + words.slice(1)} franc${Math.round(n) > 1 ? 's' : ''} CFA`;
}

export async function generateReceiptPDF(
	sale: Sale,
	shopName = 'LIBRAIRIE PAPETERIE DOUMBIALA',
	shopSub  = 'Tout pour les Matériels Bureautiques et Informatiques',
	shopInfo = 'Chez Bakary DOUMBIA — En Face de la Gendarmerie de Baguinéda',
	shopTel  = 'Tél: 76 68 64 43 / 65 02 38 93 / 76 97 36 98 / 65 23 49 41',
): Promise<void> {
	const { jsPDF } = await import('jspdf');

	// ── Format A5 portrait ────────────────────────────────────────────────────
	const doc = new (jsPDF as any)({ format: 'a5', unit: 'mm', orientation: 'portrait' });
	const W   = doc.internal.pageSize.getWidth();   // 148 mm
	const H   = doc.internal.pageSize.getHeight();  // 210 mm
	const ML  = 6;  // marge gauche
	const MR  = 6;  // marge droite
	const CW  = W - ML - MR;  // largeur utile = 128 mm

	// ── Colonnes du tableau ───────────────────────────────────────────────────
	// QTE | DÉSIGNATION | P.U. | MONTANT
	const C_QTE_W  = 14;
	const C_MONT_W = 28;
	const C_PU_W   = 24;
	const C_DES_W  = CW - C_QTE_W - C_PU_W - C_MONT_W;  // ~62 mm

	const X_QTE   = ML;
	const X_DES   = X_QTE + C_QTE_W;
	const X_PU    = X_DES + C_DES_W;
	const X_MONT  = X_PU  + C_PU_W;
	const X_RIGHT = X_MONT + C_MONT_W;  // = W - MR

	const ROW_H    = 7;
	const HEADER_H = 8;

	// Espace réservé en bas de page : pied de page + arrêté (dernière page seulement)
	const FOOTER_RESERVE  = 20; // mm — pied de page
	const SUMMARY_RESERVE = 22; // mm — "Arrêté à la somme de" + montant en lettres
	// Limite de y à ne pas dépasser pour les articles (hors dernière page)
	const Y_MAX_BODY = H - FOOTER_RESERVE - ROW_H; // laisser place à la ligne TOTAL sur la même page

	// Icônes SVG de l'en-tête, rasterisées en amont (doc.addImage veut du PNG)
	const indigoHex = rgbToHex(INDIGO);
	const [iconLeftUrl, iconRightUrl] = await Promise.all([
		svgToPngDataUrl(packageIconSvg(indigoHex)),
		svgToPngDataUrl(printerIconSvg(indigoHex)),
	]);

	// ═══════════════════════════════════════════════════════════════════════════
	// HELPERS — dessin de l'en-tête et de l'entête du tableau
	// (réutilisés sur chaque nouvelle page)
	// ═══════════════════════════════════════════════════════════════════════════

	/** Dessine le bloc en-tête boutique + numéro facture.
	 *  Retourne le y juste après la dernière ligne de l'en-tête. */
	function drawPageHeader(pageNum: number): number {
		let y = ML;
		const headerH = 34;

		// Fond blanc + bordure indigo
		doc.setFillColor(...WHITE);
		doc.roundedRect(ML, y, CW, headerH, 4, 4, 'F');
		doc.setDrawColor(...INDIGO);
		doc.setLineWidth(0.7);
		doc.roundedRect(ML, y, CW, headerH, 4, 4, 'S');

		// Icônes
		const iconSize = 13;
		const iconTopY = y + 7 - iconSize / 2 + 1;
		doc.addImage(iconLeftUrl,  'PNG', ML + 3,                  iconTopY, iconSize, iconSize);
		doc.addImage(iconRightUrl, 'PNG', X_RIGHT - 3 - iconSize,  iconTopY, iconSize, iconSize);

		// Nom boutique
		doc.setTextColor(...INDIGO);
		doc.setFontSize(12);
		doc.setFont('helvetica', 'bold');
		doc.text(shopName, W / 2, y + 7, { align: 'center' });

		// Sous-titre
		doc.setFontSize(7);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(...DARK);
		doc.text(shopSub, W / 2, y + 12, { align: 'center' });

		// Gérant + adresse
		const [ownerLine, addressLine] = shopInfo.includes('—')
			? shopInfo.split('—').map(s => s.trim())
			: [shopInfo, ''];

		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...DARK);
		doc.text(ownerLine, W / 2, y + 16.5, { align: 'center' });

		if (addressLine) {
			doc.setFontSize(6.5);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(...MUTED);
			doc.text(addressLine, W / 2, y + 20.5, { align: 'center' });
		}

		// Téléphones
		doc.setFontSize(6.8);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...INDIGO);
		doc.text(shopTel, W / 2, y + 26, { align: 'center' });

		// Numéro facture + Date (page 1) ou indication "suite" (pages suivantes)
		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(...DARK);
		if (pageNum === 1) {
			doc.text(`FACTURE N° ${sale.receiptNumber}`, ML + 2, y + headerH + 4.5);
		} else {
			doc.text(`FACTURE N° ${sale.receiptNumber}  (suite p.${pageNum})`, ML + 2, y + headerH + 4.5);
		}
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(...MUTED);
		doc.text(
			`Bamako, le ${new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
			X_RIGHT - 2,
			y + headerH + 4.5,
			{ align: 'right' },
		);

		y += headerH + 9;

		// Ligne décorative
		doc.setDrawColor(...INDIGO);
		doc.setLineWidth(0.4);
		doc.line(ML + 2, y, X_RIGHT - 2, y);

		// Caissier (page 1 uniquement)
		if (pageNum === 1) {
			y += 5;
			doc.setFontSize(6.5);
			doc.setFont('helvetica');
			doc.setTextColor(...DARK);
			doc.text(`Caissier : ${sale.userName}`, ML + 2, y);
			y += 5;
		} else {
			y += 5;
		}

		return y;
	}

	/** Dessine l'entête du tableau (QTE / DÉSIGNATION / P.U. / MONTANT).
	 *  Retourne le y juste après l'entête. */
	function drawTableHeader(y: number): number {
		// Fond indigo entête
		doc.setFillColor(...INDIGO);
		doc.roundedRect(X_QTE, y, CW, HEADER_H, 2, 2, 'F');
		doc.rect(X_QTE, y + HEADER_H / 2, CW, HEADER_H / 2, 'F');

		// Labels
		doc.setTextColor(...WHITE);
		doc.setFontSize(7.5);
		doc.setFont('helvetica', 'bold');
		const hY = y + HEADER_H / 2 + 2.5;
		doc.text('QTE',         X_QTE  + C_QTE_W  / 2, hY, { align: 'center' });
		doc.text('DÉSIGNATION', X_DES  + C_DES_W  / 2, hY, { align: 'center' });
		doc.text('P.U.',        X_PU   + C_PU_W   / 2, hY, { align: 'center' });
		doc.text('MONTANT',     X_MONT + C_MONT_W / 2, hY, { align: 'center' });

		// Séparateurs verticaux
		doc.setDrawColor(...WHITE);
		doc.setLineWidth(0.3);
		[X_DES, X_PU, X_MONT].forEach(x => doc.line(x, y, x, y + HEADER_H));

		return y + HEADER_H;
	}

	/** Dessine le pied de page sur la page courante. */
	function drawPageFooter(): void {
		const footerY = H - 8;
		doc.setFontSize(6);
		doc.setFont('helvetica', 'italic');
		doc.setTextColor(...MUTED);
		doc.text('Merci pour votre confiance — Conservez ce reçu comme preuve de paiement.', W / 2, footerY, { align: 'center' });
		doc.setDrawColor(...INDIGO_M);
		doc.setLineWidth(0.3);
		doc.line(ML, footerY - 3, X_RIGHT, footerY - 3);
	}

	/** Dessine le filigrane ANNULÉ sur la page courante. */
	function drawCancelledWatermark(): void {
		if (sale.status === 'cancelled') {
			doc.setFontSize(52);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(220, 50, 50);
			doc.text('ANNULÉ', W / 2, H / 2, { align: 'center', angle: 40 });
		}
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// RENDU PRINCIPAL — pagination automatique
	// ═══════════════════════════════════════════════════════════════════════════
	let pageNum = 1;
	let y = drawPageHeader(pageNum);
	y = drawTableHeader(y);

	// Contour du tableau — sera redéfini à chaque page
	// On garde la position de départ de la zone articles pour pouvoir fermer le cadre
	let tableStartY = y - HEADER_H; // inclut l'entête

	doc.setLineWidth(0.2);

	for (let i = 0; i < sale.items.length; i++) {
		const item = sale.items[i];

		// ── Vérification : est-ce qu'il reste de la place pour cette ligne ? ──
		// Sur la dernière ligne d'article, on réserve aussi la place pour la ligne TOTAL
		// et, s'il n'y a plus d'article après, pour le résumé + pied de page.
		const isLastItem = i === sale.items.length - 1;
		const spaceNeeded = ROW_H + ROW_H // ligne article + ligne TOTAL
			+ (isLastItem ? SUMMARY_RESERVE : 0);

		if (y + spaceNeeded > H - FOOTER_RESERVE) {
			// ── Fermer le cadre du tableau sur la page courante ───────────────
			doc.setDrawColor(...INDIGO);
			doc.setLineWidth(0.5);
			doc.roundedRect(X_QTE, tableStartY, CW, y - tableStartY, 2, 2, 'S');

			drawPageFooter();
			drawCancelledWatermark();

			// ── Nouvelle page ─────────────────────────────────────────────────
			doc.addPage();
			pageNum++;
			y = drawPageHeader(pageNum);
			y = drawTableHeader(y);
			tableStartY = y - HEADER_H;
		}

		// ── Dessin de la ligne article ────────────────────────────────────────
		const rowY = y;

		// Fond alterné
		if (i % 2 === 0) {
			doc.setFillColor(...INDIGO_L);
		} else {
			doc.setFillColor(...WHITE);
		}
		doc.rect(X_QTE, rowY, CW, ROW_H, 'F');

		// Ligne horizontale de séparation
		doc.setDrawColor(...INDIGO_M);
		doc.setLineWidth(0.2);
		doc.line(X_QTE, rowY + ROW_H, X_RIGHT, rowY + ROW_H);

		// Séparateurs verticaux
		[X_DES, X_PU, X_MONT].forEach(x => {
			doc.setDrawColor(...INDIGO_M);
			doc.line(x, rowY, x, rowY + ROW_H);
		});

		// Texte de la ligne
		const tY = rowY + ROW_H / 2 + 2;
		doc.setTextColor(...DARK);
		doc.setFontSize(7.5);
		doc.setFont('helvetica', 'normal');

		doc.text(String(item.quantity), X_QTE + C_QTE_W / 2, tY, { align: 'center' });

		const nameStr = doc.splitTextToSize(item.name, C_DES_W - 3)[0] as string;
		doc.text(nameStr, X_DES + 2, tY);

		doc.text(fmt(item.unitPrice), X_PU + C_PU_W - 2, tY, { align: 'right' });

		doc.setFont('helvetica', 'bold');
		doc.text(fmt(item.total), X_MONT + C_MONT_W - 2, tY, { align: 'right' });

		y += ROW_H;
	}

	// ═══════════════════════════════════════════════════════════════════════════
	// LIGNE TOTAL (toujours sur la même page que le dernier article)
	// ═══════════════════════════════════════════════════════════════════════════
	const totalRowY = y;

	doc.setFillColor(...TOTAL_BG);
	doc.roundedRect(X_QTE, totalRowY, CW, ROW_H, 2, 2, 'F');
	doc.rect(X_QTE, totalRowY, CW, ROW_H / 2, 'F');

	doc.setDrawColor(...INDIGO_M);
	doc.setLineWidth(0.2);
	[X_DES, X_PU, X_MONT].forEach(x =>
		doc.line(x, totalRowY, x, totalRowY + ROW_H)
	);

	const tTY = totalRowY + ROW_H / 2 + 2.5;
	doc.setFontSize(8.5);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...INDIGO);
	doc.text('TOTAL', X_QTE + (C_QTE_W + C_DES_W + C_PU_W) / 2, tTY, { align: 'center' });
	doc.setFontSize(9);
	doc.text(`${fmt(sale.totalAmount)} FCFA`, X_MONT + C_MONT_W - 2, tTY, { align: 'right' });

	y += ROW_H;

	// ── Fermer le cadre du tableau ────────────────────────────────────────────
	doc.setDrawColor(...INDIGO);
	doc.setLineWidth(0.5);
	doc.roundedRect(X_QTE, tableStartY, CW, y - tableStartY, 2, 2, 'S');

	y += 4;

	// ═══════════════════════════════════════════════════════════════════════════
	// ARRÊTÉ À LA SOMME DE
	// ═══════════════════════════════════════════════════════════════════════════
	doc.setFontSize(7);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(...DARK);
	doc.text('Arrêté la présente facture à la somme de :', ML, y + 4);

	const words = numberToWords(sale.totalAmount);
	const wordsLines = doc.splitTextToSize(words, CW) as string[];
	doc.setFont('helvetica', 'italic');
	doc.setTextColor(...INDIGO);
	doc.setFontSize(6.5);
	doc.text(wordsLines, ML, y + 9);

	// ═══════════════════════════════════════════════════════════════════════════
	// PIED DE PAGE  +  FILIGRANE (dernière page)
	// ═══════════════════════════════════════════════════════════════════════════
	drawPageFooter();
	drawCancelledWatermark();

	// ── Sauvegarde ────────────────────────────────────────────────────────────
	doc.save(`facture-${sale.receiptNumber}.pdf`);
}