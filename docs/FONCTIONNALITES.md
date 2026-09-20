# Rapport fonctionnel — GestCy / Gestion Cyber

## Vue d'ensemble
Application de gestion offline-first destinée à une activité de cybercafé / librairie-papeterie. Elle utilise React, TypeScript et Vite, avec stockage local, licence, sauvegarde et une enveloppe desktop Electron.

## Fonctionnalités
### Authentification
- Connexion / déconnexion
- Sessions utilisateur
- Rôles administrateur et utilisateur
- Accès administration réservé à l'administrateur
- Vérification de licence après connexion
- Profil et avatar

### Tableau de bord
- Recettes du jour
- Nombre de ventes
- Crédits en cours
- Alertes de stock
- Revenu net journalier
- Remboursements du jour
- Graphique recettes/dépenses sur 7 jours
- Accès rapide aux modules

### Gestion du stock
- Création, modification et suppression d'articles
- Catégories, prix, unités
- Quantité et seuil minimal
- Alertes de stock faible
- Ajustement du stock
- Historique des mouvements
- Utilisateur et note associés aux mouvements

### Ventes
- Nouvelle vente
- Articles et prestations
- Quantités et calculs
- Numéro de reçu
- Décrémentation automatique du stock
- Annulation et restauration du stock
- Historique et statuts

### Emprunts / crédit
- Création d'emprunt
- Client, téléphone, article et montant
- Sélection d'article disponible
- Contrôle de stock
- Déduction du stock
- Recherche et filtres
- États en cours / remboursé
- Enregistrement du remboursement
- Intégration aux recettes

### Prestations
- Création, modification et suppression
- Catégorie, prix et description
- Utilisation dans les ventes

### Comptabilité et dépenses
- Recettes
- Remboursements
- Dépenses
- Résultat net
- Graphiques
- Libellé, montant, date et utilisateur pour les dépenses

### Administration
- Création, modification et suppression des utilisateurs
- Gestion des rôles

### Paramètres
- Profil et mot de passe
- Avatar
- Thèmes
- Sauvegarde automatique
- Intervalle de sauvegarde
- Sauvegarde manuelle
- Restauration JSON
- Google Drive sur desktop
- Informations système

### Sauvegarde
- Export JSON
- Restauration
- Sauvegarde automatique
- Google Drive via OAuth dans Electron
- Jetons protégés par le coffre-fort système lorsqu'il est disponible

### Licence
- Stockage local
- Identifiant machine
- Validation de format
- Correspondance machine
- Vérification cryptographique
- Blocage si licence invalide

## Migration Ionic
La branche ionic-migration ajoute Ionic React et Capacitor, conserve les écrans et la logique React pendant la migration progressive et prépare Android/iOS ainsi qu'un responsive mobile/tablette/desktop.

## Sécurité
Mesures appliquées :
- suppression des identifiants administrateur codés en dur ;
- configuration des secrets par environnement ;
- suppression de la désactivation globale de TLS ;
- Electron avec isolation du renderer ;
- cleartext et mixed content désactivés dans Capacitor ;
- état OAuth aléatoire ;
- jetons Google protégés par safeStorage lorsque disponible ;
- portée Google Drive limitée à drive.file.

## Risques résiduels
- Le hash de mot de passe actuel reste une solution locale légère et devrait être remplacé par Argon2id/bcrypt/scrypt avec backend pour un contexte fortement sécurisé.
- Les données locales restent modifiables par un utilisateur ayant accès au stockage.
- Un secret distribué dans une application cliente ne peut pas être considéré comme totalement secret.
- La licence devrait être vérifiée par un backend de confiance pour une protection commerciale forte.
- Un audit des dépendances et des builds Android/iOS doit précéder la production.

## Architecture fonctionnelle
Authentification → Licence → Tableau de bord → Stock / Ventes / Historique / Crédit / Prestations / Comptabilité / Dépenses / Administration / Paramètres.
