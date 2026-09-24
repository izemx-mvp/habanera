import {
  AlertOctagon, BarChart3, Bell, Boxes, ClipboardList, FileInput, History, LayoutDashboard, PackageCheck,
  PackageSearch, ReceiptText, Settings2, ShoppingCart, Truck, Users, type LucideIcon,
} from "lucide-react";

export type Role = "Administrateur" | "Économat" | "Bar" | "Cuisine";
export type Space = "admin" | "economat" | "service";
export type ServiceName = "Bar" | "Cuisine";

export const SPACE_LABEL: Record<Space, string> = { admin: "Administration", economat: "Économat", service: "Cuisine & Bar" };
export const ROLE_SPACES: Record<Role, Space[]> = {
  Administrateur: ["admin", "economat", "service"],
  Économat: ["economat"],
  Bar: ["service"],
  Cuisine: ["service"],
};
export const SPACE_HOME = { admin: "/tableau-de-bord", economat: "/economat", service: "/cuisine-bar" } as const;

export type NavItem = { to: string; label: string; icon: LucideIcon };
export const SPACE_NAV: Record<Space, NavItem[]> = {
  admin: [
    { to: "/tableau-de-bord", label: "Dashboard", icon: LayoutDashboard },
    { to: "/stock", label: "Stocks", icon: Boxes },
    { to: "/bons-prelevement", label: "Bons de prélèvement", icon: FileInput },
    { to: "/approvisionnement", label: "Approvisionnements", icon: ShoppingCart },
    { to: "/fournisseurs", label: "Fournisseurs", icon: Truck },
    { to: "/ventes", label: "Ventes & Consommations", icon: ReceiptText },
    { to: "/alertes", label: "Alertes & Anomalies", icon: AlertOctagon },
    { to: "/reporting", label: "Reporting", icon: BarChart3 },
    { to: "/configuration", label: "Configuration", icon: Settings2 },
    { to: "/utilisateurs", label: "Utilisateurs & Permissions", icon: Users },
  ],
  economat: [
    { to: "/economat", label: "Dashboard", icon: LayoutDashboard },
    { to: "/stock", label: "Produits", icon: PackageSearch },
    { to: "/mouvements", label: "Stock", icon: History },
    { to: "/bons-prelevement", label: "Bons de prélèvement", icon: FileInput },
    { to: "/approvisionnement", label: "Approvisionnement", icon: ShoppingCart },
    { to: "/fournisseurs", label: "Fournisseurs", icon: Truck },
    { to: "/receptions", label: "Réceptions", icon: PackageCheck },
    { to: "/alertes", label: "Alertes", icon: AlertOctagon },
  ],
  service: [
    { to: "/cuisine-bar", label: "Dashboard", icon: LayoutDashboard },
    { to: "/stock", label: "Produits", icon: PackageSearch },
    { to: "/mon-stock", label: "Mon Stock", icon: ClipboardList },
    { to: "/ventes", label: "Ventes", icon: ReceiptText },
    { to: "/bons-prelevement", label: "Bons de prélèvement", icon: FileInput },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
};

// Pages accessibles hors menu (liens internes) par rôle
const EXTRA_PAGES: Record<Role, string[]> = {
  Administrateur: ["/parametres", "/economat", "/cuisine-bar", "/mon-stock", "/mouvements", "/receptions", "/notifications", "/inventaire", "/achats-receptions", "/ventes-z"],
  Économat: ["/parametres", "/inventaire", "/notifications", "/achats-receptions"],
  Bar: ["/parametres"],
  Cuisine: ["/parametres"],
};

export function canAccess(role: Role, path: string) {
  const clean = path.replace(/\/$/, "") || "/";
  if (EXTRA_PAGES[role].includes(clean)) return true;
  return ROLE_SPACES[role].some((space) => SPACE_NAV[space].some((item) => item.to === clean));
}

export type Action =
  | "produit.edit" | "produit.delete" | "prix.view" | "bon.create" | "bon.process" | "bon.close"
  | "commande.create" | "commande.validate" | "reception.validate" | "stock.adjust" | "vente.create"
  | "alerte.resolve" | "config.edit" | "users.manage" | "fournisseur.view";

const ROLE_ACTIONS: Record<Role, Action[] | "all"> = {
  Administrateur: "all",
  Économat: ["produit.edit", "prix.view", "bon.process", "bon.close", "commande.create", "commande.validate", "reception.validate", "stock.adjust", "alerte.resolve", "fournisseur.view"],
  Bar: ["bon.create", "vente.create"],
  Cuisine: ["bon.create", "vente.create"],
};

export function can(role: Role | undefined, action: Action) {
  if (!role) return false;
  const actions = ROLE_ACTIONS[role];
  return actions === "all" || actions.includes(action);
}

/** Services dont l'utilisateur peut voir les données */
export function roleServices(role: Role): ServiceName[] {
  if (role === "Bar") return ["Bar"];
  if (role === "Cuisine") return ["Cuisine"];
  return ["Bar", "Cuisine"];
}

export const ACCESS_MATRIX = (["Administrateur", "Économat", "Bar", "Cuisine"] as Role[]).map((role) => ({
  role,
  spaces: ROLE_SPACES[role].map((s) => SPACE_LABEL[s]),
  actions: ROLE_ACTIONS[role] === "all" ? "Toutes les actions" : (ROLE_ACTIONS[role] as Action[]).join(", "),
}));
