module.exports = {
  CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
  CLIENT_SECRET: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
  TARGET_EMAIL: process.env.GOOGLE_DRIVE_TARGET_EMAIL || '',
  FOLDER_NAME: 'MonLogiciel - Sauvegardes',
  SCOPES: ['https://www.googleapis.com/auth/drive.file'],
};
