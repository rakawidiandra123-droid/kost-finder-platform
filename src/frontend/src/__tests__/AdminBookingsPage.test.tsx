import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { makeBooking, makeRoom } from "@/__tests__/fixtures";
import { renderWithActor } from "@/__tests__/test-utils";
import AdminBookingsPage from "@/pages/AdminBookingsPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("AdminBookingsPage", () => {
  it("lists a submitted booking with applicant, contact, room, and date", async () => {
    const listBookings = vi
      .fn<RoomsBookingsActor["listBookings"]>()
      .mockResolvedValue([
        makeBooking({
          id: 1n,
          applicantName: "Budi Santoso",
          phone: "081234567890",
          email: "budi@example.com",
          roomId: 1n,
          status: "pending",
        }),
      ]);
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([makeRoom({ id: 1n, name: "Kamar A1" })]);

    renderWithActor(<AdminBookingsPage />, { listBookings, listRooms });

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("081234567890")).toBeInTheDocument();
    expect(screen.getByText("budi@example.com")).toBeInTheDocument();
    expect(screen.getByText("Kamar A1")).toBeInTheDocument();
    const card = screen.getByTestId("booking.item.1");
    expect(within(card).getByText("Menunggu")).toBeInTheDocument();
  });

  it("approves a pending booking through the backend", async () => {
    const user = userEvent.setup();
    const listBookings = vi
      .fn<RoomsBookingsActor["listBookings"]>()
      .mockResolvedValue([makeBooking({ id: 1n, status: "pending" })]);
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([makeRoom({ id: 1n, name: "Kamar A1" })]);
    const updateBookingStatus = vi
      .fn<RoomsBookingsActor["updateBookingStatus"]>()
      .mockResolvedValue(makeBooking({ id: 1n, status: "approved" }));

    renderWithActor(<AdminBookingsPage />, {
      listBookings,
      listRooms,
      updateBookingStatus,
    });

    await user.click(await screen.findByTestId("booking.approve_button.1"));

    await waitFor(() => expect(updateBookingStatus).toHaveBeenCalled());
    expect(updateBookingStatus).toHaveBeenCalledWith(1n, "approved");
  });

  it("filters bookings by status through the backend", async () => {
    const user = userEvent.setup();
    const listBookings = vi
      .fn<RoomsBookingsActor["listBookings"]>()
      .mockResolvedValue([]);
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([]);

    renderWithActor(<AdminBookingsPage />, { listBookings, listRooms });

    await screen.findByTestId("booking.filter.tab.approved");
    await user.click(screen.getByTestId("booking.filter.tab.approved"));

    await waitFor(() => expect(listBookings).toHaveBeenCalledWith("approved"));
  });

  it("shows an empty state when there are no bookings", async () => {
    const listBookings = vi
      .fn<RoomsBookingsActor["listBookings"]>()
      .mockResolvedValue([]);
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([]);

    renderWithActor(<AdminBookingsPage />, { listBookings, listRooms });

    expect(
      await screen.findByText("Belum ada permintaan sewa"),
    ).toBeInTheDocument();
  });
});
