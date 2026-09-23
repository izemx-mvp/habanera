# Mise à jour ciblée Habanera

## Objectif

Conserver les pages, routes et parcours actuels, puis ajouter uniquement les fonctions demandées : sauvegarde rapide d’inventaire, prélèvements séparés Bar/Cuisine avec validation individuelle ou groupée, catégorisation de stock plus lisible et données de démonstration enrichies.

## Modifications prévues

### Charte visuelle
- Maintenir l’application en mode clair sans commande de thème.
- Corriger la sidebar et le panneau gauche de connexion vers le chocolat profond `#1d0d0b`.
- Conserver le brun `#603c2e` pour les actions courantes.
- Vérifier les statuts : rouge critique/destructif, orange élevé, jaune modéré, vert validé/résolu/intégré.

### Inventaire
- Ajouter en haut un bouton « Enregistrer » distinct de « Clôturer l’inventaire ».
- Sauvegarder instantanément le comptage courant dans l’état de la session et confirmer l’action visuellement, sans ajuster ni clôturer les stocks.

### Bons de prélèvement
- Remplacer le filtre de destination par deux onglets explicites : « Fenêtre Bar » et « Fenêtre Cuisine ».
- Ajouter les filtres Fréquence (Tous, Quotidien, Hebdo) et Date.
- Permettre la validation ligne par ligne et « Tout valider » pour les lignes visibles du service actif.
- Conserver pour chaque validation un bon durable dans la session, avec boutons Aperçu et Télécharger toujours disponibles.
- Générer des références au format `PR-2026-0923-01` et inclure les champs officiels : date, service demandeur, demandeur, validateur, code article, désignation, quantités demandée/servie, unité et observation.

### Produits & Stocks
- Ajouter un filtre de service Bar/Cuisine/Économat.
- Afficher clairement le service de chaque produit dans le tableau avec un repère visuel lisible.

### Données de démonstration
- Enrichir les produits Bar et Cuisine avec boissons, liqueurs, verrerie, produits frais, épicerie et produits secs.
- Ajouter plusieurs fournisseurs marrakchis avec coordonnées et offres associées aux nouveaux produits.
- Ajouter des alertes critiques, élevées, modérées et déjà résolues pour tester tous les filtres.

## Détails techniques

- Étendre l’état React partagé existant sans backend ni changement de routes.
- Réutiliser le générateur PDF et l’aperçu documentaire existants.
- Garder les contrôles accessibles au clavier et adaptés aux écrans ordinateur/mobile.
- Utiliser uniquement les couleurs centralisées du thème et les composants d’interface existants.

## Vérification

- Tester connexion, thème clair, couleurs principales et absence de commande sombre.
- Tester sauvegarde d’inventaire, onglets Bar/Cuisine, filtres fréquence/date, validation individuelle et groupée.
- Vérifier que les boutons Aperçu/Téléchargement restent présents après validation et que le PDF contient toutes les colonnes officielles.
- Vérifier les nouveaux filtres de stocks, fournisseurs et niveaux d’alertes sur ordinateur et mobile, sans erreur visible.
