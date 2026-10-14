import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { makeRoom } from "@/__tests__/fixtures";
import { setActorForTest } from "@/__tests__/setup";
import RoomDetailPage from "@/pages/RoomDetailPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

function renderDetail(
  actor: Pick<RoomsBookingsActor, "getRoom">,
  roomId = "1",
) {
  setActorForTest(actor);
  const rootRoute = createRootRoute();
  const detailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/kamar/$roomId",
    component: RoomDetailPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([detailRoute]),
    history: createMemoryHistory({ initialEntries: [`/kamar/${roomId}`] }),
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

describe("RoomDetailPage", () => {
  it("shows gallery, description, facilities, type, price, and availability", async () => {
    const getRoom = vi.fn<RoomsBookingsActor["getRoom"]>().mockResolvedValue(
      makeRoom({
        name: "Kamar A1",
        roomType: "putra",
        monthlyPrice: 1_500_000n,
        description: "Kamar luas dengan jendela.",
        facilities: ["AC", "WiFi", "Kamar mandi dalam"],
        status: "available",
      }),
    );

    renderDetail({ getRoom });

    expect(await screen.findByText("Kamar A1")).toBeInTheDocument();
    expect(screen.getByText("Kamar luas dengan jendela.")).toBeInTheDocument();
    expect(screen.getByText("AC")).toBeInTheDocument();
    expect(screen.getByText("WiFi")).toBeInTheDocument();
    expect(screen.getByText("Rp 1.500.000 / bulan")).toBeInTheDocument();
    expect(screen.getByTestId("room.gallery_image")).toBeInTheDocument();
    expect(screen.getByTestId("room.book_button")).toHaveTextContent(
      "Ajukan Sewa",
    );
  });

  it("shows an unavailable notice and no active booking for an occupied room", async () => {
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockResolvedValue(makeRoom({ name: "Kamar B2", status: "occupied" }));

    renderDetail({ getRoom });

    expect(await screen.findByText("Kamar B2")).toBeInTheDocument();
    expect(
      screen.getByText("Kamar ini sedang tidak tersedia"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("room.book_button")).toBeDisabled();
  });

  it("shows a not-found state when the room does not exist", async () => {
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockResolvedValue(null);

    renderDetail({ getRoom });

    expect(
      await screen.findByText("Kamar tidak ditemukan"),
    ).toBeInTheDocument();
  });

  it("shows an error state when the room query fails", async () => {
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockRejectedValue(new Error("boom"));

    renderDetail({ getRoom });

    expect(await screen.findByText("Gagal memuat kamar")).toBeInTheDocument();
  });
});
