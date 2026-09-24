import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronsUpDown, LogOut, Menu, Settings, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials, useAuth } from "@/lib/auth";
import { canAccess, ROLE_SPACES, SPACE_HOME, SPACE_LABEL, SPACE_NAV, type Space } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function NavLinks({ pathname, space, close }: { pathname: string; space: Space; close?: () => void }) {
  return <nav className="mt-5 flex flex-1 flex-col gap-1 overflow-y-auto">{SPACE_NAV[space].map((item) => {
    const active = pathname === item.to;
    return <Link key={item.to} to={item.to} onClick={close} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors duration-200", active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} /><span>{item.label}</span></Link>;
  })}</nav>;
}

function SpaceSwitch({ close }: { close?: () => void }) {
  const { user, space, setSpace } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const spaces = ROLE_SPACES[user.role];
  return <div className="mt-6 px-1">
    <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/50">Espace</p>
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Changer d'espace" className="mt-2 flex w-full items-center justify-between rounded-md border border-sidebar-foreground/15 bg-sidebar-accent/40 px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent">
        <span>{SPACE_LABEL[space]}</span><ChevronsUpDown className="h-4 w-4 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {spaces.map((s) => <DropdownMenuItem key={s} onSelect={() => { setSpace(s); close?.(); navigate({ to: SPACE_HOME[s] }); }} className="justify-between">{SPACE_LABEL[s]}{s === space && <Check className="h-4 w-4" />}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>;
}

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { space } = useAuth();
  const allowed = user ? canAccess(user.role, pathname) : false;
  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/", replace: true });
    else if (user && !allowed) { toast.error("Accès non autorisé pour votre profil."); navigate({ to: SPACE_HOME[space], replace: true }); }
  }, [isAuthenticated, allowed, user, space, navigate]);

  if (!isAuthenticated || !user || !allowed) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen && <button aria-label="Fermer la navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-foreground/45 md:hidden" />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="px-2">
          <div className="flex items-start justify-between"><div><p className="font-display text-2xl leading-none">Habanera</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
            Économat · Marrakech
          </p></div><Button variant="ghost" size="icon" className="text-sidebar-foreground md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fermer"><X className="h-5 w-5" /></Button></div>
        </div>
        <SpaceSwitch close={() => setMobileOpen(false)} />
        <NavLinks pathname={pathname} space={space} close={() => setMobileOpen(false)} />
        <Button variant="ghost" className="justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => { logout(); navigate({ to: "/", replace: true }); }}><LogOut className="mr-3 h-4 w-4" /> Se déconnecter</Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border/70 bg-background/85 px-4 py-4 backdrop-blur sm:px-6 md:flex-nowrap md:gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir la navigation"><Menu className="h-5 w-5" /></Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {action && <div className="order-last flex w-full justify-end md:order-none md:w-auto">{action}</div>}
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
              <DropdownMenuLabel><span className="block text-sm">{user.nom}</span><span className="block text-xs font-normal text-muted-foreground">{user.role} · {user.email}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate({ to: "/parametres" })}>
                <Settings className="mr-2 h-4 w-4" /> Paramètres du compte
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

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-7">{children}</main>
        <footer className="border-t border-border/60 px-6 py-5 text-center text-xs text-muted-foreground">Ce MVP a été conçu et développé par IZEMX</footer>
      </div>
    </div>
  );
}
