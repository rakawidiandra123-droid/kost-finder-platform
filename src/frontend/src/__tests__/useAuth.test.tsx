import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { setIdentityForTest } from "@/__tests__/setup";
import { renderWithActor } from "@/__tests__/test-utils";
import { useAuth } from "@/hooks/useAuth";
import type { InternetIdentityContext } from "@caffeineai/core-infrastructure";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/** A minimal non-anonymous identity so `isAuthenticated` is true. */
function signedInIdentity(): InternetIdentityContext["identity"] {
  return {
    getPrincipal: () => ({ isAnonymous: () => false }),
  } as unknown as InternetIdentityContext["identity"];
}

/**
 * Renders the hook's observable state as text so assertions read the same
 * contract the admin gate consumes: `isAdmin` is the backend's answer, and the
 * admin query is only issued once the caller is authenticated.
 */
function AuthProbe() {
  const {
    isAdmin,
    isAdminLoading,
    isAuthenticated,
    signOut,
    claimAdmin,
    isClaimingAdmin,
    claimAdminError,
  } = useAuth();
  return (
    <div>
      <span data-ocid="auth.authenticated">{String(isAuthenticated)}</span>
      <span data-ocid="auth.admin">{String(isAdmin)}</span>
      <span data-ocid="auth.admin_loading">{String(isAdminLoading)}</span>
      <span data-ocid="auth.claiming">{String(isClaimingAdmin)}</span>
      <span data-ocid="auth.claim_error">{claimAdminError?.message ?? ""}</span>
      <button type="button" data-ocid="auth.claim_admin" onClick={claimAdmin}>
        Klaim akses admin
      </button>
      <button type="button" data-ocid="auth.sign_out" onClick={signOut}>
        Keluar
      </button>
    </div>
  );
}

describe("useAuth", () => {
  it("does not query admin status for an unauthenticated visitor", async () => {
    setIdentityForTest();
    const isCallerAdmin = vi.fn<RoomsBookingsActor["isCallerAdmin"]>();

    renderWithActor(<AuthProbe />, { isCallerAdmin });

    expect(screen.getByTestId("auth.authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("auth.admin")).toHaveTextContent("false");
    expect(isCallerAdmin).not.toHaveBeenCalled();
  });

  it("resolves isAdmin from the backend for an authenticated admin", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(true);

    renderWithActor(<AuthProbe />, { isCallerAdmin });

    await waitFor(() =>
      expect(screen.getByTestId("auth.admin")).toHaveTextContent("true"),
    );
    expect(isCallerAdmin).toHaveBeenCalledTimes(1);
  });

  it("reports a signed-in non-admin as not admin", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(false);

    renderWithActor(<AuthProbe />, { isCallerAdmin });

    await waitFor(() => expect(isCallerAdmin).toHaveBeenCalled());
    expect(screen.getByTestId("auth.admin")).toHaveTextContent("false");
  });

  it("calls the backend claimAdmin endpoint and re-reads admin status", async () => {
    const user = userEvent.setup();
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    const claimAdmin = vi
      .fn<RoomsBookingsActor["claimAdmin"]>()
      .mockResolvedValue(undefined);

    renderWithActor(<AuthProbe />, { isCallerAdmin, claimAdmin });

    await waitFor(() =>
      expect(screen.getByTestId("auth.admin")).toHaveTextContent("false"),
    );

    await user.click(screen.getByTestId("auth.claim_admin"));

    await waitFor(() => expect(claimAdmin).toHaveBeenCalledTimes(1));
    // The successful claim invalidates the cached answer, so the hook re-reads
    // the backend and the caller is now reported as admin.
    await waitFor(() =>
      expect(screen.getByTestId("auth.admin")).toHaveTextContent("true"),
    );
    expect(isCallerAdmin).toHaveBeenCalledTimes(2);
  });

  it("surfaces a claim failure without reporting the caller as admin", async () => {
    const user = userEvent.setup();
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(false);
    const claimAdmin = vi
      .fn<RoomsBookingsActor["claimAdmin"]>()
      .mockRejectedValue(new Error("Admin sudah ditetapkan"));

    renderWithActor(<AuthProbe />, { isCallerAdmin, claimAdmin });

    await waitFor(() =>
      expect(screen.getByTestId("auth.admin")).toHaveTextContent("false"),
    );

    await user.click(screen.getByTestId("auth.claim_admin"));

    await waitFor(() =>
      expect(screen.getByTestId("auth.claim_error")).toHaveTextContent(
        "Admin sudah ditetapkan",
      ),
    );
    expect(screen.getByTestId("auth.admin")).toHaveTextContent("false");
  });

  it("clears the cached admin answer on sign out", async () => {
    const user = userEvent.setup();
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(true);

    const { queryClient } = renderWithActor(<AuthProbe />, { isCallerAdmin });

    await waitFor(() =>
      expect(screen.getByTestId("auth.admin")).toHaveTextContent("true"),
    );

    await user.click(screen.getByTestId("auth.sign_out"));

    await waitFor(() =>
      expect(queryClient.getQueryData(["isCallerAdmin"])).toBeUndefined(),
    );
  });
});
