export const DEFAULT_ADMIN_CREDENTIALS = {
  username: import.meta.env.VITE_DEFAULT_ADMIN_USERNAME || '',
  password: import.meta.env.VITE_DEFAULT_ADMIN_PASSWORD || '',
  name: import.meta.env.VITE_DEFAULT_ADMIN_NAME || 'Administrateur',
  role: 'admin' as const,
};

export const APP_CONFIG = {
  name: 'CYBER CAFÉ PRO',
  version: '1.0.5',
  currency: 'FCFA',
  locale: 'fr-FR',
  autoLogoutOnClose: true,
};
