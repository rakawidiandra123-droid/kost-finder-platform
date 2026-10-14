import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { makeRoom } from "@/__tests__/fixtures";
import { setActorForTest } from "@/__tests__/setup";
import BookingPage from "@/pages/BookingPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

function renderBooking(
  actor: Pick<RoomsBookingsActor, "getRoom" | "createBooking">,
  roomId = "1",
) {
  setActorForTest(actor);
  const rootRoute = createRootRoute();
  const bookingRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/kamar/$roomId/pesan",
    component: BookingPage,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([bookingRoute]),
    history: createMemoryHistory({
      initialEntries: [`/kamar/${roomId}/pesan`],
    }),
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

describe("BookingPage", () => {
  it("submits a valid booking and shows the pending confirmation", async () => {
    const user = userEvent.setup();
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockResolvedValue(makeRoom({ name: "Kamar A1" }));
    const createBooking = vi
      .fn<RoomsBookingsActor["createBooking"]>()
      .mockResolvedValue({
        id: 1n,
        applicantName: "Budi Santoso",
        phone: "081234567890",
        email: "budi@example.com",
        moveInDate: "2026-11-01",
        message: "",
        roomId: 1n,
        status: "pending",
        createdAt: 1_700_000_000_000_000_000n,
      });

    renderBooking({ getRoom, createBooking });

    await user.type(
      await screen.findByTestId("booking.name_input"),
      "Budi Santoso",
    );
    await user.type(screen.getByTestId("booking.phone_input"), "081234567890");
    await user.type(
      screen.getByTestId("booking.email_input"),
      "budi@example.com",
    );
    await user.type(
      screen.getByTestId("booking.move_in_date_input"),
      "2026-11-01",
    );
    await user.click(screen.getByTestId("booking.submit_button"));

    expect(
      await screen.findByText("Permintaan pemesanan diterima"),
    ).toBeInTheDocument();
    expect(screen.getByText("Status: Menunggu")).toBeInTheDocument();
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        applicantName: "Budi Santoso",
        phone: "081234567890",
        email: "budi@example.com",
        moveInDate: "2026-11-01",
        roomId: 1n,
      }),
    );
  });

  it("blocks submission and shows validation errors for an empty form", async () => {
    const user = userEvent.setup();
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockResolvedValue(makeRoom());
    const createBooking = vi.fn<RoomsBookingsActor["createBooking"]>();

    renderBooking({ getRoom, createBooking });

    await user.click(await screen.findByTestId("booking.submit_button"));

    expect(
      await screen.findByText("Nama lengkap wajib diisi."),
    ).toBeInTheDocument();
    expect(screen.getByText("Nomor telepon wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Email wajib diisi.")).toBeInTheDocument();
    expect(
      screen.getByText("Tanggal rencana masuk wajib diisi."),
    ).toBeInTheDocument();
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("rejects an invalid email and phone format", async () => {
    const user = userEvent.setup();
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockResolvedValue(makeRoom());
    const createBooking = vi.fn<RoomsBookingsActor["createBooking"]>();

    renderBooking({ getRoom, createBooking });

    await user.type(await screen.findByTestId("booking.name_input"), "Budi");
    await user.type(screen.getByTestId("booking.phone_input"), "12345");
    await user.type(screen.getByTestId("booking.email_input"), "not-an-email");
    await user.type(
      screen.getByTestId("booking.move_in_date_input"),
      "2026-11-01",
    );
    await user.click(screen.getByTestId("booking.submit_button"));

    expect(
      await screen.findByText(
        "Gunakan format nomor Indonesia, mis. 081234567890.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Format email tidak valid.")).toBeInTheDocument();
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("refuses to book an occupied room", async () => {
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockResolvedValue(makeRoom({ name: "Kamar B2", status: "occupied" }));
    const createBooking = vi.fn<RoomsBookingsActor["createBooking"]>();

    renderBooking({ getRoom, createBooking });

    expect(await screen.findByText("Kamar sudah terisi")).toBeInTheDocument();
    expect(screen.queryByTestId("booking.form")).not.toBeInTheDocument();
  });

  it("shows an error state when the booking submission fails", async () => {
    const user = userEvent.setup();
    const getRoom = vi
      .fn<RoomsBookingsActor["getRoom"]>()
      .mockResolvedValue(makeRoom());
    const createBooking = vi
      .fn<RoomsBookingsActor["createBooking"]>()
      .mockRejectedValue(new Error("boom"));

    renderBooking({ getRoom, createBooking });

    await user.type(
      await screen.findByTestId("booking.name_input"),
      "Budi Santoso",
    );
    await user.type(screen.getByTestId("booking.phone_input"), "081234567890");
    await user.type(
      screen.getByTestId("booking.email_input"),
      "budi@example.com",
    );
    await user.type(
      screen.getByTestId("booking.move_in_date_input"),
      "2026-11-01",
    );
    await user.click(screen.getByTestId("booking.submit_button"));

    expect(
      await screen.findByTestId("booking.error_state"),
    ).toBeInTheDocument();
    await waitFor(() => expect(createBooking).toHaveBeenCalled());
  });
});
