# Mise à niveau complète du MVP Habanera

## Résultat attendu
Une application de gestion d’économat complète, fluide sur ordinateur et mobile, avec les neuf espaces métier demandés, une palette Habanera sans vert et des interactions simulées instantanément dans le navigateur.

## Identité et structure globale
- Remplacer les couleurs actuelles par les tons Habanera : brun profond, surfaces chaudes, gris doux et rouge `#ad1a24` pour les actions.
- Ajouter un mode clair/sombre persistant, respectant le choix système au premier chargement, avec bouton Soleil/Lune près de l’avatar.
- Recomposer la barre latérale avec les neuf destinations demandées, un état actif clair, une déconnexion rapide et un tiroir mobile avec fond d’écran et fermeture.
- Enrichir le menu SB avec l’identité complète, le rôle, les paramètres du compte et la déconnexion.
- Ajouter le footer exact sur chaque écran, connexion comprise.

## Écrans métier
1. **Dashboard** — valeur du stock, ruptures, prélèvements en attente, commandes en cours, consommation hebdomadaire et anomalies.
2. **Produits & Stocks** — données de mouvements détaillées, calcul du stock actuel, recherche, filtre de catégorie, tri, ajout, consultation, modification et suppression.
3. **Bons de Prélèvement** — suggestions automatiques bar/cuisine, quantités ajustables et validation mettant à jour le stock simulé.
4. **Achats & Réceptions** — formulaire de livraison validé, nouvelles entrées et suivi des réceptions.
5. **Ventes & Z** — saisie/import simulé des données journalières, filtres et historique alimentant la consommation affichée.
6. **Inventaire** — saisie du comptage réel, calcul automatique Théorique − Réel et signalement des écarts.
7. **Fournisseurs & Recommandation** — comparaison prix/délai/qualité/disponibilité, classement contextuel et commande pré-remplie.
8. **Alertes & Anomalies** — liste filtrable par criticité/type, actions correctives et résolution.
9. **Gestion des utilisateurs** — conserver l’ajout et la suppression, ajouter la modification des accès et harmoniser les états.

## Comportement et qualité
- Centraliser les données opérationnelles dans un contexte React afin que les validations de prélèvements, achats, ventes et inventaires restent cohérentes pendant la session.
- Utiliser les contrôles existants, validations, notifications, états vides et retours de chargement.
- Garantir des tableaux lisibles sur mobile grâce à un défilement horizontal maîtrisé et des actions accessibles.
- Ajouter les métadonnées propres à chaque nouvel écran.
- Vérifier le parcours connexion → navigation complète → actions métier → déconnexion, en clair et sombre, sur ordinateur et mobile.

## Détails techniques
- React 19, TanStack Router, Tailwind CSS v4, Lucide React et composants UI déjà présents.
- Aucune base de données : état React partagé et données fictives riches, comme demandé pour ce MVP.
- Les formules métier seront appliquées dans les données calculées : stock courant, quantité de prélèvement et écart d’inventaire.
