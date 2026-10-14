import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { setIdentityForTest } from "@/__tests__/setup";
import { renderWithActor } from "@/__tests__/test-utils";
import { RequireAdmin } from "@/components/RequireAdmin";
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

describe("RequireAdmin", () => {
  it("prompts an unauthenticated visitor to sign in", async () => {
    setIdentityForTest();
    const isCallerAdmin = vi.fn<RoomsBookingsActor["isCallerAdmin"]>();

    renderWithActor(
      <RequireAdmin>
        <div>Konten admin</div>
      </RequireAdmin>,
      { isCallerAdmin },
    );

    expect(
      await screen.findByText("Masuk untuk melanjutkan"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Konten admin")).not.toBeInTheDocument();
    expect(isCallerAdmin).not.toHaveBeenCalled();
  });

  it("denies a signed-in non-admin user", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(false);

    renderWithActor(
      <RequireAdmin>
        <div>Konten admin</div>
      </RequireAdmin>,
      { isCallerAdmin },
    );

    expect(await screen.findByText("Akses ditolak")).toBeInTheDocument();
    expect(screen.queryByText("Konten admin")).not.toBeInTheDocument();
  });

  it("renders the protected content for an admin", async () => {
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(true);

    renderWithActor(
      <RequireAdmin>
        <div>Konten admin</div>
      </RequireAdmin>,
      { isCallerAdmin },
    );

    expect(await screen.findByText("Konten admin")).toBeInTheDocument();
  });

  it("lets a signed-in non-admin claim access and then renders the content", async () => {
    const user = userEvent.setup();
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    const claimAdmin = vi
      .fn<RoomsBookingsActor["claimAdmin"]>()
      .mockResolvedValue(undefined);

    renderWithActor(
      <RequireAdmin>
        <div>Konten admin</div>
      </RequireAdmin>,
      { isCallerAdmin, claimAdmin },
    );

    expect(await screen.findByText("Akses ditolak")).toBeInTheDocument();
    expect(screen.queryByText("Konten admin")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("claim_admin_button"));

    await waitFor(() => expect(claimAdmin).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Konten admin")).toBeInTheDocument();
  });

  it("shows the claim error when the backend rejects the claim", async () => {
    const user = userEvent.setup();
    setIdentityForTest({ identity: signedInIdentity() });
    const isCallerAdmin = vi
      .fn<RoomsBookingsActor["isCallerAdmin"]>()
      .mockResolvedValue(false);
    const claimAdmin = vi
      .fn<RoomsBookingsActor["claimAdmin"]>()
      .mockRejectedValue(new Error("Admin sudah ditetapkan"));

    renderWithActor(
      <RequireAdmin>
        <div>Konten admin</div>
      </RequireAdmin>,
      { isCallerAdmin, claimAdmin },
    );

    expect(await screen.findByText("Akses ditolak")).toBeInTheDocument();

    await user.click(screen.getByTestId("claim_admin_button"));

    expect(
      await screen.findByText("Admin sudah ditetapkan"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Konten admin")).not.toBeInTheDocument();
  });
});
