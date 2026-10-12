# SPEC — MVP HABANERA (validée avec le business analyst)

## 1. Client
- **Nom** : HABANERA — restaurant-bar « Meat · Wine · Show » (grill haut de gamme + bar à cocktails), Maroc (MAD).
- **Site** : aucun ; présence en ligne via Instagram [@habanera.ma](https://www.instagram.com/habanera.ma/).
- **Logo** : fichier officiel fourni par le BA (fond blanc et fond brun).

## 2. Type de MVP retenu
**Démo commerciale IZEMX standard** (et non une application réelle avec backend Supabase, écartée après clarification avec le BA : le brief d'origine était rédigé pour un outil type « Lovable », pas pour le processus IZEMX). Concrètement :
- Connexion en un clic par carte de rôle, sans mot de passe.
- Données réalistes mais **simulées**, générées une fois de façon déterministe (aucune base de données réelle, aucun Supabase).
- Toutes les opérations d'écriture (créer un bon, déclarer une sortie, valider, réceptionner…) sont **interactives pendant la session** : elles mettent à jour les stocks et créent de vrais mouvements en mémoire, mais ne persistent pas au-delà du rechargement de page — comportement normal et attendu pour ce type de démonstrateur IZEMX.
- Base de code : clonée depuis l'archétype *application-métier* (Decorum), avec le mécanisme de connexion par rôle et le panneau IA emprunté à l'archétype *cockpit* (Atlantic Foods).

## 3. Adresse & identité
- Adresse de démonstration : `habanera.izemxlab.com`
- Nom de l'IA : **Habanera AI** (moteur déterministe, lecture seule, aucun modèle de langage externe).

## 4. Rôles & connexion
Quatre cartes de connexion : **Administrateur**, **Économat**, **Bar**, **Cuisine**. Chaque rôle a son propre espace et sa propre navigation (pas de navigation partagée avec cadenas : les espaces sont cloisonnés). Le contrôle d'accès est appliqué par un garde de route (`RbacGate`) sur chaque écran.

## 5. Catalogue
- **Bar** : 11 catégories reprises du brief (Sélection Cristal, Gins Premium, Whisky/Rhum, Vodka/Tequila, Gin, Apéritifs/Digestifs, Cocktails Signature, Classiques Premium, Mocktails, Eaux/Soft, Bières/Beer), ~93 produits transcrits du texte fourni.
- **Cuisine** : 5 produits de démonstration (Tomates, Pommes de terre, Poulet, Huile d'olive, Citron).
- **Prix** : aucun prix de vente n'étant lisible dans le brief transmis (pas de carte jointe), tous les prix de vente affichent « Non renseigné », conformément à la consigne « ne pas inventer les prix manquants ».
- **Coûts d'achat (CUMP)** : simulés sur un sous-ensemble de produits ayant fait l'objet d'une réception fournisseur dans l'historique généré ; « À valoriser » pour les autres, comme en production.

## 6. Périmètre fonctionnel livré
Voir le README pour le détail écran par écran. En résumé : catalogue, stocks (Économat/Bar/Cuisine), mouvements tracés, bons de prélèvement (création, préparation, livraison totale/partielle, rejet), commandes fournisseurs et réceptions (y compris réception fractionnée), sorties hors-vente (déclaration, validation/rejet par l'Administrateur, valorisation), alertes de stock, rapports de pertes, gestion des utilisateurs (lecture), paramètres de seuils, génération de PDF (bons de prélèvement et de commande).

## 7. Simplifications assumées (voir aussi README)
- Pas de suivi au millilitre d'une bouteille entamée : le stock reste suivi à l'unité de stockage (bouteille), la dose servie et la contenance sont des champs informatifs configurables.
- Pas d'upload de justificatif pour les sorties hors-vente (stockage de fichiers non configuré dans cette démonstration).
- `Habanera AI` répond par un moteur de règles déterministe sur les données générées, sans appel à un LLM.

## 8. Points à confirmer avec le client
- Le logo transmis est-il la version définitive (fond blanc / fond brun) ?
- Les prix de vente réels de la carte, pour remplacer les « Non renseigné ».
- La liste exacte des comptes utilisateurs réels (au-delà des personas de démonstration).
- Confirmation que HABANERA est basé au Maroc (devise MAD) — supposé validé par le BA.
