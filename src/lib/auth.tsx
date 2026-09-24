import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { ROLE_SPACES, type Role, type Space } from "@/lib/permissions";
export type { Role } from "@/lib/permissions";

export type Profile = {
  id: string;
  nom: string;
  email: string;
  role: Role;
  statut: "Actif" | "Suspendu";
  dernierAcces: string;
};

export const SEED_USERS: Profile[] = [
  {
    id: "u-1",
    nom: "Salah Bennani",
    email: "salah.bennani@habanera.com",
    role: "Administrateur",
    statut: "Actif",
    dernierAcces: "Aujourd'hui, 08:42",
  },
  {
    id: "u-2",
    nom: "Nadia El Fassi",
    email: "nadia.elfassi@habanera.com",
    role: "Économat",
    statut: "Actif",
    dernierAcces: "Aujourd'hui, 07:15",
  },
  {
    id: "u-3",
    nom: "Youssef Amrani",
    email: "youssef.amrani@habanera.com",
    role: "Bar",
    statut: "Actif",
    dernierAcces: "Hier, 23:04",
  },
  {
    id: "u-4",
    nom: "Imane Ouazzani",
    email: "imane.ouazzani@habanera.com",
    role: "Cuisine",
    statut: "Actif",
    dernierAcces: "Hier, 18:30",
  },
  {
    id: "u-5",
    nom: "Karim Tazi",
    email: "karim.tazi@habanera.com",
    role: "Bar",
    statut: "Suspendu",
    dernierAcces: "12 sept., 21:10",
  },
];

export function initials(nom: string) {
  return nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AuthValue = {
  isAuthenticated: boolean;
  user: Profile | null;
  users: Profile[];
  login: (email: string) => Profile;
  space: Space;
  setSpace: (space: Space) => void;
  logout: () => void;
  addUser: (input: { nom: string; email: string; role: Role }) => void;
  toggleStatut: (id: string) => void;
  updateRole: (id: string, role: Role) => void;
  removeUser: (id: string) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>(SEED_USERS);
  const [space, setSpaceState] = useState<Space>("admin");
  const setSpace = useCallback((next: Space) => {
    if (user && ROLE_SPACES[user.role].includes(next)) setSpaceState(next);
  }, [user]);

  const login = useCallback(
    (email: string) => {
      const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      const profile = found && found.statut === "Actif" ? found : users[0]!;
      setUser(profile);
      setSpaceState(ROLE_SPACES[profile.role][0]!);
      return profile;
    },
    [users],
  );

  const logout = useCallback(() => setUser(null), []);

  const addUser = useCallback((input: { nom: string; email: string; role: Role }) => {
    setUsers((prev) => [
      {
        id: `u-${Date.now()}`,
        nom: input.nom,
        email: input.email,
        role: input.role,
        statut: "Actif",
        dernierAcces: "Jamais connecté",
      },
      ...prev,
    ]);
  }, []);

  const toggleStatut = useCallback((id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, statut: u.statut === "Actif" ? "Suspendu" : "Actif" } : u,
      ),
    );
  }, []);

  const updateRole = useCallback((id: string, role: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  }, []);

  const removeUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      isAuthenticated: user !== null,
      user,
      users,
      login,
      space,
      setSpace,
      logout,
      addUser,
      toggleStatut,
      updateRole,
      removeUser,
    }),
    [user, users, space, setSpace, login, logout, addUser, toggleStatut, updateRole, removeUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
