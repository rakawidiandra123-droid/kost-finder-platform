import { createActor } from "@/backend";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Authentication + admin-role state for the whole app.
 *
 * `isAuthenticated` covers both a fresh Internet Identity login and a session
 * restored on page reload. `isAdmin` is resolved from the backend and is only
 * queried once the caller is authenticated.
 */
export function useAuth() {
  const {
    identity,
    login,
    clear,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
  } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { actor, isFetching } = useActor(createActor);

  const adminQuery = useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    retry: false,
  });

  const handleSignIn = () => {
    login();
  };

  const handleSignOut = () => {
    clear();
    queryClient.clear();
  };

  return {
    identity,
    isAuthenticated,
    isInitializing,
    isLoggingIn,
    isLoginError,
    loginError,
    isAdmin: adminQuery.data ?? false,
    isAdminLoading: isAuthenticated && adminQuery.isLoading,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };
}
