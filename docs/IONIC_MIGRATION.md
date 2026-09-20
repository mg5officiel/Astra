# Migration Ionic — GestCy

## Objectif

La branche `ionic-migration` prépare l'application GestCy à fonctionner avec Ionic React + Capacitor tout en conservant l'identité visuelle et la logique métier existantes.

## Architecture

- **React + TypeScript** : composants et logique métier.
- **Ionic React** : shell applicatif, navigation mobile, composants natifs et adaptation tactile.
- **Capacitor** : cible Android/iOS à partir du build web.
- **Tailwind CSS + thème existant** : conservation du design actuel.
- **Electron** : conservé pour la distribution desktop existante.

## Commandes

```bash
npm install
npm run dev
npm run build
npm run ionic:build

# Après installation d'une plateforme Capacitor
npx cap add android
npx cap add ios
npm run cap:sync
npm run android
npm run ios
```

## Principes de maintenance

1. La logique métier reste dans le contexte et les services existants.
2. Les pages doivent rester centrées sur la composition de l'interface.
3. Les composants Ionic sont privilégiés pour les interactions mobiles : `IonModal`, `IonAlert`, `IonInput`, `IonSelect`, `IonSearchbar`, `IonList`, etc.
4. Les commentaires en français sont réservés aux décisions techniques ou comportements non évidents.
5. Les secrets ne doivent jamais être commités.
6. Les permissions Capacitor doivent être limitées au besoin fonctionnel réel.

## Sécurité

Le shell Electron a été renforcé avec :

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- navigation sortante contrôlée
- ouverture externe limitée aux URL HTTPS
- validation de l'émetteur IPC
- validation du nom et de la taille des sauvegardes
- Content Security Policy côté interface
- variables d'environnement pour les identifiants sensibles

La sécurité des mots de passe reste un point à traiter avec un mécanisme de dérivation cryptographique moderne et un sel par utilisateur avant une utilisation en production à grande échelle.

## Validation continue

Le workflow `.github/workflows/ionic-ci.yml` vérifie automatiquement TypeScript et le build Vite sur la branche de migration.
