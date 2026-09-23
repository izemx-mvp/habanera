import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { initials, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Habanera Économat" },
      {
        name: "description",
        content: "Profil, préférences d'alertes et règles de seuil de l'économat Habanera.",
      },
      { property: "og:title", content: "Paramètres — Habanera Économat" },
      {
        property: "og:description",
        content: "Ajustez votre profil et les alertes de réapprovisionnement.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [alertes, setAlertes] = useState(true);
  const [rapport, setRapport] = useState(false);

  if (!user) return null;

  return (
    <AppShell title="Paramètres" subtitle="Profil et préférences de l'application">
      <div className="grid max-w-3xl gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil</CardTitle>
            <CardDescription>Informations liées à votre compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                {initials(user.nom)}
              </span>
              <div>
                <p className="font-medium">{user.nom}</p>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-nom">Nom complet</Label>
                <Input id="p-nom" defaultValue={user.nom} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-mail">Adresse e-mail</Label>
                <Input id="p-mail" defaultValue={user.email} />
              </div>
            </div>
            <Button onClick={() => toast.success("Profil enregistré.")}>Enregistrer</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Alertes</CardTitle>
            <CardDescription>Choisissez les notifications de l'économat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Alertes de seuil</p>
                <p className="text-xs text-muted-foreground">
                  Notification dès qu'un article passe sous son seuil.
                </p>
              </div>
              <Switch checked={alertes} onCheckedChange={setAlertes} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Rapport hebdomadaire</p>
                <p className="text-xs text-muted-foreground">
                  Synthèse de consommation envoyée chaque lundi.
                </p>
              </div>
              <Switch checked={rapport} onCheckedChange={setRapport} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
