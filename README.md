# HABANERA — ERP Bar & Cuisine (MVP)

MVP de démonstration pour **HABANERA** (« Meat · Wine · Show »), construit par **IZEMX**. Il permet de tester
concrètement la gestion des produits, des stocks, des bons de prélèvement, des commandes fournisseurs et des
sorties hors-vente, sur quatre espaces : **Administrateur**, **Économat**, **Bar**, **Cuisine**.

> Démonstrateur commercial : données simulées, aucune action réelle vers l'extérieur. Voir `SPEC.md` pour la fiche
> validée avec le business analyst et `docs/SCRIPT-DEMO.md` pour le script de démonstration.

## Stack

- React 19 + TypeScript + Vite (client), Express 5 (serveur minimal : `/api/status` + service du build).
- Tailwind CSS (palette HABANERA : brun `#1A100A`, cuivre `#B7794B`, doré `#D8B878`, fond `#F7F4F0`).
- Zustand (session, persona, panneau IA) — persisté dans `localStorage` sous la clé `habanera-mvp`.
- jsPDF + jspdf-autotable pour la génération des bons de prélèvement et bons de commande en PDF.
- Aucune base de données réelle : les données sont générées une fois, de façon déterministe (graine fixe), au
  chargement de l'application, puis mutées en mémoire par les actions de la session (voir ci-dessous).

## Lancer le projet

```bash
npm install
npm run dev
```

Client sur `http://localhost:5173`, serveur sur `http://localhost:8787` (proxy `/api`).

## Comptes de démonstration

Connexion en un clic, sans mot de passe, depuis `/connexion` : une carte par rôle (Administrateur, Économat, Bar,
Cuisine). Le rôle actif est stocké côté client (Zustand persistant) ; chaque écran est protégé par un garde de rôle
(`RbacGate`) qui affiche « Accès restreint par rôle » en cas d'URL visitée hors périmètre.

| Rôle | Persona | Accès |
|---|---|---|
| Administrateur | Samir Idrissi | `/admin/*` |
| Économat | Nadia Fassi | `/economat/*` |
| Bar | Youssef Benali | `/bar/*` |
| Cuisine | Amine Cherkaoui | `/cuisine/*` |

## Ce qui est réellement fonctionnel

- **Catalogue** : ~93 références Bar (11 catégories reprises du brief) + 5 produits de démonstration Cuisine.
  Les prix de vente non communiqués affichent « Non renseigné » (aucun prix n'a été inventé).
- **Stocks** par service (Économat, Bar, Cuisine), calculés depuis les mouvements, jamais écrits en dur.
- **Mouvements de stock** tracés (type, quantité, avant/après, utilisateur, document, coût/valeur).
- **Bons de prélèvement** : création (Bar/Cuisine), préparation et livraison totale/partielle (Économat), rejet
  avec motif, historique complet, aperçu/téléchargement/impression PDF.
- **Commandes fournisseurs & réceptions** : création, réception totale ou fractionnée (le stock n'augmente qu'à
  la réception), calcul du coût moyen pondéré (CUMP) quand le coût est connu, sinon « À valoriser ».
- **Sorties hors-vente** : déclaration (Bar/Cuisine, sans effet sur le stock), validation ou rejet par
  l'Administrateur (débit du stock une seule fois, blocage si stock insuffisant, motif de rejet obligatoire,
  aucune modification possible sur une déclaration déjà traitée).
- **Alertes de stock**, **rapports de pertes** (par motif, par service), **paramètres de seuils**, **catalogue**,
  **utilisateurs** (lecture).
- **Habanera AI** : panneau latéral droit (380–680 px, redimensionnable, persistant), moteur déterministe qui
  calcule ses réponses sur les données réellement enregistrées (stocks, pertes, bons, commandes). Refuse toute
  demande d'écriture et propose d'ouvrir l'écran correspondant.

## Ce qui est simulé, et pourquoi

Ce MVP suit le standard commercial IZEMX (voir `SPEC.md`) : pas de base de données réelle, pas de vraie
authentification serveur. Les actions de la session (créer un bon, valider une sortie, réceptionner une
commande…) **mutent réellement l'état en mémoire** du navigateur — les stocks bougent, les historiques se
complètent — mais tout est réinitialisé au rechargement de la page. C'est le comportement attendu d'un
démonstrateur : il peut être rejoué à l'identique à chaque présentation.

## Simplifications assumées

- Le stock des bouteilles d'alcool est suivi à l'unité de stockage (bouteille), pas au millilitre pour une
  bouteille entamée ; la contenance et la dose servie sont des champs configurables à titre informatif.
- Pas de justificatif joint aux sorties hors-vente (stockage de fichiers non configuré dans cette démonstration).
- `Habanera AI` ne fait aucun appel à un modèle de langage externe.

## Données de démonstration

Générées une fois par `client/src/data/generate.ts` (graine fixe `20261010`, « aujourd'hui » simulé :
10 octobre 2026) : inventaire initial, ~45 jours de ventes, 4 commandes fournisseurs (dont une réception
fractionnée 70/30 et une commande en attente), 9 bons de prélèvement (tous statuts), 12 sorties hors-vente (dont
2 en attente et 1 rejetée). Les « histoires cachées » sont listées dans `client/src/data/selectors.ts`
(`hiddenStories()`) et reprises sur le tableau de bord Administrateur.

## Structure

```
client/src/data/        catalogue, référentiels, générateur, sélecteurs, actions (mutations)
client/src/store/       Zustand (session) + compteur de version (ré-affichage après mutation)
client/src/components/  coque (Shell, AiSidebar, RbacGate), DataTable, Drawer, StatusBadge…
client/src/features/    écrans partagés entre Bar et Cuisine (catalogue, stock, mouvements, bons, sorties)
client/src/pages/       pages par rôle (admin, economat, bar, cuisine) + pages communes
client/src/lib/         moteur IA déterministe, génération PDF
server/src/             Express minimal : /api/status + service du build
```
