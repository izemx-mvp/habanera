# Évolution opérationnelle Habanera

## Objectif

Transformer le MVP actuel en outil opérationnel traçable : navigation corrective depuis le tableau de bord, filtres multicritères, fiches détaillées, statuts modifiables et documents officiels consultables, imprimables et téléchargeables.

Les données restent simulées dans le navigateur, conformément au MVP existant. Elles se réinitialisent au rechargement complet de la session.

## Direction visuelle

- Retirer entièrement le mode sombre et son bouton.
- Utiliser `#603c2e` comme couleur principale pour la navigation, les actions courantes et les éléments structurants.
- Réserver le rouge aux erreurs, suppressions, ruptures et alertes critiques.
- Décliner les statuts avec les rôles visuels demandés : orange pour « Élevé », jaune pour « Modéré », vert pour succès/résolu/validé/intégré.
- Conserver le shell, l’avatar Salah Bennani, son menu et le footer IZEMX sur toutes les pages.

## Socle partagé

- Enrichir l’état opérationnel avec les statuts complets, dates effectives/reportées, quantités commandées et reçues, prix, coordonnées fournisseurs, historiques d’inventaire et traces de résolution.
- Centraliser les changements afin qu’une réception, un prélèvement, une commande ou un ajustement mette à jour les stocks et l’historique associé.
- Créer un aperçu documentaire réutilisable avec en-tête Habanera, référence, métadonnées, tableau des lignes, montants et zones de signature.
- Générer côté navigateur cinq documents PDF : bon de prélèvement, bon de réception, rapport de caisse Z, rapport d’inventaire et bon de commande. Chaque aperçu proposera Imprimer et Télécharger.

## Écrans à mettre à niveau

### Tableau de bord

- Rendre les quatre KPI accessibles au clavier et cliquables avec redirection vers Stocks, Alertes, Prélèvements ou Achats.
- Rendre chaque anomalie cliquable et l’envoyer vers sa vue corrective : rupture vers Alertes/Stocks, écart vers Inventaire, réception partielle vers Achats.
- Ajouter un retour visuel discret à l’interaction sans transformer les cartes en éléments décoratifs.

### Bons de prélèvement

- Ajouter recherche produit, destination et niveau d’alerte.
- Conserver les suggestions automatiques et la validation unitaire avec mise à jour immédiate du stock.
- Après validation, ouvrir automatiquement l’aperçu du bon généré avec impression et téléchargement PDF.

### Achats & Réceptions

- Ajouter recherche par référence/fournisseur/produit, fournisseur, plage de dates et statut.
- Rendre les lignes cliquables et ouvrir un panneau de détails.
- Permettre les statuts En cours, Reçue, Reporté et Annulé, ainsi que date effective et date reportée.
- Générer le bon de réception/traçabilité depuis le détail, avec commandé/reçu, prix et signatures.

### Ventes & Z

- Ajouter recherche par référence, point de vente, plage de dates et statut.
- Ouvrir le détail d’une clôture au clic, permettre « Intégrée » ou « À vérifier ».
- Générer un rapport officiel de synthèse de caisse avec aperçu, impression et téléchargement.

### Inventaire

- Ajouter recherche produit, catégorie/destination et filtre des écarts critiques.
- Afficher l’écart quantitatif et sa valeur financière en MAD.
- Conserver l’ajustement unitaire et ajouter une clôture de période générant le rapport PDF.
- Afficher l’historique des clôtures passées avec réouverture de leur aperçu.

### Fournisseurs & Recommandations

- Séparer clairement la gestion des fournisseurs et les recommandations dans deux onglets.
- Ajouter les fiches complètes, recherche, filtres catégorie/statut, ajout, modification et désactivation/suppression.
- Générer automatiquement les besoins depuis les seuils de stock, comparer les fournisseurs compatibles et distinguer Urgent/Éco.
- Transformer « Commander » en achat suivi et ouvrir le bon de commande PDF associé.

### Alertes & Anomalies

- Ajouter les onglets Actives, Critiques, Élevées, Résolues et Toutes.
- Rendre chaque anomalie cliquable pour afficher origine, impact, chronologie et action corrective.
- Lors de la résolution, enregistrer automatiquement la date et Salah Bennani comme auteur, puis conserver l’entrée dans l’historique.

## Détails techniques

- Conserver TanStack Router, React, Tailwind CSS v4, Lucide et les composants d’interface existants.
- Ajouter une bibliothèque PDF compatible navigateur pour produire des fichiers réels et reproductibles, sans service externe.
- Utiliser les variables centralisées de `src/styles.css` pour toutes les couleurs ; aucun rouge générique ne restera sur les actions normales.
- Les lignes cliquables resteront accessibles au clavier et les boutons internes empêcheront les ouvertures involontaires.

## Vérification

- Tester connexion, navigation KPI/anomalies, filtres, changements de statut, mises à jour de stock et traces de résolution.
- Vérifier visuellement chaque aperçu documentaire puis tester téléchargement PDF et impression.
- Contrôler les pages sur ordinateur et mobile, l’absence de mode sombre, les couleurs de statut et l’absence d’erreurs dans la console.