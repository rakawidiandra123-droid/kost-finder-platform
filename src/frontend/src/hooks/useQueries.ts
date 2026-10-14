import { createActor } from "@/backend";
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
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * The generated bindings are regenerated from the backend DID. Until the
 * rooms/bookings mixins are wired into the actor, the generated interface does
 * not yet expose them, so we describe the contract surface here and narrow the
 * actor to it. Once bindgen runs, these signatures match the generated ones.
 */
interface RoomsBookingsActor {
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
}

function asRoomsActor(actor: unknown): RoomsBookingsActor | null {
  return (actor as RoomsBookingsActor | null) ?? null;
}

/**
 * React Query hashes query keys with JSON.stringify, which throws on bigint.
 * Serialize the filter (bigint prices become strings) for the key only; the
 * real RoomFilter is still passed to the backend call.
 */
function serializeRoomFilter(filter: RoomFilter): Record<string, unknown> {
  return {
    keyword: filter.keyword ?? null,
    roomType: filter.roomType ?? null,
    minPrice: filter.minPrice === undefined ? null : filter.minPrice.toString(),
    maxPrice: filter.maxPrice === undefined ? null : filter.maxPrice.toString(),
  };
}

export const roomKeys = {
  all: ["rooms"] as const,
  list: (filter: RoomFilter) =>
    ["rooms", "list", serializeRoomFilter(filter)] as const,
  detail: (id: RoomId) => ["rooms", "detail", id.toString()] as const,
};

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (status: BookingStatus | null) =>
    ["bookings", "list", status ?? "all"] as const,
};

/** Public catalog query — lists rooms matching an optional filter. */
export function useRooms(filter: RoomFilter = {}) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: roomKeys.list(filter),
    queryFn: async () => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor) return [];
      return roomsActor.listRooms(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

/** Public detail query for a single room. */
export function useRoom(id: RoomId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: roomKeys.detail(id ?? 0n),
    queryFn: async () => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor || id === null) return null;
      return roomsActor.getRoom(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RoomInput) => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor) throw new Error("Backend belum siap");
      return roomsActor.createRoom(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}

export function useUpdateRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: RoomId; input: RoomInput }) => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor) throw new Error("Backend belum siap");
      return roomsActor.updateRoom(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}

export function useDeleteRoom() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: RoomId) => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor) throw new Error("Backend belum siap");
      return roomsActor.deleteRoom(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
}

/** Public booking submission — any signed-in caller may request a room. */
export function useCreateBooking() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookingInput) => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor) throw new Error("Backend belum siap");
      return roomsActor.createBooking(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

/** Admin-only query — lists booking requests, optionally filtered by status. */
export function useBookings(status: BookingStatus | null = null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: bookingKeys.list(status),
    queryFn: async () => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor) return [];
      return roomsActor.listBookings(status);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: BookingId;
      status: BookingStatus;
    }) => {
      const roomsActor = asRoomsActor(actor);
      if (!roomsActor) throw new Error("Backend belum siap");
      return roomsActor.updateBookingStatus(id, status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
