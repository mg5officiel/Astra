export {};

declare global {
	interface Window {
		gdrive?: {
			isConfigured: () => Promise<boolean>;
			getTargetEmail: () => Promise<string | null>;
			uploadBackup: (
				filename: string,
				jsonContent: string
			) => Promise<{
				ok: boolean;
				error?: string;
				file?: { id: string; name: string; webViewLink?: string };
			}>;
			disconnect: () => Promise<{ ok: boolean }>;
		};
	}
}
