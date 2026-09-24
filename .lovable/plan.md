# Évolution Habanera : 3 espaces, permissions et workflow complet

## Principe
Même application, même design, même page de connexion, mêmes données partagées (simulées dans le navigateur, comme aujourd'hui). On ajoute par-dessus : les espaces, les permissions et le workflow complet.

## Audit de l'existant
- **À conserver tel quel** : connexion, thème brun, footer, pagination, aperçu/impression/téléchargement PDF, fiches fournisseurs, recommandations, alertes avec résolution, inventaire.
- **À améliorer légèrement** : Dashboard (KPI qui ouvrent la page déjà filtrée, activité récente), Produits & Stocks (seuil minimum, stock cible, fournisseur principal, délai, actif/inactif), Ventes & Z (recherche par produit et par service, stock déduit automatiquement), Alertes (calculées automatiquement, avec l'action associée), Utilisateurs (accès aux espaces).
- **À modifier** : Bons de prélèvement (circuit Brouillon → Envoyé → Reçu → En cours → Traité/Partiel → Livré → Clôturé, préparation par l'Économat), Achats & Réceptions (séparés en Approvisionnement et Réceptions).
- **À créer** : sélecteur d'espace, menu adapté à chaque espace, dashboards Économat et Cuisine & Bar, Mon Stock, Approvisionnement (besoins, simulation, commandes), Réceptions, Notifications, Reporting, Configuration.

## Espaces et accès
- Sélecteur « ESPACE » en haut du menu latéral. Il ne propose que les espaces autorisés et le changement est instantané.
- Administrateur : les 3 espaces. Économat : Économat seulement. Bar / Cuisine : Cuisine & Bar seulement.
- Après connexion, chaque rôle arrive sur son propre tableau de bord. Une page non autorisée renvoie vers ce tableau de bord.
- Sur la page de connexion, un petit choix de profil de démonstration (Admin / Économat / Bar / Cuisine) pour tester chaque rôle. Le reste de la page ne change pas.

## Menus
- **Administration** : Dashboard, Stocks, Bons de prélèvement, Approvisionnements, Fournisseurs, Ventes & Consommations, Alertes & Anomalies, Reporting, Configuration, Utilisateurs & Permissions.
- **Économat** : Dashboard, Produits, Stock, Bons de prélèvement, Approvisionnement, Fournisseurs, Réceptions, Alertes.
- **Cuisine & Bar** : Dashboard, Produits, Mon Stock, Ventes, Bons de prélèvement, Notifications (sans prix ni fournisseurs).

## Workflow
1. **Vente** : chaque vente saisie déduit automatiquement les produits consommés du stock Bar ou Cuisine, grâce à une recette simple par article vendu.
2. **Mon Stock** : pour chaque produit, stock du service, stock de référence, écart et statut « À prélever » / « OK ». Un bouton crée un brouillon de bon avec les manques.
3. **Bon de prélèvement** : Cuisine/Bar crée le bon puis l'envoie. L'Économat le voit dans « À traiter », saisit les quantités préparées (disponible affiché) et valide. Le bon passe automatiquement en Traité, Partiellement traité ou Non traité. Le stock Économat baisse et le stock du service monte. Livré puis Clôturé.
4. **Besoins** : un produit dont le stock est inférieur ou égal au seuil minimum apparaît automatiquement.
5. **Simulation** : quantité proposée = stock cible − stock actuel − quantité déjà commandée. La quantité reste modifiable, puis on crée la commande.
6. **Commande fournisseur** : Simulation → À valider → Validée → Envoyée → En attente de réception → Partiellement reçue / Reçue → Clôturée.
7. **Réception** : on saisit les quantités réellement reçues. Le stock Économat augmente de ces quantités, et un écart crée une anomalie.
8. Chaque mouvement est inscrit dans l'historique : produit, type, quantité, stock avant/après, date, utilisateur, référence. Cet historique alimente Stock, Activité récente, Reporting et Notifications.

## Tableaux de bord
- **Admin** : les 15 KPI demandés, tous cliquables vers la page filtrée, puis les sections Alertes, Anomalies (chiffres détaillés) et Activité récente.
- **Économat** : stock, sous seuil, ruptures, bons à traiter ou partiels, commandes, réceptions attendues, alertes, derniers mouvements.
- **Cuisine & Bar** : stock du service, produits sous référence ou manquants, bons en cours et traités, ventes du jour, alertes, activité.

## PDF
L'outil PDF actuel est réutilisé et complété avec le statut et les quantités demandées/traitées. Aperçu, Télécharger et Imprimer restent disponibles sur chaque bon.

## Reporting et Configuration
- **Reporting** : stocks, mouvements, ventes, consommations, prélèvements, achats, réceptions, ruptures, anomalies, fournisseurs. Périodes : Aujourd'hui, Semaine, Mois, Mois précédent, Personnalisée.
- **Configuration** : catégories, unités, seuils et stocks de référence modifiables par produit, règles d'alertes et délais, tableau des accès par rôle.

## Détails techniques
- Une seule source de données partagée, dans le module d'opérations existant, étendue avec : stock Économat et stock par service, mouvements, bons avec statut, commandes à plusieurs lignes, réceptions, notifications, recettes. Toutes les mises à jour de stock passent par une même fonction qui enregistre aussi le mouvement.
- Permissions : un tableau rôle → espaces / pages / actions, avec un contrôle dans le cadre commun des pages et sur les boutons.
- Filtres venant des KPI : paramètres de recherche dans l'adresse (par exemple `?filtre=sous-seuil`).
- Nouvelles pages : `/economat`, `/cuisine-bar`, `/mon-stock`, `/approvisionnement`, `/receptions`, `/notifications`, `/reporting`, `/configuration`. Les pages existantes sont réutilisées pour les éléments communs à plusieurs espaces.
- Les données restent simulées : un rechargement de la page remet la démo à zéro, comme aujourd'hui.
