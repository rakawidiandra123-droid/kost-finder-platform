import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { makeRoom } from "@/__tests__/fixtures";
import { renderWithActor } from "@/__tests__/test-utils";
import CatalogPage from "@/pages/CatalogPage";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { setActorForTest } from "@/__tests__/setup";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
/**
 * The catalog route reads its filter from the router's search state. These
 * tests render the page inside a minimal router so `useSearch`/`useNavigate`
 * behave as they do in the app, without booting the full route tree.
 */
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";

function renderCatalog(
  actor: Pick<RoomsBookingsActor, "listRooms">,
  initialEntries: string[] = ["/"],
) {
  setActorForTest(actor);
  const rootRoute = createRootRoute();
  const catalogRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: CatalogPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([catalogRoute]),
    history: createMemoryHistory({ initialEntries }),
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
    router,
    queryClient,
  };
}

describe("CatalogPage", () => {
  it("renders the room list with name, type, and monthly price", async () => {
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([
        makeRoom({ id: 1n, name: "Kamar A1", roomType: "putra" }),
        makeRoom({
          id: 2n,
          name: "Kamar B2",
          roomType: "putri",
          monthlyPrice: 900_000n,
          status: "occupied",
        }),
      ]);

    renderCatalog({ listRooms });

    expect(await screen.findByText("Kamar A1")).toBeInTheDocument();
    expect(screen.getByText("Kamar B2")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.500.000 / bulan")).toBeInTheDocument();
    expect(screen.getByText("Rp 900.000 / bulan")).toBeInTheDocument();
    expect(screen.getByText("2 kamar ditemukan")).toBeInTheDocument();
  });

  it("marks an occupied room as Terisi and disables its booking action", async () => {
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([
        makeRoom({ id: 2n, name: "Kamar B2", status: "occupied" }),
      ]);

    renderCatalog({ listRooms });

    expect(await screen.findByText("Kamar B2")).toBeInTheDocument();
    const bookButton = screen.getByTestId("room.book_button.1");
    expect(bookButton).toBeDisabled();
    expect(bookButton).toHaveTextContent("Terisi");
  });

  it("shows an empty state when no rooms match", async () => {
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([]);

    renderCatalog({ listRooms });

    expect(
      await screen.findByText("Tidak ada kamar yang cocok"),
    ).toBeInTheDocument();
  });

  it("shows an error state with retry when the query fails", async () => {
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockRejectedValue(new Error("boom"));

    renderCatalog({ listRooms });

    expect(await screen.findByText("Gagal memuat kamar")).toBeInTheDocument();
    expect(screen.getByTestId("retry_button")).toBeInTheDocument();
  });

  it("passes the keyword from the URL to the backend filter", async () => {
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([makeRoom({ name: "Kamar A1" })]);

    renderCatalog({ listRooms }, ["/?q=A1"]);

    await waitFor(() => expect(listRooms).toHaveBeenCalled());
    expect(listRooms).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "A1" }),
    );
  });

  it("passes type and price filters from the URL to the backend", async () => {
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([]);

    renderCatalog({ listRooms }, ["/?tipe=putri&min=1000000&max=1500000"]);

    await waitFor(() => expect(listRooms).toHaveBeenCalled());
    expect(listRooms).toHaveBeenCalledWith({
      roomType: "putri",
      minPrice: 1_000_000n,
      maxPrice: 1_500_000n,
    });
  });

  it("commits a typed keyword to the URL on submit", async () => {
    const user = userEvent.setup();
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([makeRoom()]);

    const { router } = renderCatalog({ listRooms });

    const input = await screen.findByTestId("catalog.search_input");
    await user.type(input, "B2");
    await user.click(screen.getByTestId("catalog.search_button"));

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ q: "B2" }),
    );
  });
});
