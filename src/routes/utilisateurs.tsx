import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initials, useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Gestion des utilisateurs — Habanera" },
      {
        name: "description",
        content: "Gérez les accès Administrateur, Économat, Bar et Cuisine de l'établissement Habanera.",
      },
      { property: "og:title", content: "Gestion des utilisateurs — Habanera" },
      {
        property: "og:description",
        content: "Ajoutez, suspendez ou supprimez les comptes du personnel de l'économat.",
      },
    ],
  }),
  component: UsersPage,
});

const ROLES: Role[] = ["Administrateur", "Économat", "Bar", "Cuisine"];

function UsersPage() {
  const { users, user, addUser, toggleStatut, removeUser } = useAuth();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Bar");
  const [errors, setErrors] = useState<{ nom?: string; email?: string }>({});

  const rows = users.filter(
    (u) =>
      u.nom.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.role.toLowerCase().includes(q.toLowerCase()),
  );

  function submit() {
    const next: { nom?: string; email?: string } = {};
    if (nom.trim().length < 3) next.nom = "Indiquez le nom complet.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Adresse e-mail invalide.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    addUser({ nom: nom.trim(), email: email.trim(), role });
    toast.success(`${nom.trim()} a été ajouté comme ${role}.`);
    setNom("");
    setEmail("");
    setRole("Bar");
    setOpen(false);
  }

  return (
    <AppShell
      title="Gestion des utilisateurs"
      subtitle={`${users.length} comptes · rôles et accès du personnel`}
      action={
        <Button onClick={() => setOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
        </Button>
      }
    >
      <Card>
        <CardContent className="p-5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un nom, e-mail ou rôle..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernier accès</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium">Aucun utilisateur trouvé</p>
                      <Button variant="outline" className="mt-4" onClick={() => setOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Ajouter un utilisateur
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => (
                    <TableRow key={u.id} className="transition-colors duration-150">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                            {initials(u.nom)}
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {u.nom}
                              {u.id === user?.id && (
                                <span className="ml-2 text-[11px] text-muted-foreground">(vous)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "Administrateur" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 text-sm ${u.statut === "Actif" ? "text-success" : "text-muted-foreground"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${u.statut === "Actif" ? "bg-success" : "bg-muted-foreground"}`}
                          />
                          {u.statut}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.dernierAcces}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="rounded-md p-2 transition-colors hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                toggleStatut(u.id);
                                toast.success(
                                  `${u.nom} est désormais ${u.statut === "Actif" ? "suspendu" : "actif"}.`,
                                );
                              }}
                            >
                              {u.statut === "Actif" ? "Suspendre l'accès" : "Réactiver l'accès"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={u.id === user?.id}
                              onSelect={() => {
                                removeUser(u.id);
                                toast.success(`${u.nom} a été supprimé.`);
                              }}
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Le compte sera actif immédiatement avec le rôle sélectionné.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet</Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. Salma Idrissi"
                aria-invalid={!!errors.nom}
              />
              {errors.nom && <p className="text-xs text-destructive">{errors.nom}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail">Adresse e-mail</Label>
              <Input
                id="mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@habanera.com"
                aria-invalid={!!errors.email}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
