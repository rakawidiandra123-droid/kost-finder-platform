import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { setActorForTest, setIdentityForTest } from "@/__tests__/setup";
import { Layout } from "@/components/Layout";
import type { InternetIdentityContext } from "@caffeineai/core-infrastructure";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/** A minimal non-anonymous identity so `isAuthenticated` is true. */
function signedInIdentity(): InternetIdentityContext["identity"] {
  return {
    getPrincipal: () => ({ isAnonymous: () => false }),
  } as unknown as InternetIdentityContext["identity"];
}

/**
 * Renders `Layout` inside a minimal router so `useRouterState` resolves, with
 * the actor seam installed for the admin query the header consumes.
 */
function renderLayout(
  actor: Pick<RoomsBookingsActor, "isCallerAdmin">,
  initialEntries: string[] = ["/"],
) {
  setActorForTest(actor);
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <Layout>Konten</Layout>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries }),
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe("Layout admin navigation", () => {
  it("offers sign-in to an unauthenticated visitor", async () => {
    setIdentityForTest();
    const isCallerAdmin = vi.fn<RoomsBookingsActor["isCallerAdmin"]>();

    renderLayout({ isCallerAdmin });

    expect(
      await screen.findByTestId("nav.admin_sign_in_button"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("nav.admin_dashboard_link"),
    ).not.toBeInTheDocument();
    expect(isCallerAdmin).not.toHaveBeenCalled();
  });

  it("shows the admin dashboard link to an authenticated admin", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(true);

    renderLayout({ isCallerAdmin });

    expect(
      await screen.findByTestId("nav.admin_dashboard_link"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("nav.sign_out_button")).toBeInTheDocument();
  });

  it("hides the admin dashboard link from a signed-in non-admin", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(false);

    renderLayout({ isCallerAdmin });

    await waitFor(() => expect(isCallerAdmin).toHaveBeenCalled());
    expect(
      screen.queryByTestId("nav.admin_dashboard_link"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("nav.sign_out_button")).toBeInTheDocument();
  });

  it("offers a signed-in non-admin the claim-admin action", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(false);

    renderLayout({ isCallerAdmin });

    expect(
      await screen.findByTestId("nav.claim_admin_button"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("nav.admin_dashboard_link"),
    ).not.toBeInTheDocument();
  });
});
