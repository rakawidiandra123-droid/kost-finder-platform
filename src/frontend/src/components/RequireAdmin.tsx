import { LoadingState } from "@/components/StateViews";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

interface SignInPromptProps {
  title?: string;
  description?: string;
}

/** Shown when a visitor must sign in to reach a protected area. */
export function SignInPrompt({
  title = "Masuk untuk melanjutkan",
  description = "Gunakan Internet Identity untuk mengakses area admin.",
}: SignInPromptProps) {
  const { signIn, isInitializing, isLoggingIn, isLoginError, loginError } =
    useAuth();

  return (
    <div
      data-ocid="sign_in_prompt"
      className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-xl border border-border bg-card px-8 py-14 text-center shadow-subtle"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <LogIn className="size-7" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        size="lg"
        data-ocid="sign_in_button"
        onClick={signIn}
        disabled={isInitializing || isLoggingIn}
      >
        {isInitializing
          ? "Menyiapkan…"
          : isLoggingIn
            ? "Menghubungkan…"
            : "Masuk dengan Internet Identity"}
      </Button>
      {isLoginError ? (
        <p role="alert" className="text-sm text-destructive">
          {loginError?.message ?? "Gagal masuk. Silakan coba lagi."}
        </p>
      ) : null}
    </div>
  );
}

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Gates admin-only routes: prompts unauthenticated visitors to sign in and
 * blocks signed-in non-admins with an access-denied message.
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { isAuthenticated, isInitializing, isAdmin, isAdminLoading } =
    useAuth();

  if (isInitializing) {
    return <LoadingState label="Memeriksa sesi…" />;
  }

  if (!isAuthenticated) {
    return <SignInPrompt />;
  }

  if (isAdminLoading) {
    return <LoadingState label="Memeriksa hak akses…" />;
  }

  if (!isAdmin) {
    return (
      <div
        data-ocid="access_denied"
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-8 py-14 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Akses ditolak
          </h1>
          <p className="text-sm text-muted-foreground">
            Akun Anda tidak memiliki hak akses admin untuk halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
