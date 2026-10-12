# Script de démonstration — HABANERA (15–20 minutes)

## 1. Ouverture (2 min)
- Ouvrir `habanera.izemxlab.com` : présenter la page de connexion (identité HABANERA, dégradé animé,
  phrase d'accueil).
- Expliquer le principe des quatre espaces : Administrateur, Économat, Bar, Cuisine.

## 2. Bar — le cœur du test (6 min)
1. Se connecter en tant que **Bar**.
2. Tableau de bord : commenter les stocks faibles (Chivas 18 ans en rupture).
3. Catalogue des boissons : montrer les 11 catégories et le filtre par catégorie ; ouvrir une fiche
   produit (ex. Jameson) pour montrer le stock, le CUMP et l'historique des mouvements.
4. Bons de prélèvement : créer un nouveau bon (ex. 6 Heineken, 2 Perrier), montrer qu'il apparaît
   « En attente ».
5. Sorties hors-vente : déclarer une casse (ex. 1 Campari), montrer que le stock ne bouge pas encore.

## 3. Économat (4 min)
1. Se connecter en tant qu'**Économat**.
2. Tableau de bord : demandes en attente (dont le bon créé à l'étape précédente).
3. Bons de prélèvement reçus : ouvrir le bon créé, confirmer la livraison, montrer que le stock
   central baisse et que le stock du Bar augmente.
4. Fournisseurs & commandes : ouvrir BC-0002 (Brasseries du Maroc) pour montrer la réception
   fractionnée (70 puis 30 unités de Heineken).
5. Créer une nouvelle commande fournisseur, télécharger son PDF.

## 4. Administrateur — validation (5 min)
1. Se connecter en tant qu'**Administrateur**.
2. Tableau de bord : indicateurs globaux, « Habanera AI a détecté » (histoires cachées).
3. Sorties hors-vente : ouvrir la déclaration de casse créée plus tôt, l'**accepter** → montrer le
   stock débité une seule fois et la valeur de la perte calculée.
4. Ouvrir une autre déclaration et la **rejeter** avec un motif → montrer qu'aucun mouvement de stock
   n'est créé.
5. Rapports et pertes : graphiques par motif et par service.

## 5. Cuisine (2 min)
1. Se connecter en tant que **Cuisine**.
2. Catalogue (5 produits de démonstration), stock, et déclaration d'une sortie hors-vente (ex. Citron
   périmé).

## 6. Habanera AI (2 min)
Depuis n'importe quel écran, ouvrir le panneau et poser :
- « Quels produits sont sous le seuil minimum ? »
- « Quelle est la valeur des pertes validées ce mois-ci ? »
- « Quel est le stock de Chivas 18 ans ? »
- « Quelles anomalies as-tu détectées récemment ? »

## Ce que le client doit retenir
- Les quatre espaces sont cloisonnés et contrôlés par rôle.
- Le stock ne bouge jamais sans un mouvement tracé (entrée, transfert, vente, sortie validée,
  ajustement, retour).
- Une sortie hors-vente n'a aucun effet tant qu'elle n'est pas validée ; un rejet ne modifie jamais
  le stock.
- Les documents (bons de prélèvement, bons de commande) sont de vrais PDF générés depuis les données
  enregistrées.
- Le catalogue reprend fidèlement les catégories et produits de la carte transmise.
