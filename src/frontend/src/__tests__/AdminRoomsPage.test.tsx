import type { RoomsBookingsActor } from "@/__tests__/fixtures";
import { makeRoom } from "@/__tests__/fixtures";
import { renderWithActor } from "@/__tests__/test-utils";
import AdminRoomsPage from "@/pages/AdminRoomsPage";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("AdminRoomsPage", () => {
  it("lists rooms and toggles availability through the backend", async () => {
    const user = userEvent.setup();
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([makeRoom({ id: 1n, name: "Kamar A1" })]);
    const updateRoom = vi
      .fn<RoomsBookingsActor["updateRoom"]>()
      .mockResolvedValue(
        makeRoom({ id: 1n, name: "Kamar A1", status: "occupied" }),
      );

    renderWithActor(<AdminRoomsPage />, { listRooms, updateRoom });

    expect(await screen.findByText("Kamar A1")).toBeInTheDocument();
    await user.click(screen.getByTestId("admin_rooms.toggle_button.1"));

    await waitFor(() => expect(updateRoom).toHaveBeenCalled());
    expect(updateRoom).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ status: "occupied" }),
    );
  });

  it("creates a room from the add dialog", async () => {
    const user = userEvent.setup();
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([]);
    const createRoom = vi
      .fn<RoomsBookingsActor["createRoom"]>()
      .mockResolvedValue(makeRoom({ id: 5n, name: "Kamar Baru" }));

    renderWithActor(<AdminRoomsPage />, { listRooms, createRoom });

    await user.click(await screen.findByTestId("admin_rooms.add_button"));
    await user.type(
      await screen.findByTestId("room_form.name_input"),
      "Kamar Baru",
    );
    await user.type(screen.getByTestId("room_form.price_input"), "1500000");
    await user.click(screen.getByTestId("room_form.submit_button"));

    await waitFor(() => expect(createRoom).toHaveBeenCalled());
    expect(createRoom).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Kamar Baru", monthlyPrice: 1_500_000n }),
    );
  });

  it("requires confirmation before deleting a room", async () => {
    const user = userEvent.setup();
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([makeRoom({ id: 1n, name: "Kamar A1" })]);
    const deleteRoom = vi
      .fn<RoomsBookingsActor["deleteRoom"]>()
      .mockResolvedValue(true);

    renderWithActor(<AdminRoomsPage />, { listRooms, deleteRoom });

    await user.click(await screen.findByTestId("admin_rooms.delete_button.1"));

    const dialog = await screen.findByTestId("admin_rooms.delete_dialog");
    expect(within(dialog).getByText("Hapus kamar ini?")).toBeInTheDocument();
    expect(deleteRoom).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("admin_rooms.delete_confirm_button"));
    await waitFor(() => expect(deleteRoom).toHaveBeenCalledWith(1n));
  });

  it("shows an empty state when there are no rooms", async () => {
    const listRooms = vi
      .fn<RoomsBookingsActor["listRooms"]>()
      .mockResolvedValue([]);

    renderWithActor(<AdminRoomsPage />, { listRooms });

    expect(await screen.findByText("Belum ada kamar")).toBeInTheDocument();
  });
});
