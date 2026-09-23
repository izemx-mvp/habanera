import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — Habanera Économat" },
      {
        name: "description",
        content:
          "Accédez au système intelligent de contrôle et de gestion des stocks de l'économat Habanera, Marrakech.",
      },
      { property: "og:title", content: "Connexion — Habanera Économat" },
      {
        property: "og:description",
        content: "Contrôle intelligent des stocks de l'établissement Habanera à Marrakech.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("salah.bennani@habanera.com");
  const [password, setPassword] = useState("habanera2026");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/tableau-de-bord", replace: true });
  }, [isAuthenticated, navigate]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Vérifiez votre adresse e-mail et votre mot de passe.");
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      login(email);
      setLoading(false);
      navigate({ to: "/tableau-de-bord", replace: true });
    }, 650);
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{ backgroundImage: "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--primary) 42%, transparent), transparent 45%), radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--sidebar-foreground) 18%, transparent), transparent 50%)" }}
        />
        <div className="relative">
          <p className="font-display text-3xl">Habanera</p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-sidebar-foreground/60">
            Économat · Marrakech
          </p>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl leading-tight">
            Chaque bouteille, chaque gramme, sous contrôle.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/70">
            Suivi des entrées et sorties, alertes de seuil, transferts entre le bar, la cuisine et
            l'économat — en temps réel.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <ShieldCheck className="h-4 w-4" /> Accès réservé au personnel autorisé
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-14">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-3xl">Bon retour</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour reprendre le contrôle de votre économat.
          </p>

          <div className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </div>

          <p className="mt-6 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
            Démo : identifiants pré-remplis pour le compte Administrateur Salah Bennani.
          </p>
        </form>
        <footer className="absolute bottom-5 left-0 right-0 text-center text-xs text-muted-foreground">Ce MVP a été conçu et développé par IZEMX</footer>
      </div>
    </div>
  );
}
