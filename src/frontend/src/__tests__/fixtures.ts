import type {
  BookingId,
  BookingInput,
  BookingRequest,
  BookingStatus,
  Room,
  RoomFilter,
  RoomId,
  RoomInput,
} from "@/types";
import type { ExternalBlob } from "@caffeineai/object-storage";

/**
 * The actor contract the app's own hooks consume. `useQueries.ts` narrows the
 * generated actor to this `@/types`-shaped surface, so the components under
 * test read these shapes — not the generated enum-based `backendInterface`.
 * Typing the mocks against this contract keeps fixtures and assertions aligned
 * with what the UI actually renders.
 */
export interface RoomsBookingsActor {
  listRooms(filter: RoomFilter): Promise<Room[]>;
  getRoom(id: RoomId): Promise<Room | null>;
  createRoom(input: RoomInput): Promise<Room>;
  updateRoom(id: RoomId, input: RoomInput): Promise<Room | null>;
  deleteRoom(id: RoomId): Promise<boolean>;
  createBooking(input: BookingInput): Promise<BookingRequest>;
  listBookings(status: BookingStatus | null): Promise<BookingRequest[]>;
  updateBookingStatus(
    id: BookingId,
    status: BookingStatus,
  ): Promise<BookingRequest | null>;
  isCallerAdmin(): Promise<boolean>;
  claimAdmin(): Promise<void>;
}

/**
 * A photo stand-in for the app's `ExternalBlob` seam. Components only ever call
 * `getDirectURL()` (and `filename` in the admin form), so a typed object with
 * those members is enough and keeps the test free of the real upload transport.
 */
export function fakePhoto(url: string, filename = "foto.jpg"): ExternalBlob {
  return {
    getDirectURL: () => url,
    filename,
  } as unknown as ExternalBlob;
}

export function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 1n,
    name: "Kamar A1",
    roomType: "putra",
    monthlyPrice: 1_500_000n,
    description: "Kamar nyaman dengan AC.",
    facilities: ["AC", "WiFi"],
    status: "available",
    photos: [fakePhoto("https://example.test/a1.jpg")],
    ...overrides,
  };
}

export function makeBooking(
  overrides: Partial<BookingRequest> = {},
): BookingRequest {
  return {
    id: 1n,
    applicantName: "Budi Santoso",
    phone: "081234567890",
    email: "budi@example.com",
    moveInDate: "2026-11-01",
    message: "Tolong lantai dua",
    roomId: 1n,
    status: "pending",
    createdAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}
