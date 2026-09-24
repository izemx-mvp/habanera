# Habanera Stock Mastery

Tu es un développeur Frontend React senior expert en UI/UX, design systems, Tailwind CSS et Lucide React. Je veux que tu me crées une application web MVP moderne, élégante, sophistiquée et 100% fonctionnelle pour l'établissement **Habanera** (système intelligent de contrôle et de gestion des stocks de l'économat, basé à Marrakech, sans interface de type chat).

L'application ne doit pas ressembler à un template générique ou à un tableau de bord AI classique : elle doit offrir une expérience visuelle et ergonomique de niveau professionnel (style design system LFILM, épuré, spacieux, avec une hiérarchie visuelle irréprochable).

---

# 1. SYSTÈME DE DESIGN TOKENS & COULEURS (LIGHT & DARK MODE)

### A. Tokens de Couleurs Centralisés
Crée un système de variables CSS / tokens pour éviter tout code en dur :
- `--primary`, `--primary-hover`, `--primary-active` (Basé sur le rouge élégant `#ad1a24`)
- `--secondary`, `--accent`
- `--success`, `--warning`, `--error`, `--info`
- `--background`, `--background-secondary`, `--foreground`
- `--surface`, `--surface-hover`, `--surface-elevated`
- `--border`, `--border-subtle`
- `--muted`, `--muted-foreground`
- `--sidebar`, `--sidebar-foreground`
- `--input`, `--ring`
- `--chart-1` à `--chart-5`

### B. Mode Clair (Par Défaut)
Le mode clair doit être l'expérience initiale par défaut. Utilise :
- Un fond de page blanc cassé / off-white (`#fcfbf9` ou équivalent subtil)
- Des surfaces blanches surélevées (`white`)
- Des bordures très subtiles (`#423936` ou équivalent neutre adouci)
- Des ombres contenues (pas d'ombres géantes floues)

### C. Mode Sombre (Complet et Sur-Mesure)
Ne te contente pas d'inverser les couleurs. Crée un mode sombre purpose-designed :
- Fonds profonds aux teintes riches : `#1d0d0b` (fond principal), `#1A100C` (cartes), `#211613` (surfaces secondaires)
- Bordures élégantes : `#423936`
- Texte secondaire : `#6D6663`
- Transition animée fluide entre les modes, avec persistance du choix de l'utilisateur (et respect des préférences système).

---

# 2. ARRIÈRE-PLAN GÉOMÉTRIQUE ANIMÉ (LFILM-INSPIRED)

- Crée un arrière-plan animé sophistiqué et visible mais non distrayant, particulièrement marquant sur la page de connexion, le dashboard et les états vides.
- Utilise des éléments géométriques subtils (cercles flottants, formes polygonales translucides, lignes géométriques fines, dégradés lents).
- Respecte les performances (transformations GPU avec `transform` et `opacity`) et prend en compte `prefers-reduced-motion`.

---

# 3. APPLICATION SHELL, HEADER & NAVIGATION

### A. Header & Top Bar
- **Bouton de bascule Light/Dark mode :** Positionné en haut à droite, sous forme d'icône Soleil/Lune cliquable.
- **Avatar utilisateur connecté :** Placé à côté du switch, affichant les initiales (`SB` pour Salah Bennani).
- **Menu déroulant (Dropdown) de l'avatar :** Au clic sur l'avatar, une fenêtre élégante s'ouvre vers le bas avec :
  - Le nom complet (*Salah Bennani*) et son rôle (*Administrateur*).
  - Un lien cliquable **« Paramètres du compte »**.
  - Un bouton de déconnexion **« Se déconnecter »** (en rouge `#ad1a24`) ramenant à la page de login.

### B. Sidebar Responsive
- Desktop : Sidebar complète fixe.
- Tablette / Mobile : Sidebar rétractable / tiroir animé (drawer) avec bouton de fermeture et overlay.
- Liens de navigation avec icônes Lucide React :
  1. Dashboard
  2. Produits & Stocks
  3. Bons de Prélèvement
  4. Achats & Réceptions
  5. Ventes & Z
  6. Inventaire
  7. Fournisseurs & Recommandation
  8. Alertes & Anomalies
  9. Gestion des utilisateurs

---

# 4. PAGE DE CONNEXION (LOGIN)

- Une page de connexion centrée, moderne, élégante.
- **Pré-remplissage automatique :** Les champs "Email" et "Mot de passe" sont **déjà écrits et pré-remplis** (`salah.bennani@habanera.com` / `••••••••`). L'utilisateur clique simplement sur "Se connecter".

---

# 5. ARCHITECTURE MÉTIER & ÉCRANS DU MVP (HABANERA)

Tous les écrans doivent être 100% interactifs, alimentés par des états React robustes (`useState`, `useEffect`) avec des données initiales riches :

1. **Dashboard :**
   - KPIs visuels (Valeur totale du stock, alertes critiques, bons de prélèvement en attente, commandes en cours).
   - Jauges, graphiques analytiques épurés et section des anomalies détectées en arrière-plan.

2. **Produits & Stocks :**
   - Recherche instantanée et filtres pour répondre à : *« Pour un produit X, combien ai-je en stock ? »*.
   - Tableau dynamique appliquant la formule de gestion des mouvements : `Stock J = Stock J-1 + Achats - Ventes`.
   - Colonnes : Nom, Catégorie, Unité, Stock Fixe, Achats, Ventes, Prélèvements, Stock Actuel.
   - Actions : Détails, Éditer, Supprimer, et modale « Ajouter un produit ».

3. **Bons de Prélèvement (Génération Automatique) :**
   - Automatisation basée sur la règle : `Quantité à prélever = Stock fixe - Consommation / Ventes` (ex: Stock fixe = 40, Ventes = 15 -> Suggère **15 unités à prélever** pour le bar ou la cuisine).
   - Tableau interactif avec validation en un clic mettant à jour instantanément les stocks de l'économat.

4. **Achats & Réceptions :**
   - Formulaire d'enregistrement des bons de livraison et suivi des entrées de marchandises dans l'économat.

5. **Ventes / Données Z :**
   - Interface d'intégration et de consultation des données de caisse journalières alimentant les flux de stock.

6. **Inventaire (Comparatif Théorique vs Réel) :**
   - Module tabulaire pour saisir le stock compté physiquement.
   - Calcul automatique de l'écart : `Écart = Stock Théorique - Stock Réel` (signalé par un badge d'alerte visuel).

7. **Fournisseurs & Moteur de Recommandation Multicritère Intelligent :**
   - Gestion de la base fournisseurs (Nom, Prix, Délai de livraison, Qualité de service, Disponibilité).
   - **Moteur de décision contextuel :** En cas de rupture ou de manque, le système analyse l'urgence et pondère automatiquement les fournisseurs pour attribuer une recommandation sur-mesure (ex: *Fournisseur A : Recommandé - Urgent / 1j*, *Fournisseur B : Économique / 5j*, etc.).
   - Tableau comparatif interactif avec un bouton cliquable **« Commander »** validant l'achat pré-rempli.

8. **Alertes & Anomalies :**
   - Tableau de bord centralisé listant les irrégularités détectées en tâche de fond (écarts d'inventaire, ruptures imminentes, réceptions non conformes) avec niveaux de criticité et actions correctives.

9. **Gestion des utilisateurs :**
   - Tableau listant le personnel (Nom, Email, Rôle [Administrateur, Économat, Bar, Cuisine], Statut).
   - Modale d'ajout d'utilisateur et boutons d'action interactifs (modifier les accès, désactiver, supprimer).

---

# 6. FOOTER

- Ancré proprement sur toutes les pages.
- Doit contenir exactement ce texte, centré et stylisé en `#6D6663` :
  > **Ce MVP a été conçu et développé par IZEMX**

---

# 7. EXIGENCES DE QUALITÉ ET INTERACTION

- **Composants d'UI soignés :** Boutons avec états clairs (hover, active, loading), formulaires structurés avec états de validation, tables dotées de tris et de filtres intuitifs, modals et drawers fluides.
- **États vides et de chargement :** Pas d'écrans blancs brusques, utilise des skeletons loaders et des états vides intentionnels avec actions claires.
- **Micro-interactions :** Transitions fluides (~150-300ms) pour les onglets, modales, bascules et survols de cartes.
- Code propre, modulaire et sans erreurs, prêt pour une exécution immédiate et fluide dans Lovable.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/88dd8446-316c-4dc5-a4b9-b04ce5c31a45).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
