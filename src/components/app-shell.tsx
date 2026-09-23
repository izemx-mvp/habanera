import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Repeat,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/stock", label: "Stock économat", icon: Boxes },
  { to: "/mouvements", label: "Mouvements", icon: Repeat },
  { to: "/utilisateurs", label: "Gestion des utilisateurs", icon: Users },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/", replace: true });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground md:flex">
        <div className="px-2">
          <p className="font-display text-2xl leading-none">Habanera</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
            Économat · Marrakech
          </p>
        </div>

        <nav className="mt-9 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-xl bg-sidebar-accent/60 p-4 text-xs text-sidebar-foreground/75">
          <p className="font-medium text-sidebar-foreground">Inventaire hebdomadaire</p>
          <p className="mt-1">Prochain comptage : vendredi 18:00</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border/70 bg-background/85 px-6 py-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors duration-200 hover:bg-secondary">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials(user.nom)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-medium leading-tight">{user.nom}</span>
                <span className="block text-[11px] leading-tight text-muted-foreground">
                  {user.role}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/parametres" })}>
                <Settings className="mr-2 h-4 w-4" /> Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => {
                  logout();
                  navigate({ to: "/", replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-6 py-7">{children}</main>
      </div>
    </div>
  );
}
