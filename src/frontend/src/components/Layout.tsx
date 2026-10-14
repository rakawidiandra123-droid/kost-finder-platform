import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { type ReactNode, useState } from "react";

const NAV_LINKS = [
  { label: "Beranda", to: "/", hash: undefined },
  { label: "Kamar", to: "/", hash: "kamar" },
  { label: "Fasilitas", to: "/", hash: "fasilitas" },
  { label: "Tentang", to: "/", hash: "tentang" },
] as const;

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isAdmin, signIn, signOut, isInitializing } =
    useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdminArea = pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Link
            to="/"
            data-ocid="nav.brand_link"
            className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground transition-smooth hover:text-primary"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              K
            </span>
            KOSTKU
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                hash={link.hash}
                data-ocid={`nav.${link.label.toLowerCase()}_link`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && isAdmin ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/kamar" data-ocid="nav.admin_dashboard_link">
                    <LayoutDashboard className="size-4" aria-hidden="true" />
                    Dasbor Admin
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="nav.sign_out_button"
                  onClick={signOut}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Keluar
                </Button>
              </>
            ) : isAuthenticated ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="nav.sign_out_button"
                onClick={signOut}
              >
                <LogOut className="size-4" aria-hidden="true" />
                Keluar
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                data-ocid="nav.admin_sign_in_button"
                onClick={signIn}
                disabled={isInitializing}
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Masuk Admin
              </Button>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            data-ocid="nav.mobile_menu_button"
            className="flex size-10 items-center justify-center rounded-lg text-foreground transition-smooth hover:bg-secondary md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border bg-card px-4 py-3 md:hidden">
            <nav aria-label="Navigasi seluler" className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  hash={link.hash}
                  data-ocid={`nav.mobile.${link.label.toLowerCase()}_link`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated && isAdmin ? (
                <Link
                  to="/admin/kamar"
                  data-ocid="nav.mobile.admin_dashboard_link"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-secondary hover:text-foreground"
                >
                  Dasbor Admin
                </Link>
              ) : null}
            </nav>
            <div className="mt-3">
              {isAuthenticated ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  data-ocid="nav.mobile.sign_out_button"
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Keluar
                </Button>
              ) : (
                <Button
                  type="button"
                  className="w-full"
                  data-ocid="nav.mobile.admin_sign_in_button"
                  onClick={() => {
                    signIn();
                    setMobileOpen(false);
                  }}
                  disabled={isInitializing}
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Masuk Admin
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main
        className={cn("flex-1", isAdminArea ? "bg-muted/30" : "bg-background")}
      >
        {children}
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
                K
              </span>
              KOSTKU
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Katalog kamar kost yang bersih dan terpercaya untuk menemukan
              hunian nyaman di Indonesia.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
              Jelajahi
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/"
                  data-ocid="footer.catalog_link"
                  className="transition-smooth hover:text-primary"
                >
                  Katalog Kamar
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  hash="fasilitas"
                  data-ocid="footer.facilities_link"
                  className="transition-smooth hover:text-primary"
                >
                  Fasilitas
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  hash="tentang"
                  data-ocid="footer.about_link"
                  className="transition-smooth hover:text-primary"
                >
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-foreground">
              Kontak
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Jl. Melati No. 12, Yogyakarta</li>
              <li>halo@kostku.id</li>
              <li>(0274) 555-0123</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted-foreground md:px-8">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
